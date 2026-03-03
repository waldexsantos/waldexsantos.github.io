import sql from "../../../lib/db";
import { requireAuth, requireAdmin } from "../../../lib/auth";

export default async function handler(req, res) {
  // GET — somente admin, lista todos com filtro de status
  if (req.method === "GET") {
    if (!requireAdmin(req, res)) return;
    const { status } = req.query;
    const rows = status
      ? await sql`
          SELECT cm.*, u.username, p.name AS provider_name
          FROM comments cm
          JOIN users u ON u.id = cm.user_id
          JOIN providers p ON p.id = cm.provider_id
          WHERE cm.status = ${status}
          ORDER BY cm.created_at DESC
        `
      : await sql`
          SELECT cm.*, u.username, p.name AS provider_name
          FROM comments cm
          JOIN users u ON u.id = cm.user_id
          JOIN providers p ON p.id = cm.provider_id
          ORDER BY cm.created_at DESC
        `;
    return res.json(rows);
  }

  // POST — usuário autenticado envia comentário
  if (req.method === "POST") {
    const user = requireAuth(req, res);
    if (!user) return;

    const { provider_id, text } = req.body;
    if (!provider_id || !text?.trim())
      return res.status(400).json({ error: "Dados inválidos" });

    const [comment] = await sql`
      INSERT INTO comments (provider_id, user_id, text, status)
      VALUES (${provider_id}, ${user.id}, ${text.trim()}, 'pending')
      RETURNING *
    `;
    return res.status(201).json(comment);
  }

  res.status(405).end();
}
