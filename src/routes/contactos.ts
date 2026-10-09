import { Router } from "express";
import { esIdValido, validarContacto, validarNota } from "../validaciones";
import * as repositorio from "../repositories/contactosRepository";
export const contactosRouter = Router();

contactosRouter.post("/", async (req, res) => {
  const body = req.body ?? {};
  const errores = validarContacto(body);

  if (errores.length > 0) {
    res.status(400).json({ error: "Datos inválidos", detalles: errores });
    return;
  }

  const contacto = await repositorio.crearContacto({
    nombre: body.nombre.trim(),
    correo: body.correo.trim(),
    telefono: 
    typeof body.telefono === "string" ? body.telefono.trim() : null,
    empresa: 
    typeof body.empresa === "string" ? body.empresa.trim() : null,
  })
   res.status(201).json(contacto);
});

contactosRouter.get("/", async (req, res) => {
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";

  if (!q) {
    const contactos = await repositorio.listarContactos();
    res.json(contactos);
    return;
  }

  const contactos = await repositorio.listarContactos(q);
  res.json(contactos);
});


contactosRouter.get("/:id", async (req, res) => {
  const { id } = req.params;

  if (!esIdValido(id)) {
    res.status(400).json({ error: "El id debe ser un número entero positivo" });
    return;
  }

  const contacto = await repositorio.obtenerContactoPorId(Number(id));

  if (!contacto) {
    res.status(404).json({ error: `Contacto ${id} no encontrado` });
    return;
  }

  const notas = await repositorio.listarNotas(id);

  res.json({ ...contacto, notas: notas });
});

contactosRouter.post("/:id/notas", async (req, res) => {
  const { id } = req.params;

  if (!esIdValido(id)) {
    res.status(400).json({ error: "El id debe ser un número entero positivo" });
    return;
  }

  const body = req.body ?? {};
  const errores = validarNota(body);

  if (errores.length > 0) {
    res.status(400).json({ error: "Datos inválidos", detalles: errores });
    return;
  }

  const contacto = await repositorio.obtenerContactoPorId(Number(id));

  if (!contacto) {
    res.status(404).json({ error: `Contacto ${id} no encontrado` });
    return;
  }

  const result = await repositorio.crearNota(id, body.contenido.trim());

  res.status(201).json(result);
});