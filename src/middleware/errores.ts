import { ErrorRequestHandler, RequestHandler } from "express";

export const rutaNoEncontrada: RequestHandler = (req, res) => {
  res.status(404).json({ error: `Ruta ${req.method} ${req.originalUrl} no encontrada` });
};

export const manejarErrores: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err?.type === "entity.parse.failed") {
    res.status(400).json({ error: "El cuerpo de la petición no es un JSON válido" });
    return;
  }

  console.error(err);
  res.status(500).json({ error: "Error interno del servidor" });
};