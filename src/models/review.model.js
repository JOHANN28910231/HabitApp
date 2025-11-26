// src/models/review.model.js
const pool = require('../utils/db');

async function createReview({
                                id_huesped,
                                id_habitacion,
                                id_propiedad,
                                rating,
                                titulo,
                                comentario
                            }) {
    const [result] = await pool.query(
        `INSERT INTO resenas
        (id_huesped, id_habitacion, id_propiedad, rating, titulo, comentario)
        VALUES (?, ?, ?, ?, ?, ?)`,
        [
            id_huesped,
            id_habitacion,
            id_propiedad,
            rating,
            titulo || null,
            comentario || null,
        ]
    );

    return { id_resena: result.insertId };
}

async function existsReviewForReservation(id_huesped, id_habitacion) {
    const [rows] = await pool.query(
        `SELECT id_resena
         FROM resenas
         WHERE id_huesped = ?
         AND id_habitacion = ?`,
        [id_huesped, id_habitacion]
    );
    return rows.length > 0;
}

async function getReviewsByProperty(id_propiedad) {
    const [rows] = await pool.query(
        `SELECT r.*, u.nombre_completo
         FROM resenas r
         JOIN usuarios u ON u.id_usuario = r.id_huesped
         WHERE r.id_propiedad = ?
         ORDER BY r.fecha DESC`,
        [id_propiedad]
    );
    return rows;
}

async function getReviewsByRoom(id_habitacion) {
    const [rows] = await pool.query(
        `SELECT r.*, u.nombre_completo
         FROM resenas r
         JOIN usuarios u ON u.id_usuario = r.id_huesped
         WHERE r.id_habitacion = ?
         ORDER BY r.fecha DESC`,
        [id_habitacion]
    );
    return rows;
}

module.exports = {
    createReview,
    existsReviewForReservation,
    getReviewsByProperty,
    getReviewsByRoom,
};
