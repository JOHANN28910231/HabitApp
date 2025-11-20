-- sql
-- Seeds mínimos: admin y usuario de prueba
-- Genera un bcrypt hash (ver comando arriba) y reemplaza <BCRYPT_HASH_ADMIN> y <BCRYPT_HASH_USER>

USE habitapp;

-- Admin de prueba
INSERT INTO usuarios (nombre_completo, email, password_hash, telefono, genero, fecha_nacimiento, estado_cuenta)
VALUES
  ('Admin Prueba', 'admin@example.com', '<BCRYPT_HASH_ADMIN>', '0000000000', 'no especificado', NULL, 'activo');

SET @admin_id = LAST_INSERT_ID();
INSERT INTO usuario_rol (id_usuario, id_rol)
VALUES (@admin_id, (SELECT id_rol FROM roles WHERE nombre = 'admin_global'));

-- Usuario huésped de prueba
INSERT INTO usuarios (nombre_completo, email, password_hash, telefono, genero, fecha_nacimiento, estado_cuenta)
VALUES
  ('Usuario Prueba', 'user@example.com', '<BCRYPT_HASH_USER>', '0000000000', 'no especificado', NULL, 'activo');

SET @user_id = LAST_INSERT_ID();
INSERT INTO usuario_rol (id_usuario, id_rol)
VALUES (@user_id, (SELECT id_rol FROM roles WHERE nombre = 'huesped'));

-- Opcional: otras semillas (propiedades, servicios, etc.) según necesidad.