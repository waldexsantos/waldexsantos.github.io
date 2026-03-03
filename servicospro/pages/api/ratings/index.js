import sql from "../../../lib/db";
import { requireAuth } from "../../../lib/auth";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const user = requireAuth(req, res);
  if (!user) return;

  const { provider_id, stars } = req.body;
  if (!provider_id || !stars || stars < 1 || stars > 5)
    return res.status(400).json({ error: "Dados inválidos" });

  // Upsert: atualiza se já existe avaliação deste usuário para este prestador
  const [rating] = await sql`
    INSERT INTO ratings (provider_id, user_id, stars)
    VALUES (${provider_id}, ${user.id}, ${stars})
    ON CONFLICT (provider_id, user_id)
    DO UPDATE SET stars = EXCLUDED.stars
    RETURNING *
  `;

  return res.status(200).json(rating);
}
