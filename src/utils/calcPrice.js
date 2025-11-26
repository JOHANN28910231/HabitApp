// src/utils/calcPrice

const dayjs = require('dayjs');
const { normalizeDate } = require('./dateUtils');

/**
 * Calcula el número de noches entre from y to (to excluido).
 */
/**
 * Normaliza fechas y calcula número de noches (to excluido).
 */
function diffInNights(from, to) {
    const fromNorm = normalizeDate(from);
    const toNorm   = normalizeDate(to);

    const dFrom = new Date(fromNorm);
    const dTo   = new Date(toNorm);
    const diffMs = dTo - dFrom;
    const nights = diffMs / (1000 * 60 * 60 * 24);

    if (!Number.isFinite(nights) || nights <= 0) {
        throw new Error('Rango de fechas inválido para calcular noches');
    }
    return nights;
}

/**
 * tipo: 'noche' | 'semana' | 'mes' | cualquier otra cosa (cae a noche)
 * room: { precio_por_noche, precio_por_semana, precio_por_mes }
 * from, to: fechas (string) en formato aceptado por normalizeDate
 */
function calculateTotalAmount(tipo, room, from, to) {
    let nights;
    try {
        nights = diffInNights(from, to);
    } catch (err) {
        // Logueamos para depurar, pero NO reventamos la app
        console.warn('Error calculando noches en calculateTotalAmount:', err.message);
        return null;
    }

    if (!nights || nights <= 0) {
        return null;
    }

    const pn = Number(room.precio_por_noche || 0);
    const pw = Number(room.precio_por_semana || 0);
    const pm = Number(room.precio_por_mes || 0);

    let total;

    if (tipo === 'semana' && pw > 0) {
        const weeks  = Math.floor(nights / 7);
        const extra  = nights % 7;
        const dailyW = pw / 7;
        total = weeks * pw + extra * dailyW;
    } else if (tipo === 'mes' && pm > 0) {
        const daysPerMonth = 30;
        const months = Math.floor(nights / daysPerMonth);
        const extra  = nights % daysPerMonth;
        const dailyM = pm / daysPerMonth;
        total = months * pm + extra * dailyM;
    } else {
        // tipo 'noche' o cualquier cosa rara → por noche
        total = pn > 0 ? pn * nights : 0;
    }

    return Math.round(total);
}

module.exports = {
    calculateTotalAmount,
    diffInNights,
};

