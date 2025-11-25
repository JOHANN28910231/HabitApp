// ==========================================================
// 📁 controllers/propertiesController.js
// ==========================================================

const db = require("../config/db");       // tu conexión MySQL
const path = require("path");

// ==========================================================
// ➤ CREAR PROPIEDAD
// ==========================================================
exports.createProperty = async (req, res) => {
  try {
    const {
      id_anfitrion,
      nombre_propiedad,
      tipo_propiedad,
      direccion,
      codigo_postal,
      municipio,
      estado,
      ubicacion_url,
      descripcion
    } = req.body;

    // Si se subió archivo, multer lo guarda y viene en req.file.filename
    const foto = req.file ? req.file.filename : null;

    const sql = `
      INSERT INTO propiedades (
        id_anfitrion,
        nombre_propiedad,
        tipo_propiedad,
        direccion,
        codigo_postal,
        municipio,
        estado,
        ubicacion_url,
        url_fotos_p,
        descripcion,
        fecha_registro
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURDATE())
    `;

    const values = [
      id_anfitrion,
      nombre_propiedad,
      tipo_propiedad,
      direccion,
      codigo_postal,
      municipio,
      estado,
      ubicacion_url,
      foto,
      descripcion
    ];

    const [result] = await db.execute(sql, values);

    return res.json({
      ok: true,
      message: "Propiedad creada correctamente",
      id_propiedad: result.insertId,
      foto: foto
    });

  } catch (err) {
    console.error("❌ Error al crear propiedad:", err);
    return res.status(500).json({ ok: false, error: "Error interno" });
  }
};


// ==========================================================
// ➤ EDITAR PROPIEDAD
// ==========================================================
exports.updateProperty = async (req, res) => {
  try {
    const {
      nombre_propiedad,
      tipo_propiedad,
      direccion,
      codigo_postal,
      municipio,
      estado,
      ubicacion_url,
      descripcion
    } = req.body;

    const id = req.params.id;

    let foto = req.file ? req.file.filename : null;

    let sql = `
      UPDATE propiedades
      SET nombre_propiedad = ?, tipo_propiedad = ?, direccion = ?, codigo_postal = ?,
          municipio = ?, estado = ?, ubicacion_url = ?, descripcion = ?
    `;
    const values = [
      nombre_propiedad,
      tipo_propiedad,
      direccion,
      codigo_postal,
      municipio,
      estado,
      ubicacion_url,
      descripcion
    ];

    if (foto) {
      sql += `, url_fotos_p = ?`;
      values.push(foto);
    }

    sql += ` WHERE id_propiedad = ?`;
    values.push(id);

    await db.execute(sql, values);

    res.json({ ok: true, message: "Propiedad actualizada correctamente" });

  } catch (err) {
    console.error("❌ Error al actualizar propiedad:", err);
    res.status(500).json({ ok: false, error: "Error interno" });
  }
};


// ==========================================================
// ➤ OBTENER PROPIEDADES POR ANFITRIÓN
// ==========================================================
exports.getPropertiesByHost = async (req, res) => {
  try {
    const hostId = req.params.id;

    const [rows] = await db.execute(
      "SELECT * FROM propiedades WHERE id_anfitrion = ?", [hostId]
    );

    res.json(rows);

  } catch (err) {
    console.error("❌ Error al obtener propiedades:", err);
    res.status(500).json({ ok: false, error: "Error interno" });
  }
};


// ==========================================================
// ➤ OBTENER HABITACIONES DE UNA PROPIEDAD
// ==========================================================
exports.getRoomsByProperty = async (req, res) => {
  try {
    const propiedadId = req.params.id;

    const [rows] = await db.execute(
      "SELECT * FROM habitaciones WHERE id_propiedad = ?", [propiedadId]
    );

    res.json(rows);

  } catch (err) {
    console.error("❌ Error al obtener habitaciones:", err);
    res.status(500).json({ ok: false, error: "Error interno" });
  }
};


// ==========================================================
// ➤ ELIMINAR PROPIEDAD
// ==========================================================
exports.deleteProperty = async (req, res) => {
  try {
    const id = req.params.id;

    await db.execute("DELETE FROM propiedades WHERE id_propiedad = ?", [id]);

    res.json({ ok: true, message: "Propiedad eliminada" });

  } catch (err) {
    console.error("❌ Error al eliminar propiedad:", err);
    res.status(500).json({ ok: false, error: "Error interno" });
  }
};
