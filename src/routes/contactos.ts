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