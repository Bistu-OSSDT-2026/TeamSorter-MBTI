import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import OpenAI from "openai";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
//import { Qianfan } from "qianfan";
import User from "./models/User.js";
import App from "./models/App.js";
import AppCategory from "./models/AppCategory.js";
import AiCategory from "./models/AiCategory.js";
import AppMeta from "./models/AppMeta.js";
import AppDialogues from "./models/AppDialogues.js";
import bodyParser from "body-parser";
import { registerFileRoutes } from "./fileRoutes.js";
import { registerDSChatAppRoutes } from "./DSChatApp.js"; // 新增

// ✅ 创建 Express 实例
const app = express();
// CORS 允许所有来源访问
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
// ✅ 使用中间件
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ✅ 注册文件上传/DeepSeek路由
registerFileRoutes(app);
registerDSChatAppRoutes(app); // 新增挂载

// 2. 配置 DeepSeek API
const openai = new OpenAI({
  baseURL: "https://api.deepseek.com",
  apiKey: "sk-29bd629c04f64da3a03c5a968c429617" // 替换成你的 Key
});

// 3. 连接 MongoDB
mongoose
  .connect("mongodb://127.0.0.1:27017/myapp", {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(async () => {
    console.log("✅ MongoDB 连接成功");
    
    // 🚀 初始化默认管理员
    try {
      const existingAdmin = await User.findOne({ username: "admin" });
      if (!existingAdmin) {
        const passwordHash = await bcrypt.hash("admin123", 10);
        const adminUser = new User({
          username: "admin",
          email: "admin@example.com",
          passwordHash,
          role: "admin",
          profile: { bio: "系统默认管理员" }
        });
        await adminUser.save();
        console.log("✅ 默认管理员已创建: 用户名=admin, 密码=admin123");
      } else {
        console.log("ℹ️ 管理员已存在，跳过初始化");
      }
    } catch (err) {
      console.error("初始化管理员失败:", err);
    }
  })
  .catch((err) => console.error("❌ MongoDB 连接失败", err));

// 4. 测试接口
app.get("/", (req, res) => {
  res.send("后端服务运行正常");
});

// 5. 启动服务
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// 6. 用户注册接口
app.post("/api/register", async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) return res.status(400).json({ error: "用户名或邮箱已存在" });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = new User({ username, email, passwordHash, role });
    await user.save();

    res.json({ message: "注册成功" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "注册失败" });
  }
});

// 7. 用户登录接口
app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ error: "用户不存在" });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(400).json({ error: "密码错误" });

    const token = jwt.sign({ id: user._id, username: user.username }, "your_jwt_secret", {
      expiresIn: "7d"
    });

    res.json({ token, username: user.username, role: user.role, id: user._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "登录失败" });
  }
});

// 8. 查询所有用户（仅测试用）
app.get("/users", async (req, res) => {
  try {
    const users = await User.find({}, "-passwordHash");
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "查询用户失败" });
  }
});

// 9. DeepSeek 对话接口（优化版）
app.post("/api/chat", async (req, res) => {
  // 内存保存用户对话历史（仅短期，重启会清空）
  const conversationMemory = {};

  // 系统角色指令
  const systemMessage = {
    role: "system",
    content: "你是一个为老师提供课程备课的AI助手，每次回答只针对最新问题，不重复之前回答内容，输出时按段落分割，使用清晰的标题和子标题。"
  };

  const { token, message } = req.body;

  if (!message) return res.status(400).json({ error: "消息不能为空" });

  // 初始化用户对话记录
  if (!conversationMemory[token]) conversationMemory[token] = [];

  // 获取用户历史对话（最多5条）
  const history = conversationMemory[token].slice(-5);

  // 构建请求消息数组：系统消息 + 历史 + 最新用户消息
  const messages = [systemMessage, ...history, { role: "user", content: message }];

  try {
    const completion = await openai.chat.completions.create({
      model: "deepseek-chat",
      messages
    });

    let reply = completion.choices[0].message.content;

    // 简单优化排版：按句号或换行分段
    reply = reply
      .split(/(?<=。|\n)/)
      .map(p => p.trim())
      .filter(p => p.length > 0)
      .join("\n\n");

    // 保存最新消息到内存
    conversationMemory[token].push({ role: "user", content: message });
    conversationMemory[token].push({ role: "assistant", content: reply });

    res.json({ reply });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "DeepSeek API 调用失败", message: err.message });
  }
});

// 10. 创建应用分类接口（示例）
app.post("/api/appsCategories", async (req, res) => {
  try {
    const { categorynumber, categoryname } = req.body;
    const existingCategory = await AppCategory.findOne({ categorynumber });
    if (existingCategory) return res.status(400).json({ error: "应用分类编码已存在" });

    const category = new AppCategory({ categorynumber, categoryname });
    await category.save();

    res.json({ message: "应用分类创建成功" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "创建应用分类失败" });
  }
});

// 11. 查询所有应用分类
app.get("/api/allAppsCategories", async (req, res) => {
  try {
    const categories = await AppCategory.find({});
    const data = categories.map(c => ({
      categorynumber: c.categorynumber,
      categoryname: c.categoryname,
      _id: c._id
    }));
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "查询应用分类失败" });
  }
});

// 12. 单删应用分类
app.get("/api/deleteCategory", async (req, res) => {
  try {
    const { id } = req.query;          // ?id=xxx
    if (!id) return res.status(400).json({ error: '缺少 id' });
    const apps = await App.find({category: id});
    if (apps.length > 0) return res.status(400).json({ error: '该分类下存在应用，无法删除' });
    await AppCategory.findByIdAndDelete(id);
    res.json({ ok: 1, message: '删除成功' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: '删除失败' });
  }
});

// 13. 单改应用分类
app.get("/api/updateCategory", async (req, res) => {
  try {
    const { id, categoryname, categorynumber } = req.query;
    if (!id) return res.status(400).json({ error: '缺少 id' });
    const update = {};
    if (categoryname) update.categoryname = categoryname;
    if (categorynumber) update.categorynumber = categorynumber;
    const doc = await AppCategory.findByIdAndUpdate(id, update, { new: true });
    if (!doc) return res.status(404).json({ error: '应用分类不存在' });
    res.json({ ok: 1, data: doc });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: '更新失败' });
  }
});

// 14. 创建Ai分类接口（示例）
app.post("/api/aiCategories", async (req, res) => {
  try {
    const { AiName, AiUrl, AiToken, IsNeedBotId } = req.body;
    const existingCategory = await AiCategory.findOne({ AiUrl });
    if (existingCategory) return res.status(400).json({ error: "AI分类已存在" });

    const category = new AiCategory({ AiName, AiUrl, AiToken, IsNeedBotId });
    await category.save();

    res.json({ message: "AI分类创建成功" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "创建AI分类失败" });
  }
});

// 15. 查询所有AI分类
app.get("/api/allAiCategories", async (req, res) => {
  try {
    const categories = await AiCategory.find({});
    const data = categories.map(c => ({
      AiName: c.AiName,
      AiUrl: c.AiUrl,
      AiToken: c.AiToken,
      IsNeedBotId: c.IsNeedBotId,
      _id: c._id
    }));
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "查询AI分类失败" });
  }
});

// 16. 单删AI分类
app.get("/api/deleteAiCategory", async (req, res) => {
  try {
    const { id } = req.query;          // ?id=xxx
    if (!id) return res.status(400).json({ error: '缺少 id' });
    const apps = await App.find({ aicategory: id });
    if (apps.length > 0) return res.status(400).json({ error: '该分类下存在应用，无法删除' });
    await AiCategory.findByIdAndDelete(id);
    res.json({ ok: 1, message: '删除成功' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: '删除失败' });
  }
});

// 17. 单改AI分类
app.get("/api/updateAiCategory", async (req, res) => {
  try {
    const { id, AiName, AiUrl, AiToken, IsNeedBotId } = req.query;
    if (!id) return res.status(400).json({ error: '缺少 id' });
    const update = {};
    if (AiName) update.AiName = AiName;
    if (AiUrl) update.AiUrl = AiUrl;
    if (AiToken) update.AiToken = AiToken;
    if (IsNeedBotId) update.IsNeedBotId = IsNeedBotId;
    const doc = await AiCategory.findByIdAndUpdate(id, update, { new: true });
    if (!doc) return res.status(404).json({ error: '应用分类不存在' });
    res.json({ ok: 1, data: doc });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: '更新失败' });
  }
});

// 18. 创建应用接口（示例）
app.post("/api/apps", async (req, res) => {
  try {
    const { appname, appkeywords, systemMessage, category, aicategory, bot_id } = req.body;
    const existingApp = await App.findOne({ $or: [{ appname }, { appkeywords }] });
    if (existingApp) return res.status(400).json({ error: "应用名称或关键词已存在" });
    const appCategory = await AppCategory.findOne({ categorynumber: category });
    const aiCategory = await AiCategory.findOne({ _id: aicategory });
    const app = new App({ appname, appkeywords, systemMessage: systemMessage, category: appCategory._id, aicategory: aiCategory._id, bot_id });
    await app.save();

    res.json({ message: "应用创建成功", appId: app._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "创建应用失败" });
  }
});

// 19. 查询所有应用
app.get("/api/allApps", async (req, res) => {
  const q = {};
  if (req.query.category) {
    const category = await AppCategory.findOne({ categorynumber: req.query.category });
    q.category = category._id;
  }
  if (req.query.keyword) {
    // 关键词模糊匹配（名称或关键词字段）
    const kw = req.query.keyword.trim()
    q.$or = [
      { appname: new RegExp(kw, 'i') },
      { appkeywords: new RegExp(kw, 'i') }
    ]
  }

  // 1. 先一次性拿到id→number映射表
  const categoryNumberMap = await AppCategory.find().lean().then(list =>
    Object.fromEntries(
      list.map(c => [c._id, c.categorynumber]) // ["BDC4516SDV":"tools"]
    )
  );
  // 2. 先一次性拿到id→name映射表
  const categoryNameMap = await AppCategory.find().lean().then(list =>
    Object.fromEntries(
      list.map(c => [c._id, c.categoryname]) // ["BDC4516SDV":"工具"]
    )
  );

  // 3. 先一次性拿到id→name映射表
  const aiCategoryNameMap = await AiCategory.find().lean().then(list =>
    Object.fromEntries(
      list.map(c => [c._id, c.AiName])
    )
  );

  // 4. 查询应用并重构
  const rawApps = await App.find(q).lean();
  const data = rawApps.map(a => ({
    appname: a.appname,
    appkeywords: a.appkeywords,
    systemMessage: a.systemMessage,
    category: a.category,
    bot_id: a.bot_id,
    _id: a._id,
    categorynumber: categoryNumberMap[a.category],
    categoryname: categoryNameMap[a.category],
    aicategoryid: a.aicategory,
    aicategoryname: aiCategoryNameMap[a.aicategory],
  }));

  res.json(data)
});

// 20. 单删应用
app.get("/api/deleteApp", async (req, res) => {
  try {
    const { id } = req.query;          // ?id=xxx
    if (!id) return res.status(400).json({ error: '缺少 id' });
    await AppMeta.findOneAndDelete({ appId: id });
    await AppDialogues.findOneAndDelete({ appId: id });
    await App.findByIdAndDelete(id);
    res.json({ ok: 1, message: '删除成功' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: '删除失败' + e.message });
  }
});

// 21. 单改应用
app.get("/api/updateApp", async (req, res) => {
  try {
    const { id, appname, appkeywords, systemMessage, categorynumber, aicategory, bot_id } = req.query;
    if (!id) return res.status(400).json({ error: '缺少 id' });
    const update = {};
    if (appname) update.appname = appname;
    if (appkeywords) update.appkeywords = appkeywords;
    if (systemMessage) update.systemMessage = systemMessage;
    if (categorynumber) {
      const category = await AppCategory.findOne({ categorynumber: categorynumber });
      update.category = category._id;
    }
    if (aicategory) update.aicategory = aicategory;
    if (bot_id) {
      update.bot_id = bot_id;
    } else if (bot_id === "") {
      update.bot_id = ""; // 允许清空 bot_id
    }
    const doc = await App.findByIdAndUpdate(id, update, { new: true });
    if (!doc) return res.status(404).json({ error: '应用不存在' });
    res.json({ ok: 1, data: doc });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: '更新失败' });
  }
});

// 22. 保存应用元信息
app.post("/api/saveAppMeta", async (req, res) => {
  try {
    const { appId, metaInfo } = req.body;
    if (!appId || !metaInfo) return res.status(400).json({ error: '缺少 appId 或 metaInfo' });
    // 检查是否已经存在具有相同 appId 的文档
    const existingAppMeta = await AppMeta.findOne({ appId });

    if (existingAppMeta) {
      // 如果存在，更新该文档
      existingAppMeta.appId = appId; // 重新赋值 appId，以确保不会触发 Mongoose 的唯一性验证
      existingAppMeta.metaInfo = metaInfo;
      await existingAppMeta.save();
      res.json({ message: '应用元信息更新成功' });
    } else {
      // 如果不存在，创建并保存新文档
      const appMeta = new AppMeta({ appId, metaInfo: metaInfo });
      await appMeta.save();
      res.json({ message: '应用元信息保存成功' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '保存应用元信息失败' + err.message });
  }
});

// 23. 获取应用元信息
app.post("/api/getAppMeta", async (req, res) => {
  try {
    const { appId } = req.body;
    if (!appId) return res.status(400).json({ error: '缺少 appId' });
    const appMeta = await AppMeta.findOne({ appId: appId });
    // 如果找到文档，返回 metaInfo 字段，否则返回空数组
    res.json({
      metaInfo: appMeta ? appMeta.metaInfo : []
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '获取应用元信息失败' });
  }
});

// 24. 存储对话信息
app.post("/api/saveChat", async (req, res) => {
  try{
    const { appId, userId, chats } = req.body;
    const existAppDialogues = await AppDialogues.findOne({ appId: appId, userId: userId });
    if (existAppDialogues) {
      res.json({ message: '应用对话已存在' });
    } else {
      // 如果不存在，创建并保存新文档
      const appDialogues = new AppDialogues({ appId, userId, chats });
      await appDialogues.save();
      res.json({ message: '应用对话保存成功' });
    }
  } catch (err) {
    res.status(500).json({ error: '存储对话信息失败', details: err.message });
  }
});

// 25. 更新对话信息
app.post("/api/updateChat", async (req, res) => {
  try{
    const { id, chats } = req.body;
    const update = {};
    update.chats = chats;
    await AppDialogues.findByIdAndUpdate(id, update, { new: true });
    res.json({ message: '应用对话更新成功' });
  } catch (err) {
    res.status(500).json({ error: '存储对话信息失败', details: err.message });
  }
});

// 26. 查询所有对话
app.post("/api/getChats", async (req, res) => {
  const { userId } = req.body;
  const q = {};
  if (userId) {
    q.userId = userId;
  }
  // 4. 查询应用并重构
  const rawApps = await AppDialogues.find(q).lean();

  // 预先查询所有需要的 App 和 AiCategory 数据
  const appMap = {}; // 用于存储 App 数据的映射表
  const appMetaMap = {}; // 用于存储 AppMeta 数据的映射表
  const aiCategoryMap = {}; // 用于存储 AiCategory 数据的映射表

  // 查询所有相关的 App 数据
  const apps = await App.find({ _id: { $in: rawApps.map(a => a.appId) } }).lean();
  apps.forEach(app => {
    appMap[app._id] = app;
  });

  // 查询所有相关的 AppMeta 数据
  const appMetas = await AppMeta.find({ appId: { $in: rawApps.map(a => a.appId) } }).lean();
  appMetas.forEach(appMeta => {
    appMetaMap[appMeta.appId] = appMeta;
  });

  // 查询所有相关的 AiCategory 数据
  const aiCategories = await AiCategory.find({ _id: { $in: apps.map(app => app.aicategory) } }).lean();
  aiCategories.forEach(aiCategory => {
    aiCategoryMap[aiCategory._id] = aiCategory;
  });

  // 构建数据
const data = rawApps.map(a => {
  const app = appMap[a.appId];
  if (!app) {
    console.warn(`⚠️ appId ${a.appId} 未找到对应 app`);
    return null; // 或者返回默认对象
  }

  const appMeta = appMetaMap[a.appId] || {};
  const aiCategory = aiCategoryMap[app.aicategory] || {};

  return {
    _id: a._id,
    appId: a.appId,
    userId: a.userId,
    chats: a.chats,
    appName: app.appname || '',
    systemMessage: app.systemMessage || '',
    bot_id: app.bot_id || '',
    url: aiCategory?.AiUrl || '',
    token: aiCategory?.AiToken || '',
    isNeedBotId: aiCategory?.IsNeedBotId || false,
    metaInfo: appMeta.metaInfo || []
  };
}).filter(item => item !== null); // 过滤掉找不到 app 的条目
  res.json(data)
});

// 27. 删除对话
app.post("/api/deleteChat", async (req, res) => {
  try{
    const { id } = req.body;
    await AppDialogues.findByIdAndDelete(id);
    res.json({ ok: 1, message: '删除成功' });
  } catch (err) {
    res.status(500).json({ error: '删除对话信息失败' });
  }
});

//28ce
// 28. DeepSeek 应用对话接口（优化版）
app.post("/api/chatting", async (req, res) => {
  const { url, token, loginToken, systemMessageInfo, message } = req.body;

  // 内存保存用户对话历史（仅短期，重启会清空）
  const conversationMemory = {};

  // 系统角色指令
  const systemMessage = {
    role: "system",
    content: systemMessageInfo
  };

  if (!message) return res.status(400).json({ error: "消息不能为空" });

  // 初始化用户对话记录
  if (!conversationMemory[loginToken]) conversationMemory[loginToken] = [];

  // 获取用户历史对话（最多5条）
  const history = conversationMemory[loginToken].slice(-5);

  // 构建请求消息数组：系统消息 + 历史 + 最新用户消息
  const messages = [systemMessage, ...history, { role: "user", content: message }];

  const deepseekai = new OpenAI({
    baseURL: url,
    apiKey: token // 替换成你的 Key
  });

  try {
    const completion = await deepseekai.chat.completions.create({
      model: "deepseek-chat",
      messages
    });

    let reply = completion.choices[0].message.content;

    // 简单优化排版：按句号或换行分段
    reply = reply
      .split(/(?<=。|\n)/)
      .map(p => p.trim())
      .filter(p => p.length > 0)
      .join("\n\n");

    // 保存最新消息到内存
    conversationMemory[loginToken].push({ role: "user", content: message });
    conversationMemory[loginToken].push({ role: "assistant", content: reply });

    res.json({ reply });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "DeepSeek API 调用失败", message: err.message });
  }
});




