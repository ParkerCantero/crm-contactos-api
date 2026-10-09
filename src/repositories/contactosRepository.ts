import {pool} from "../db/pool";

export type Contacto = {
    id: number;
    nombre: string;
    correo: string;
    telefono: string | null;
    empresa: string | null;
};

export type Nota = {
    id: number;
    contacto_id: number;
    contenido: string;
    fecha_creacion: Date;
};

export type NuevoContacto = {
    nombre: string;
    correo: string;
    telefono?: string | null;
    empresa?: string | null;
};

export async function crearContacto(datos: NuevoContacto): Promise<Contacto> {
    const result = await pool.query(
        `INSERT INTO contactos (nombre, correo, telefono, empresa)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [datos.nombre.trim(), datos.correo.trim(), datos.telefono?.trim() ?? null, datos.empresa?.trim() ?? null]
    );
    return result.rows[0];
}

export async function listarContactos(q?: string): Promise<Contacto[]>{
    if (!q){
        const result = await pool.query<Contacto>("SELECT * FROM contactos ORDER BY id"

        );
        return result.rows;
    }
    const result = await pool.query<Contacto>(
        `SELECT * FROM contactos
         WHERE nombre ILIKE $1 OR empresa ILIKE $1
         ORDER BY id`,
        [`%${q.trim()}%`]
    );
    return result.rows;
}

export async function obtenerContactoPorId(id:number): Promise<Contacto | null>{
    const result = await pool.query<Contacto>(
        "SELECT * FROM contactos WHERE id = $1",
        [id]
    );
    return result.rows[0] || null;
}

export async function listarNotas(contactoId: string): Promise<Nota[]> {
  const result = await pool.query<Nota>(
    "SELECT * FROM notas WHERE contacto_id = $1 ORDER BY creado_en DESC",
    [contactoId]
  );
  return result.rows;
}

export async function crearNota(contactoId: string, contenido: string): Promise<Nota> {
  const result = await pool.query<Nota>(
    `INSERT INTO notas (contacto_id, contenido)
     VALUES ($1, $2)
     RETURNING *`,
    [contactoId, contenido]
  );
  return result.rows[0];
}