import sql from "../../../lib/db";
import { requireAdmin } from "../../../lib/auth";

export default async function handler(req, res) {
  if (!requireAdmin(req, res)) return;

  // GET — lista usuários
  if (req.method === "GET") {
    const users = await sql`
      SELECT id, username, email, role, created_at FROM users ORDER BY created_at
    `;
    return res.json(users);
  }

  res.status(405).end();
}
