import bcrypt from "bcryptjs";
import sql from "../../../lib/db";
import { signToken } from "../../../lib/auth";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { username, email, password } = req.body;

  if (!username || !email || !password)
    return res.status(400).json({ error: "Preencha todos os campos" });

  if (password.length < 6)
    return res.status(400).json({ error: "Senha deve ter mínimo 6 caracteres" });

  try {
    const existing = await sql`
      SELECT id FROM users
      WHERE username = ${username} OR email = ${email}
      LIMIT 1
    `;
    if (existing.length > 0)
      return res.status(409).json({ error: "Usuário ou e-mail já cadastrado" });

    const hash = await bcrypt.hash(password, 10);

    const [user] = await sql`
      INSERT INTO users (username, email, password, role)
      VALUES (${username}, ${email}, ${hash}, 'user')
      RETURNING id, username, email, role, created_at
    `;

    const token = signToken({ id: user.id, username: user.username, role: user.role });
    return res.status(201).json({ token, user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro interno" });
  }
}
