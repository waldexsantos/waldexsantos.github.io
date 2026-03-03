import { neon } from "@neondatabase/serverless";

// Cria uma conexão reutilizável (pool automático do Neon serverless)
const sql = neon(process.env.DATABASE_URL);

export default sql;
