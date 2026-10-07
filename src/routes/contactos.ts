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


contactosRouter.get("/:id", async (req, res) => {
  const { id } = req.params;

  const contacto = await pool.query(
    "SELECT * FROM contactos WHERE id = $1",
    [id]
  );

  if (contacto.rows.length === 0) {
    res.status(404).json({ error: `Contacto ${id} no encontrado` });
    return;
  }

  const notas = await pool.query(
    "SELECT * FROM notas WHERE contacto_id = $1 ORDER BY creado_en DESC",
    [id]
  );

  res.json({ ...contacto.rows[0], notas: notas.rows });
});

contactosRouter.post("/:id/notas", async (req, res) => {
  const { id } = req.params;
  const { contenido } = req.body ?? {};

  const contacto = await pool.query(
    "SELECT 1 FROM contactos WHERE id = $1",
    [id]
  );

  if (contacto.rows.length === 0) {
    res.status(404).json({ error: `Contacto ${id} no encontrado` });  
      return;
  }

  const result = await pool.query(
    `INSERT INTO notas (contacto_id, contenido)
     VALUES ($1, $2)
     RETURNING *`,
    [id, contenido]
  );

  res.status(201).json(result.rows[0]);
});