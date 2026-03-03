import sql from "../../../../lib/db";
import { requireAdmin } from "../../../../lib/auth";

export default async function handler(req, res) {
  if (req.method !== "PATCH") return res.status(405).end();
  if (!requireAdmin(req, res)) return;

  const { id } = req.query;
  const { status } = req.body;

  if (!["approved", "rejected"].includes(status))
    return res.status(400).json({ error: "Status inválido" });

  const [comment] = await sql`
    UPDATE comments SET status = ${status} WHERE id = ${id} RETURNING *
  `;
  return comment ? res.json(comment) : res.status(404).json({ error: "Não encontrado" });
}
