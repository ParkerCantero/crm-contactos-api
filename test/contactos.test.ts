import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { app } from "../src/app";
import * as repositorio from "../src/repositories/contactosRepository";

vi.mock("../src/repositories/contactosRepository");

const contactoEjemplo = {
  id: 1,
  nombre: "Ana Torres",
  correo: "ana@acme.com",
  telefono: "3001234567",
  empresa: "Acme",
  fecha_creacion: new Date("2026-10-06T20:15:00.000Z"),
};

beforeEach(() => {
  vi.resetAllMocks();
});

describe("Casos de error", () => {
  it("POST /contactos sin datos responde 400 con nombre y correo", async () => {
    const res = await request(app).post("/contactos").send({});

    expect(res.status).toBe(400);
    expect(res.body.detalles).toHaveLength(2);
    expect(repositorio.crearContacto).not.toHaveBeenCalled();
  });

  it("POST /contactos con correo inválido responde 400", async () => {
    const res = await request(app)
      .post("/contactos")
      .send({ nombre: "Ana", correo: "ana-sin-arroba" });

    expect(res.status).toBe(400);
    expect(res.body.detalles[0]).toContain("correo");
  });

  it("POST /contactos con nombre de solo espacios responde 400", async () => {
    const res = await request(app)
      .post("/contactos")
      .send({ nombre: "   ", correo: "ana@acme.com" });

    expect(res.status).toBe(400);
    expect(res.body.detalles[0]).toContain("nombre");
  });

  it("POST /contactos con JSON mal formado responde 400", async () => {
    const res = await request(app)
      .post("/contactos")
      .set("Content-Type", "application/json")
      .send("{malformado");

    expect(res.status).toBe(400);
  });

  it("GET /contactos/abc responde 400", async () => {
    const res = await request(app).get("/contactos/abc");

    expect(res.status).toBe(400);
    expect(repositorio.obtenerContactoPorId).not.toHaveBeenCalled();
  });

  it("GET /contactos/999 responde 404 con el id en el mensaje", async () => {
    vi.mocked(repositorio.obtenerContactoPorId).mockResolvedValue(null);

    const res = await request(app).get("/contactos/999");

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Contacto 999 no encontrado");
  });

  it("POST /contactos/1/notas con contenido vacío responde 400", async () => {
    const res = await request(app)
      .post("/contactos/1/notas")
      .send({ contenido: "" });

    expect(res.status).toBe(400);
    expect(repositorio.crearNota).not.toHaveBeenCalled();
  });

 it("POST /contactos/999/notas responde 404 si el contacto no existe", async () => {
  vi.mocked(repositorio.obtenerContactoPorId).mockResolvedValue(null);

  const res = await request(app)
    .post("/contactos/999/notas")
    .send({ contenido: "Llamada de seguimiento" });

  expect(res.status).toBe(404);
  expect(res.body.error).toBe("Contacto 999 no encontrado");
  expect(repositorio.crearNota).not.toHaveBeenCalled();
});

  it("una ruta que no existe responde 404", async () => {
    const res = await request(app).get("/no-existe");

    expect(res.status).toBe(404);
  });
});

describe("Casos felices", () => {
  it("POST /contactos crea el contacto y responde 201", async () => {
    vi.mocked(repositorio.crearContacto).mockResolvedValue(contactoEjemplo);

    const res = await request(app)
      .post("/contactos")
      .send({ nombre: "  Ana Torres ", correo: "ana@acme.com", empresa: "Acme" });

    expect(res.status).toBe(201);
    expect(res.body.nombre).toBe("Ana Torres");
    expect(repositorio.crearContacto).toHaveBeenCalledWith({
      nombre: "Ana Torres",
      correo: "ana@acme.com",
      telefono: null,
      empresa: "Acme",
    });
  });

  it("GET /contactos lista los contactos", async () => {
    vi.mocked(repositorio.listarContactos).mockResolvedValue([contactoEjemplo]);

    const res = await request(app).get("/contactos");

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(repositorio.listarContactos).toHaveBeenCalledWith();
    });

  it("GET /contactos?q=acme pasa la búsqueda al repositorio", async () => {
    vi.mocked(repositorio.listarContactos).mockResolvedValue([contactoEjemplo]);

    const res = await request(app).get("/contactos?q=acme");

    expect(res.status).toBe(200);
    expect(repositorio.listarContactos).toHaveBeenCalledWith("acme");
  });

  it("GET /contactos/1 devuelve el contacto con sus notas", async () => {
    vi.mocked(repositorio.obtenerContactoPorId).mockResolvedValue(contactoEjemplo);
    vi.mocked(repositorio.listarNotas).mockResolvedValue([
      {
        id: 1,
        contacto_id: 1,
        contenido: "Llamada de seguimiento el 5 de octubre",
        fecha_creacion: new Date("2026-10-06T20:15:00.000Z"),
      },
    ]);

    const res = await request(app).get("/contactos/1");

    expect(res.status).toBe(200);
    expect(res.body.nombre).toBe("Ana Torres");
    expect(res.body.notas).toHaveLength(1);
  });

it("POST /contactos/1/notas agrega la nota y responde 201", async () => {
  vi.mocked(repositorio.obtenerContactoPorId).mockResolvedValue(contactoEjemplo);
  vi.mocked(repositorio.crearNota).mockResolvedValue({
    id: 1,
    contacto_id: 1,
    contenido: "Llamada de seguimiento",
    fecha_creacion: new Date("2026-10-06T20:20:00.000Z"),
  });

  const res = await request(app)
    .post("/contactos/1/notas")
    .send({ contenido: "  Llamada de seguimiento " });

  expect(res.status).toBe(201);
  expect(repositorio.crearNota).toHaveBeenCalledWith("1", "Llamada de seguimiento");
});
});