import sql from "../../../lib/db";
import { requireAdmin } from "../../../lib/auth";

export default async function handler(req, res) {
  // GET — público, retorna prestadores com média de avaliação
  if (req.method === "GET") {
    const rows = await sql`
      SELECT
        p.*,
        c.name AS category_name,
        ROUND(AVG(r.stars)::numeric, 1)  AS rating_avg,
        COUNT(r.id)::int                 AS rating_count
      FROM providers p
      LEFT JOIN categories c ON c.id = p.category_id
      LEFT JOIN ratings r    ON r.provider_id = p.id
      GROUP BY p.id, c.name
      ORDER BY p.name
    `;
    return res.json(rows);
  }

  // POST — somente admin
  if (req.method === "POST") {
    if (!requireAdmin(req, res)) return;
    const { name, nickname, phone, email, website, address, category_id, emergency, hours } = req.body;
    if (!name || !phone || !category_id)
      return res.status(400).json({ error: "Nome, telefone e categoria são obrigatórios" });

    const [provider] = await sql`
      INSERT INTO providers (name, nickname, phone, email, website, address, category_id, emergency, hours)
      VALUES (${name}, ${nickname||null}, ${phone}, ${email||null}, ${website||null},
              ${address||null}, ${category_id}, ${!!emergency}, ${hours||null})
      RETURNING *
    `;
    return res.status(201).json(provider);
  }

  res.status(405).end();
}
