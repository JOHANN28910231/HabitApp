// calc.js - utilidades de cálculo (noche/semana/mes)\nmodule.exports = { /* funciones */ }

function calcPrice(room, type, nights) {
    if (!room) return 0;
    switch (type) {
        case 'night':
            return Number(room.precio_por_noche || 0) * nights;
        case 'week':
            return Number(room.precio_por_semana || 0);
        case 'month':
            return Number(room.precio_por_mes || 0);
        default:
            return Number(room.precio_por_noche || 0) * nights;
    }
}


module.exports = { calcPrice };