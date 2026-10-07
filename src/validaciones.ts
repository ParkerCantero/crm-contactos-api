const CORREO_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ID_MAXIMO = 2147483647; // limite de un serial en postgres

export function esIdValido(id: string): boolean {
  return /^\d+$/.test(id) && Number(id) >= 1 && Number(id) <= ID_MAXIMO;
}

export function validarContacto(body: Record<string, unknown>): string[] {
  const errores: string[] = [];
  const { nombre, correo, telefono, empresa } = body;

  if (typeof nombre !== "string" || nombre.trim() === "") {
    errores.push("nombre es obligatorio");
  } else if (nombre.trim().length > 150) {
    errores.push("nombre no puede superar 150 caracteres");
  }

  if (typeof correo !== "string" || !CORREO_REGEX.test(correo.trim())) {
    errores.push("correo debe tener un formato válido (ejemplo: nombre@empresa.com)");
  } else if (correo.trim().length > 255) {
    errores.push("correo no puede superar 255 caracteres");
  }

  if (telefono != null && typeof telefono !== "string") {
    errores.push("telefono debe ser texto");
  } else if (typeof telefono === "string" && telefono.trim().length > 50) {
    errores.push("telefono no puede superar 50 caracteres");
  }

  if (empresa != null && typeof empresa !== "string") {
    errores.push("empresa debe ser texto");
  } else if (typeof empresa === "string" && empresa.trim().length > 150) {
    errores.push("empresa no puede superar 150 caracteres");
  }

  return errores;
}

export function validarNota(body: Record<string, unknown>): string[] {
  const { contenido } = body;

  if (typeof contenido !== "string" || contenido.trim() === "") {
    return ["contenido es obligatorio"];
  }
  return [];
}