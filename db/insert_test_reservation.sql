-- Script para insertar una reservación finalizada (para probar sistema de reseñas)
-- Esta reservación tendrá fecha_salida en el pasado y no tendrá reseña asociada

USE habitapp;

-- Insertar una reservación finalizada (fecha de salida hace 2 días)
INSERT INTO reservaciones (id_habitacion, id_huesped, estado_reserva, fecha_reserva, fecha_inicio, fecha_salida, monto_total, tipo_alojamiento)
VALUES
  (
    -- Usar la primera habitación disponible
    (SELECT h.id_habitacion FROM habitacion h LIMIT 1),
    -- Usar el huésped de prueba (ana.huesped@example.com)
    (SELECT id_usuario FROM usuarios WHERE email = 'ana.huesped@example.com'),
    'finalizado',
    DATE_SUB(NOW(), INTERVAL 5 DAY),  -- Se reservó hace 5 días
    DATE_SUB(NOW(), INTERVAL 4 DAY),  -- Check-in hace 4 días
    DATE_SUB(NOW(), INTERVAL 2 DAY),  -- Check-out hace 2 días (FINALIZADA)
    1600.00,
    'noche'
  );

-- Mostrar la reservación creada
SELECT 
    r.id_reservacion,
    r.id_habitacion,
    r.id_huesped,
    u.nombre_completo,
    u.correo_electronico AS email,
    r.fecha_salida,
    r.estado_reserva,
    h.descripcion AS habitacion,
    p.nombre AS propiedad
FROM reservaciones r
JOIN usuarios u ON u.id_usuario = r.id_huesped
JOIN habitacion h ON h.id_habitacion = r.id_habitacion
JOIN propiedades p ON p.id_propiedad = h.id_propiedad
ORDER BY r.id_reservacion DESC
LIMIT 1;
