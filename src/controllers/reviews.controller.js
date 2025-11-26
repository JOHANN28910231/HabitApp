// src/controllers/reviews.controller.js

const jwt = require('jsonwebtoken');
const pool = require('../utils/db');
const {
    createReview,
    existsReviewForReservation,
    getReviewsByProperty,
    getReviewsByRoom,
} = require('../models/review.model');
const { getAllReviews } = require('../models/review.model');

const REVIEW_SECRET = process.env.REVIEW_SECRET;

async function getReviewFromToken(req, res) {
    const token = req.query.token;

    if (!token) {
        return res.status(400).json({ error: "Token no proporcionado." });
    }

    try {
        const data = jwt.verify(token, REVIEW_SECRET);

        const { id_reservacion, id_huesped, id_habitacion } = data;

        const [rows] = await pool.query(
            `SELECT r.*, h.id_propiedad
             FROM reservaciones r
             JOIN habitacion h ON h.id_habitacion = r.id_habitacion
             WHERE r.id_reservacion = ?`,
            [id_reservacion]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: "Reservación no encontrada." });
        }

        const reserva = rows[0];

        const yaExiste = await existsReviewForReservation(
            reserva.id_huesped,
            reserva.id_habitacion
        );

        if (yaExiste) {
            return res.status(409).json({ error: "Ya existe una reseña para esta estancia." });
        }

        return res.json({
            ok: true,
            reserva: {
                id_reservacion: reserva.id_reservacion,
                id_huesped: reserva.id_huesped,
                id_habitacion: reserva.id_habitacion,
                id_propiedad: reserva.id_propiedad,
                fecha_salida: reserva.fecha_salida,
            }
        });
    } catch (err) {
        console.error(err);
        return res.status(400).json({ error: "Token inválido o expirado." });
    }
}

async function createReviewFromToken(req, res) {
    const token = req.body.token;

    if (!token) return res.status(400).json({ error: "Token requerido" });

    try {
        const payload = jwt.verify(token, REVIEW_SECRET);

        const { id_reservacion } = payload;

        const [rows] = await pool.query(
            `SELECT r.*, h.id_propiedad
             FROM reservaciones r
             JOIN habitacion h ON h.id_habitacion = r.id_habitacion
             WHERE r.id_reservacion = ?`,
            [id_reservacion]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: "Reservacion no encontrada." });
        }

        const reserva = rows[0];

        const yaExiste = await existsReviewForReservation(
            reserva.id_huesped,
            reserva.id_habitacion
        );

        if (yaExiste) {
            return res.status(409).json({ error: "Ya existe una reseña para esta estancia." });
        }

        const nueva = await createReview({
            id_huesped: reserva.id_huesped,
            id_habitacion: reserva.id_habitacion,
            id_propiedad: reserva.id_propiedad,
            rating: req.body.rating,
            titulo: req.body.titulo,
            comentario: req.body.comentario,
        });

        res.status(201).json(nueva);

    } catch (err) {
        console.error(err);
        res.status(400).json({ error: "Token inválido o expirado." });
    }
}

async function listReviewsByProperty(req, res) {
    const id = req.params.id_propiedad;
    const rows = await getReviewsByProperty(id);
    res.json(rows);
}

async function listReviewsByRoom(req, res) {
    const id = req.params.id_habitacion;
    const rows = await getReviewsByRoom(id);
    res.json(rows);
}

async function listAllReviews(req, res) {
    try {
        const rows = await getAllReviews();
        res.json(rows);
    } catch (err) {
        console.error('Error listAllReviews:', err);
        res.status(500).json({ error: 'Error obteniendo todas las reseñas' });
    }
}

module.exports = {
    getReviewFromToken,
    createReviewFromToken,
    listReviewsByProperty,
    listReviewsByRoom,
    listAllReviews,
};
