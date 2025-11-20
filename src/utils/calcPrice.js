// src/utils/calcPrice.js
const dayjs = require('dayjs');

function diffDays(start, end) {
    const s = dayjs(start);
    const e = dayjs(end);
    return e.diff(s, 'day'); // número de noches
}

/**
 * Calcula el monto total según tipo de alojamiento.
 * tipo: 'noche' | 'semana' | 'mes'
 */
function calculateTotalAmount(tipo, habitacion, fecha_inicio, fecha_salida) {
    const nights = diffDays(fecha_inicio, fecha_salida);

    if (nights <= 0) {
        throw new Error('El número de noches debe ser mayor a 0');
    }

    switch (tipo) {
        case 'noche':
            if (!habitacion.precio_por_noche) throw new Error('La habitación no tiene precio_por_noche');
            return Number(habitacion.precio_por_noche) * nights;

        case 'semana':
            if (!habitacion.precio_por_semana) throw new Error('La habitación no tiene precio_por_semana');
            // aproximación: noches / 7, redondeando hacia arriba
            return Number(habitacion.precio_por_semana) * Math.ceil(nights / 7);

        case 'mes':
            if (!habitacion.precio_por_mes) throw new Error('La habitación no tiene precio_por_mes');
            // aproximación: noches / 30, redondeando hacia arriba
            return Number(habitacion.precio_por_mes) * Math.ceil(nights / 30);

        default:
            throw new Error(`Tipo de alojamiento inválido: ${tipo}`);
    }
}

module.exports = {
    calculateTotalAmount,
};
