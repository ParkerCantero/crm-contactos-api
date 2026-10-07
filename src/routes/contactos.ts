import { Router } from "express";
import { pool } from "../db/pool";

export const contactosRouter = Router();

contactosRouter.post("/", async (req, res) => {
  const { nombre, correo, telefono, empresa } = req.body ?? {};

  const result = await pool.query(
    `INSERT INTO contactos (nombre, correo, telefono, empresa)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [nombre, correo, telefono ?? null, empresa ?? null]
  );

  res.status(201).json(result.rows[0]);
});

contactosRouter.get("/", async (req, res) => {
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";

  if (!q) {
    const result = await pool.query("SELECT * FROM contactos ORDER BY id");
    res.json(result.rows);
    return;
  }

  const result = await pool.query(
    `SELECT * FROM contactos
     WHERE nombre ILIKE $1 OR empresa ILIKE $1
     ORDER BY id`,
    [`%${q}%`]
  );
  res.json(result.rows);
});