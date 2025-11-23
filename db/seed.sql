-- =========================================================
--  SEMILLA DE DATOS PARA DESARROLLO - AppTiziHause
--  Este script limpia tablas y genera datos de prueba ÚNICAMENTE durante desarrollo.
-- =========================================================

SET NAMES utf8mb4;
USE habitapp;

-- ---------------------------------------------------------
-- 1) Limpiar datos previos (manteniendo estructura)
-- ---------------------------------------------------------
SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE resenas;
TRUNCATE TABLE pagos;
TRUNCATE TABLE reservaciones;
TRUNCATE TABLE habitacion_bloqueo;
TRUNCATE TABLE habitacion_servicio;
TRUNCATE TABLE habitacion_foto;
TRUNCATE TABLE habitacion;
TRUNCATE TABLE propiedades;
TRUNCATE TABLE habitacion_servicio;
TRUNCATE TABLE servicios;
TRUNCATE TABLE usuario_rol;
TRUNCATE TABLE usuarios;

-- ---------------------------------------------------------
-- 2) Usuarios de ejemplo
--    Nota: Los password_hash son de ejemplo (no funcionan
--    para login real). Reemplaza por hashes válidos si deseas
--    cuentas utilizables para login en desarrollo.
-- ---------------------------------------------------------
INSERT INTO usuarios (nombre_completo, email, password_hash, telefono, genero, municipio, estado, nacionalidad, fecha_nacimiento)
VALUES
  ('Ana Huésped', 'ana.huesped@example.com', '$2b$10$dummyhashparaPRUEBA1234567890123456789012', '9991112233', 'Femenino', 'Tizimín', 'Yucatán', 'Mexicana', '2000-05-10'),
  ('Carlos Anfitrión', 'carlos.anfitrion@example.com', '$2b$10$dummyhashparaPRUEBA1234567890123456789012', '9992223344', 'Masculino', 'Mérida', 'Yucatán', 'Mexicana', '1995-08-21'),
  ('Admin Global', 'admin.global@example.com', '$2b$10$dummyhashparaPRUEBA1234567890123456789012', '9993334455', 'Masculino', 'Tizimín', 'Yucatán', 'Mexicana', '1990-01-01');

-- ---------------------------------------------------------
-- 3) Roles y asociaciones
-- ---------------------------------------------------------
INSERT INTO roles (nombre) VALUES ('huesped'), ('anfitrion'), ('admin_global')
  ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

INSERT INTO usuario_rol (id_usuario, id_rol)
SELECT u.id_usuario, r.id_rol
FROM usuarios u
JOIN roles r ON r.nombre = 'anfitrion'
WHERE u.email = 'carlos.anfitrion@example.com';

INSERT INTO usuario_rol (id_usuario, id_rol)
SELECT u.id_usuario, r.id_rol
FROM usuarios u
JOIN roles r ON r.nombre = 'admin_global'
WHERE u.email = 'admin.global@example.com';

-- ---------------------------------------------------------
-- 4) Servicios de ejemplo (catálogo)
-- ---------------------------------------------------------
INSERT INTO servicios (nombre) VALUES
  ('WiFi'), ('Aire acondicionado'), ('Cama matrimonial'), ('Televisión'), ('Refrigerador'), ('Estufa'), ('Vajilla'), ('Estacionamiento'), ('Alberca compartida')
  ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

-- ---------------------------------------------------------
-- 5) Propiedades y habitaciones de ejemplo (de Carlos Anfitrión)
-- ---------------------------------------------------------
INSERT INTO propiedades (id_anfitrion, nombre_propiedad, tipo_propiedad, direccion, codigo_postal, municipio, estado, ubicacion_url, descripcion, politicas_hospedaje, fecha_registro, estado_propiedad)
VALUES
  ((SELECT id_usuario FROM usuarios WHERE email = 'carlos.anfitrion@example.com'), 'Cabaña Buen Viaje', 'Cabaña', 'Calle 50 entre 48 y 46, Col. Centro', '97700', 'Tizimín', 'Yucatán', 'https://maps.google.com/?q=Cabaña+Buen+Viaje', 'Cabaña acogedora con jardín y alberca.', 'No fumar. No mascotas.', CURDATE(), 'activa'),
  ((SELECT id_usuario FROM usuarios WHERE email = 'carlos.anfitrion@example.com'), 'Loft Centro Mérida', 'Loft', 'Calle 60 x 55 y 57, Centro', '97000', 'Mérida', 'Yucatán', 'https://maps.google.com/?q=Loft+Centro+Merida', 'Loft moderno cerca del centro de Mérida.', 'No fumar dentro del loft.', CURDATE(), 'activa');

-- Habitaciones
INSERT INTO habitacion (id_propiedad, descripcion, capacidad_maxima, precio_por_noche, precio_por_semana, precio_por_mes, estado_habitacion)
VALUES
  ((SELECT id_propiedad FROM propiedades WHERE nombre_propiedad = 'Cabaña Buen Viaje'), 'Habitación principal con cama matrimonial y vista al jardín.', 2, 800.00, 5000.00, 18000.00, 'activa'),
  ((SELECT id_propiedad FROM propiedades WHERE nombre_propiedad = 'Cabaña Buen Viaje'), 'Habitación secundaria con dos camas individuales.', 3, 600.00, 3600.00, 12000.00, 'activa'),
  ((SELECT id_propiedad FROM propiedades WHERE nombre_propiedad = 'Loft Centro Mérida'), 'Loft completo con área de sala, cocina y cama queen.', 2, 900.00, 5600.00, 20000.00, 'activa');

-- Fotos de habitaciones (URLs de ejemplo)
INSERT INTO habitacion_foto (id_habitacion, url)
SELECT h.id_habitacion, 'https://example.com/img/cabana_buen_viaje_hab_principal_1.jpg'
FROM habitacion h JOIN propiedades p ON p.id_propiedad = h.id_propiedad
WHERE p.nombre_propiedad = 'Cabaña Buen Viaje' AND h.descripcion LIKE 'Habitación principal%';

INSERT INTO habitacion_foto (id_habitacion, url)
SELECT h.id_habitacion, 'https://example.com/img/cabana_buen_viaje_hab_secundaria_1.jpg'
FROM habitacion h JOIN propiedades p ON p.id_propiedad = h.id_propiedad
WHERE p.nombre_propiedad = 'Cabaña Buen Viaje' AND h.descripcion LIKE 'Habitación secundaria%';

INSERT INTO habitacion_foto (id_habitacion, url)
SELECT h.id_habitacion, 'https://example.com/img/loft_merida_1.jpg'
FROM habitacion h JOIN propiedades p ON p.id_propiedad = h.id_propiedad
WHERE p.nombre_propiedad = 'Loft Centro Mérida';

-- Relacionar servicios con habitaciones (ejemplo)
INSERT INTO habitacion_servicio (id_habitacion, id_servicio)
SELECT h.id_habitacion, s.id_servicio
FROM habitacion h
JOIN propiedades p ON p.id_propiedad = h.id_propiedad
JOIN servicios s ON s.nombre IN ('WiFi', 'Aire acondicionado', 'Cama matrimonial', 'Televisión', 'Estacionamiento')
WHERE p.nombre_propiedad = 'Cabaña Buen Viaje' AND h.descripcion LIKE 'Habitación principal%';

INSERT INTO habitacion_servicio (id_habitacion, id_servicio)
SELECT h.id_habitacion, s.id_servicio
FROM habitacion h
JOIN propiedades p ON p.id_propiedad = h.id_propiedad
JOIN servicios s ON s.nombre IN ('WiFi', 'Ventilador', 'Estacionamiento')
WHERE p.nombre_propiedad = 'Cabaña Buen Viaje' AND h.descripcion LIKE 'Habitación secundaria%';

-- ---------------------------------------------------------
-- 9) Reservación de ejemplo (Ana Huésped reserva en Cabaña)
-- ---------------------------------------------------------
INSERT INTO reservaciones (id_habitacion, id_huesped, estado_reserva, fecha_reserva, fecha_inicio, fecha_salida, monto_total)
VALUES
  (
    (SELECT h.id_habitacion FROM habitacion h JOIN propiedades p ON p.id_propiedad = h.id_propiedad WHERE p.nombre_propiedad = 'Cabaña Buen Viaje' LIMIT 1),
    (SELECT id_usuario FROM usuarios WHERE email = 'ana.huesped@example.com'),
    'reservado',
    NOW(),
    DATE_ADD(CURDATE(), INTERVAL 7 DAY),
    DATE_ADD(CURDATE(), INTERVAL 10 DAY),
    2400.00
  );

-- Pago de ejemplo para esa reservación
INSERT INTO pagos (id_reservacion, monto, metodo_pago, fecha_pago, estado_pago, referencia)
VALUES
  ((SELECT id_reservacion FROM reservaciones ORDER BY id_reservacion DESC LIMIT 1), 2400.00, 'tarjeta', NOW(), 'aprobado', 'PAGO-TEST-0001');

-- Bloqueo de ejemplo (mantenimiento en Loft Mérida)
INSERT INTO habitacion_bloqueo (id_habitacion, fecha_inicio, fecha_fin, motivo)
VALUES
  (
    (SELECT h.id_habitacion FROM habitacion h JOIN propiedades p ON p.id_propiedad = h.id_propiedad WHERE p.nombre_propiedad = 'Loft Centro Mérida' LIMIT 1),
    DATE_ADD(CURDATE(), INTERVAL 15 DAY),
    DATE_ADD(CURDATE(), INTERVAL 17 DAY),
    'Mantenimiento de aire acondicionado'
  );

-- Reseña de ejemplo
INSERT INTO resenas (id_huesped, id_habitacion, id_propiedad, rating, titulo, comentario, visible)
VALUES
  (
    (SELECT id_usuario FROM usuarios WHERE email = 'ana.huesped@example.com'),
    (SELECT h.id_habitacion FROM habitacion h JOIN propiedades p ON p.id_propiedad = h.id_propiedad WHERE p.nombre_propiedad = 'Cabaña Buen Viaje' AND h.descripcion LIKE 'Habitación principal%' LIMIT 1),
    (SELECT id_propiedad FROM propiedades WHERE nombre_propiedad = 'Cabaña Buen Viaje'),
    5,
    'Estancia increíble',
    'La cabaña está muy limpia, cómoda y la alberca es perfecta para relajarse.',
    1
  );

-- Reactivar chequeos de FK
SET FOREIGN_KEY_CHECKS = 1;
