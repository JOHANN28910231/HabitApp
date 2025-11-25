-- =========================================================
-- SEMILLA/UTIL: RESET DE DATOS PARA DESARROLLO - AppTiziHause
-- WARNING: Este script BORRA DATOS. Ejecutar SOLO en desarrollo/local.
-- Descripción: TRUNCATE de tablas de datos y reinicio de AUTO_INCREMENT.
-- No trunca la tabla `roles` (se asume que la inicializa `db/init.sql`).
-- =========================================================

SET NAMES utf8mb4;
USE habitapp;

-- Desactivar temporalmente FK checks para permitir truncates en cualquier orden
SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE resenas;
TRUNCATE TABLE pagos;
TRUNCATE TABLE reservaciones;
TRUNCATE TABLE habitacion_bloqueo;
TRUNCATE TABLE habitacion_servicio;
TRUNCATE TABLE habitacion_foto;
TRUNCATE TABLE habitacion;
TRUNCATE TABLE propiedades;
TRUNCATE TABLE usuario_rol;
TRUNCATE TABLE usuarios;
TRUNCATE TABLE servicios;

-- Volver a activar FK checks
SET FOREIGN_KEY_CHECKS = 1;

-- Comprobación rápida: mostrar próximos AUTO_INCREMENT para tablas clave
SELECT TABLE_NAME, AUTO_INCREMENT
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'habitapp' AND TABLE_NAME IN ('usuarios','propiedades','habitacion');

-- Nota: después de ejecutar este script puede (opcional) volver a ejecutar
-- db/seed.sql para repoblar datos de prueba.
