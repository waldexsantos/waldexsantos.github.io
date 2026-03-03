import sql from "../../../../lib/db";
import { requireAdmin } from "../../../../lib/auth";

export default async function handler(req, res) {
  const admin = requireAdmin(req, res);
  if (!admin) return;

  const { id } = req.query;

  // Não permite o admin modificar a si mesmo via esta rota
  if (id === admin.id)
    return res.status(400).json({ error: "Você não pode modificar sua própria conta aqui" });

  if (req.method === "PATCH") {
    const { role } = req.body;
    if (!["admin", "user"].includes(role))
      return res.status(400).json({ error: "Role inválido" });
    const [user] = await sql`
      UPDATE users SET role = ${role} WHERE id = ${id}
      RETURNING id, username, email, role, created_at
    `;
    return user ? res.json(user) : res.status(404).json({ error: "Não encontrado" });
  }

  if (req.method === "DELETE") {
    await sql`DELETE FROM users WHERE id = ${id}`;
    return res.json({ ok: true });
  }

  res.status(405).end();
}
