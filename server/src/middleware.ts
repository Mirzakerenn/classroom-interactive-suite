import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export type AuthedRequest = Request & { teacherId?: string };

export function requireAuth(
  req: AuthedRequest,
  res: Response,
  next: NextFunction
) {
  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: "Belum login." });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
      sub: string;
      role?: string;
    };
    if (payload.role === "student") {
      return res.status(403).json({ error: "Khusus pengajar." });
    }
    req.teacherId = payload.sub;
    next();
  } catch {
    res.status(401).json({ error: "Token tidak valid atau kedaluwarsa." });
  }
}