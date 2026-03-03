import bcrypt from "bcryptjs";
import sql from "../../../lib/db";
import { signToken } from "../../../lib/auth";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: "Preencha usuário e senha" });

  try {
    const [user] = await sql`
      SELECT * FROM users WHERE username = ${username} LIMIT 1
    `;
    if (!user)
      return res.status(401).json({ error: "Usuário ou senha incorretos" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok)
      return res.status(401).json({ error: "Usuário ou senha incorretos" });

    const token = signToken({ id: user.id, username: user.username, role: user.role });

    // Retorna usuário sem o hash da senha
    const { password: _, ...safeUser } = user;
    return res.status(200).json({ token, user: safeUser });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro interno" });
  }
}
