import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "dev_secret_troque_em_producao";

export function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: "7d" });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET);
  } catch {
    return null;
  }
}

/** Extrai o usuário do header Authorization: Bearer <token> */
export function getUserFromRequest(req) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return null;
  return verifyToken(token);
}

/** Middleware: retorna 401 se não autenticado */
export function requireAuth(req, res) {
  const user = getUserFromRequest(req);
  if (!user) {
    res.status(401).json({ error: "Não autenticado" });
    return null;
  }
  return user;
}

/** Middleware: retorna 403 se não for admin */
export function requireAdmin(req, res) {
  const user = requireAuth(req, res);
  if (!user) return null;
  if (user.role !== "admin") {
    res.status(403).json({ error: "Acesso negado — somente administradores" });
    return null;
  }
  return user;
}
