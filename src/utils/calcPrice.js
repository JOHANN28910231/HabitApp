// src/utils/calcPrice

const dayjs = require('dayjs');

function diffDays(start, end) {
    const s = dayjs(start);
    const e = dayjs(end);
    return e.diff(s, 'day');//número de noches
}

function calculateTotalAmount(tipo, habitacion, fecha_inicio, fecha_salida) {
    const nights = diffDays(fecha_inicio, fecha_salida);

    if (nights <= 0) {
        throw new Error('El número de noches debe ser mayor a 0');
    }

    // Aquí se conecta el objeto de BD con variables JS
    const {
        precio_por_noche,
        precio_por_semana,
        precio_por_mes,
    } = habitacion;

    switch (tipo) {
        case 'noche':
            if (!precio_por_noche) throw new Error('La habitación no tiene precio_por_noche');
            return Number(precio_por_noche) * nights;

        case 'semana':
            if (!precio_por_semana) throw new Error('La habitación no tiene precio_por_semana');
            return Number(precio_por_semana) * Math.ceil(nights / 7);

        case 'mes':
            if (!precio_por_mes) throw new Error('La habitación no tiene precio_por_mes');
            return Number(precio_por_mes) * Math.ceil(nights / 30);

        default:
            throw new Error(`Tipo de alojamiento inválido: ${tipo}`);
    }
}

module.exports = { calculateTotalAmount };

