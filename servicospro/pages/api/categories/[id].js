import sql from "../../../lib/db";
import { requireAdmin } from "../../../lib/auth";

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === "PUT") {
    if (!requireAdmin(req, res)) return;
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: "Nome obrigatório" });
    const [cat] = await sql`
      UPDATE categories SET name = ${name.trim()} WHERE id = ${id} RETURNING *
    `;
    return cat ? res.json(cat) : res.status(404).json({ error: "Não encontrado" });
  }

  if (req.method === "DELETE") {
    if (!requireAdmin(req, res)) return;
    // Verifica se há prestadores usando esta categoria
    const [{ count }] = await sql`
      SELECT COUNT(*) FROM providers WHERE category_id = ${id}
    `;
    if (Number(count) > 0)
      return res.status(409).json({ error: "Categoria em uso — remova os prestadores primeiro" });
    await sql`DELETE FROM categories WHERE id = ${id}`;
    return res.json({ ok: true });
  }

  res.status(405).end();
}
