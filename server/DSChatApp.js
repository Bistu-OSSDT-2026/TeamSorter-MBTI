// DSChatApp.js
import express from "express";
import OpenAI from "openai";

// 内存保存用户对话历史（仅短期，重启会清空）
const conversationMemory = {};

export function registerDSChatAppRoutes(app) {
  const router = express.Router();

router.post("/api/chat-app", async (req, res) => {
  const { url, token, loginToken, systemMessageInfo, message } = req.body;

  if (!message) return res.status(400).json({ error: "消息不能为空" });

  if (!conversationMemory[loginToken]) conversationMemory[loginToken] = [];
  const history = conversationMemory[loginToken].slice(-5);
  const messages = [
    { role: "system", content: systemMessageInfo },
    ...history,
    { role: "user", content: message },
  ];

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const sendSSE = (data) => {
    try {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch (err) {
      console.error("SSE 写入失败：", err);
    }
  };

  try {
    const client = new OpenAI({ baseURL: url, apiKey: token });
    const completion = await client.chat.completions.create({
      model: "deepseek-chat",
      messages,
      stream: true,
    });

    let assistantContent = "";

    for await (const event of completion) {
      const delta = event.choices?.[0]?.delta;
      if (!delta) continue;

      // 累加内容
      assistantContent += delta.content || "";

      sendSSE({
        id: event.id,
        content: delta.content || null,
        reasoning_content: delta.reasoning_content || null,
      });
    }

    // 流结束，发送结束标记
    sendSSE("[DONE]");
    res.end();

    // 保存历史
    conversationMemory[loginToken].push({ role: "user", content: message });
    conversationMemory[loginToken].push({ role: "assistant", content: assistantContent });

  } catch (err) {
    console.error("DeepSeek 流式调用失败:", err);
    sendSSE({ error: "DeepSeek API 调用失败", message: err.message });
    res.end();
  }
});


  app.use(router);
}
