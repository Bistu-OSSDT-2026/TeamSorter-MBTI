import express from "express";
import bcrypt from "bcrypt";
import User from "../models/User.js";

const router = express.Router();

// 修改密码
router.post("/change-password", async (req, res) => {
  try {
    const { username, oldPassword, newPassword } = req.body;
    if (!username || !oldPassword || !newPassword) {
      return res.status(400).json({ error: "缺少必要参数" });
    }

    // 查找用户
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: "用户不存在" });

    // 校验原密码
    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) {
      return res.status(401).json({ error: "原密码错误" });
    }

    // 更新新密码
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return res.json({ message: "密码修改成功" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "服务器错误" });
  }
});

export default router;
