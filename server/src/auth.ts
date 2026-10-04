import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "./db.js";

export const authRouter = Router();

authRouter.post("/register", async (req, res) => {
  const { name, email, password } = req.body ?? {};
  if (!name || !email || !password || String(password).length < 8) {
    return res.status(400).json({
      error: "Nama, email, dan kata sandi (minimal 8 karakter) wajib diisi.",
    });
  }

  const normalizedEmail = String(email).toLowerCase().trim();
  const existing = await prisma.teacher.findUnique({
    where: { email: normalizedEmail },
  });
  if (existing) {
    return res.status(409).json({ error: "Email sudah terdaftar." });
  }

  const passwordHash = await bcrypt.hash(String(password), 10);
  const teacher = await prisma.teacher.create({
    data: { name: String(name).trim(), email: normalizedEmail, passwordHash },
  });

  res.status(201).json({
    id: teacher.id,
    name: teacher.name,
    email: teacher.email,
  });
});

authRouter.post("/login", async (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    return res.status(400).json({ error: "Email dan kata sandi wajib diisi." });
  }

  const teacher = await prisma.teacher.findUnique({
    where: { email: String(email).toLowerCase().trim() },
  });
  const valid =
    teacher && (await bcrypt.compare(String(password), teacher.passwordHash));
  if (!teacher || !valid) {
    return res.status(401).json({ error: "Email atau kata sandi salah." });
  }

  const token = jwt.sign({ sub: teacher.id }, process.env.JWT_SECRET!, {
    expiresIn: "7d",
  });

  res.json({
    token,
    teacher: { id: teacher.id, name: teacher.name, email: teacher.email },
  });
});