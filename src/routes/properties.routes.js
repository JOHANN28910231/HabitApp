const express = require('express');
const router = express.Router();
const pool = require('../utils/db');
const multer = require('multer');
const path = require('path');
const { requireAuth, requireRole } = require('../middlewares/auth');
// Middleware de depuración: registrar peticiones a este router

// Debug middleware: log todas las peticiones a este router
router.use((req, res, next) => {
    try {
        console.log(`[properties.routes] ${req.method} ${req.originalUrl}`);
    } catch (err) { }
    next();
});

// ==========================================================
// Configurar Multer (subida de fotos)
// 📌 CONFIGURAR MULTER UNA SOLA VEZ
// ==========================================================
const fs = require('fs');

// Asegurar que la carpeta existe
const uploadDir = path.join(__dirname, '../../public/fotosPropiedades');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log("✅ Carpeta de fotos creada:", uploadDir);
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const name = 'propiedad_' + Date.now() + path.extname(file.originalname);
        cb(null, name);
    }
});

const upload = multer({
    storage,
    fileFilter: function (req, file, cb) {
        // Validar que sea una imagen
        const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten imágenes (JPEG, PNG, GIF, WEBP)'));
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    }
});

// ==========================================================
// GET — Obtener propiedades por host (requiere autenticación)
// ✔ GET — Obtener propiedades por host (requiere autenticación)
// ==========================================================
router.get('/host/:hostId', requireAuth, requireRole('anfitrion'), async (req, res) => {
    const { hostId } = req.params;

    try {
        const [rows] = await pool.query(
            `SELECT * FROM propiedades WHERE id_anfitrion = ?`,
            [hostId]
        );

        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener propiedades' });
    }
});

// ==========================================================
// GET — Habitaciones de una propiedad (requiere autenticación)
// ✔ GET — Habitaciones de una propiedad (requiere autenticación)
// ==========================================================
router.get('/:propertyId/habitaciones', requireAuth, requireRole('anfitrion'), async (req, res) => {
    const { propertyId } = req.params;

    try {
        const [rows] = await pool.query(
            `SELECT * FROM habitacion WHERE id_propiedad = ?`,
            [propertyId]
        );

        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener habitaciones' });
    }
});

// ==========================================================
// POST — Crear propiedad (solo anfitrión)
// ✨ POST — Crear propiedad (solo anfitrión)
// ==========================================================
router.post('/', requireAuth, requireRole('anfitrion'), upload.single('foto_propiedad'), async (req, res) => {
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
            descripcion,
            politicas_hospedaje,
            servicios_generales,
            fecha_registro,
            estado_propiedad
        } = req.body;

        console.log("📥 [POST /api/properties] Datos recibidos:", {
            id_anfitrion,
            nombre_propiedad,
            tipo_propiedad,
            foto: req.file ? req.file.filename : "sin foto"
        });

        // Validar que id_anfitrion esté presente
        if (!id_anfitrion) {
            return res.status(400).json({ ok: false, error: "id_anfitrion es requerido" });
        }

        // Validar campos requeridos
        if (!nombre_propiedad || !tipo_propiedad) {
            return res.status(400).json({ ok: false, error: "nombre_propiedad y tipo_propiedad son requeridos" });
        }

        const foto = req.file ? req.file.filename : null;

        // Fecha registro: si la envía el formulario se usa, si no CURDATE()
        const fechaReg = fecha_registro && fecha_registro.length ? fecha_registro : null;

        console.log("📝 Insertando en BD con datos:", {
            id_anfitrion,
            nombre_propiedad,
            foto
        });

        const [result] = await pool.query(
            `INSERT INTO propiedades 
            (id_anfitrion, nombre_propiedad, tipo_propiedad, direccion, codigo_postal, municipio, estado, ubicacion_url, descripcion, politicas_hospedaje, servicios_generales, fecha_registro, estado_propiedad, url_fotos_p)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                id_anfitrion,
                nombre_propiedad,
                tipo_propiedad,
                direccion,
                codigo_postal,
                municipio,
                estado,
                ubicacion_url,
                descripcion,
                politicas_hospedaje || null,
                servicios_generales || null,
                fechaReg || new Date().toISOString().slice(0, 10),
                estado_propiedad || 'activa',
                foto
            ]
        );

        console.log("✅ Propiedad creada con ID:", result.insertId);
        res.json({ ok: true, id_propiedad: result.insertId });
    } catch (error) {
        console.error("❌ Error al crear propiedad:", error.message || error);
        res.status(500).json({ ok: false, error: "Error al crear propiedad: " + (error.message || error) });
    }
}, function (err, req, res, next) {
    // Middleware de manejo de errores para multer
    if (err instanceof multer.MulterError) {
        console.error("❌ Error de multer:", err.message);
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ ok: false, error: "El archivo es demasiado grande (máx 5MB)" });
        }
        return res.status(400).json({ ok: false, error: "Error al subir archivo: " + err.message });
    } else if (err) {
        console.error("❌ Error:", err.message);
        return res.status(400).json({ ok: false, error: err.message || "Error desconocido" });
    }
});

// ==========================================================
// PUT — Editar propiedad (solo anfitrión)
// ✨ PUT — Editar propiedad (solo anfitrión)
// ==========================================================
router.put('/:id', requireAuth, requireRole('anfitrion'), upload.single('foto_propiedad'), async (req, res) => {
    try {
        const id = req.params.id;

        const {
            nombre_propiedad,
            tipo_propiedad,
            direccion,
            codigo_postal,
            municipio,
            estado,
            ubicacion_url,
            descripcion,
            politicas_hospedaje,
            servicios_generales,
            fecha_registro,
            estado_propiedad
        } = req.body;

        console.log("📥 [PUT /api/properties/:id] Editando propiedad ID:", id);

        let foto = null;
        if (req.file) {
            foto = req.file.filename;
        }

        const [old] = await pool.query(
            "SELECT url_fotos_p FROM propiedades WHERE id_propiedad = ?",
            [id]
        );

        const finalPhoto = foto || old[0]?.url_fotos_p;

        await pool.query(
            `UPDATE propiedades 
            SET nombre_propiedad=?, tipo_propiedad=?, direccion=?, codigo_postal=?, municipio=?, estado=?, ubicacion_url=?, descripcion=?, politicas_hospedaje=?, servicios_generales=?, fecha_registro=?, estado_propiedad=?, url_fotos_p=?
            WHERE id_propiedad=?`,
            [
                nombre_propiedad,
                tipo_propiedad,
                direccion,
                codigo_postal,
                municipio,
                estado,
                ubicacion_url,
                descripcion,
                politicas_hospedaje || null,
                servicios_generales || null,
                fecha_registro && fecha_registro.length ? fecha_registro : new Date().toISOString().slice(0, 10),
                estado_propiedad || 'activa',
                finalPhoto,
                id
            ]
        );

        console.log("✅ Propiedad actualizada:", id);
        res.json({ ok: true, message: "Propiedad actualizada correctamente" });
    } catch (error) {
        console.error("❌ Error al actualizar propiedad:", error);
        res.status(500).json({ ok: false, error: "Error al actualizar propiedad: " + (error.message || error) });
    }
}, function (err, req, res, next) {
    // Middleware de manejo de errores para multer
    if (err instanceof multer.MulterError) {
        console.error("❌ Error de multer:", err.message);
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ ok: false, error: "El archivo es demasiado grande (máx 5MB)" });
        }
        return res.status(400).json({ ok: false, error: "Error al subir archivo: " + err.message });
    } else if (err) {
        console.error("❌ Error:", err.message);
        return res.status(400).json({ ok: false, error: err.message || "Error desconocido" });
    }
});

// ==========================================================
// DELETE — Eliminar propiedad (solo anfitrión)
// ❌ DELETE — Eliminar propiedad (solo anfitrión)
// ==========================================================
router.delete('/:id', requireAuth, requireRole('anfitrion'), async (req, res) => {
    try {
        await pool.query(`DELETE FROM propiedades WHERE id_propiedad=?`, [req.params.id]);
        res.json({ ok: true });
    } catch (error) {
        res.status(500).json({ error: "Error al eliminar propiedad" });
    }
});

module.exports = router;
