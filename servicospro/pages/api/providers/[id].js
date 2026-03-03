import sql from "../../../../lib/db";
import { requireAdmin } from "../../../../lib/auth";

export default async function handler(req, res) {
  const { id } = req.query;

  // GET — detalhes do prestador + comentários aprovados
  if (req.method === "GET") {
    const [provider] = await sql`
      SELECT p.*, c.name AS category_name,
        ROUND(AVG(r.stars)::numeric, 1) AS rating_avg,
        COUNT(r.id)::int AS rating_count
      FROM providers p
      LEFT JOIN categories c ON c.id = p.category_id
      LEFT JOIN ratings r ON r.provider_id = p.id
      WHERE p.id = ${id}
      GROUP BY p.id, c.name
    `;
    if (!provider) return res.status(404).json({ error: "Prestador não encontrado" });

    const comments = await sql`
      SELECT cm.*, u.username
      FROM comments cm
      JOIN users u ON u.id = cm.user_id
      WHERE cm.provider_id = ${id} AND cm.status = 'approved'
      ORDER BY cm.created_at DESC
    `;

    return res.json({ ...provider, comments });
  }

  // PUT — somente admin
  if (req.method === "PUT") {
    if (!requireAdmin(req, res)) return;
    const { name, nickname, phone, email, website, address, category_id, emergency, hours } = req.body;
    if (!name || !phone || !category_id)
      return res.status(400).json({ error: "Nome, telefone e categoria são obrigatórios" });

    const [provider] = await sql`
      UPDATE providers SET
        name        = ${name},
        nickname    = ${nickname||null},
        phone       = ${phone},
        email       = ${email||null},
        website     = ${website||null},
        address     = ${address||null},
        category_id = ${category_id},
        emergency   = ${!!emergency},
        hours       = ${hours||null}
      WHERE id = ${id}
      RETURNING *
    `;
    return provider ? res.json(provider) : res.status(404).json({ error: "Não encontrado" });
  }

  // DELETE — somente admin
  if (req.method === "DELETE") {
    if (!requireAdmin(req, res)) return;
    await sql`DELETE FROM providers WHERE id = ${id}`;
    return res.json({ ok: true });
  }

  res.status(405).end();
}
