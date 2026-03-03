import sql from "../../../lib/db";
import { requireAdmin } from "../../../lib/auth";

export default async function handler(req, res) {
  // GET — público
  if (req.method === "GET") {
    const rows = await sql`SELECT * FROM categories ORDER BY name`;
    return res.json(rows);
  }

  // POST — somente admin
  if (req.method === "POST") {
    if (!requireAdmin(req, res)) return;
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: "Nome obrigatório" });
    try {
      const [cat] = await sql`
        INSERT INTO categories (name) VALUES (${name.trim()})
        RETURNING *
      `;
      return res.status(201).json(cat);
    } catch (err) {
      if (err.code === "23505") return res.status(409).json({ error: "Categoria já existe" });
      return res.status(500).json({ error: "Erro interno" });
    }
  }

  res.status(405).end();
}
