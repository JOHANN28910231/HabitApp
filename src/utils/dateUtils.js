// src/utils/dateUtils.js
const dayjs = require('dayjs');

/**
 * Devuelve true si los rangos [start1, end1) y [start2, end2) se traslapan.
 */
function rangesOverlap(start1, end1, start2, end2) {
    const s1 = dayjs(start1);
    const e1 = dayjs(end1);
    const s2 = dayjs(start2);
    const e2 = dayjs(end2);
    return s1.isBefore(e2) && s2.isBefore(e1);
}

/**
 * Normaliza fechas de strings a YYYY-MM-DD (o lanza error).
 */
function normalizeDate(str) {
    const d = dayjs(str);
    if (!d.isValid()) {
        throw new Error(`Fecha inválida: ${str}`);
    }
    return d.format('YYYY-MM-DD');
}

module.exports = {
    rangesOverlap,
    normalizeDate,
};
