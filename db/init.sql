-- =====================================================================
--  ESQUEMA "HabitApp"
-- =====================================================================
SET NAMES utf8mb4;
SET time_zone = '+00:00';
SET sql_mode = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

CREATE DATABASE IF NOT EXISTS habitapp
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_0900_ai_ci;
USE habitapp;

-- =====================================================================
--  TABLA: usuarios (unifica huésped, anfitrión y admins; roles se asignan aparte)
-- =====================================================================
CREATE TABLE usuarios (
  id_usuario       BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre_completo  VARCHAR(100) NOT NULL,
  email            VARCHAR(100) NOT NULL UNIQUE,
  password_hash    VARCHAR(255) NOT NULL,
  telefono         VARCHAR(20),
  genero           VARCHAR(20),
  municipio        VARCHAR(50),
  estado           VARCHAR(50),
  nacionalidad     VARCHAR(50),
  fecha_nacimiento DATE,
  fecha_registro   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  estado_cuenta    ENUM('activo','bloqueado') NOT NULL DEFAULT 'activo',
  foto_url         VARCHAR(255) NULL,
  INDEX idx_usuarios_municipio_estado (municipio, estado)
) ENGINE=InnoDB;

-- =====================================================================
--  TABLAS: roles / usuario_rol (un usuario puede tener múltiples roles)
-- =====================================================================
CREATE TABLE roles (
  id_rol  TINYINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre  VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE usuario_rol (
  id_usuario BIGINT UNSIGNED NOT NULL,
  id_rol     TINYINT UNSIGNED NOT NULL,
  PRIMARY KEY (id_usuario, id_rol),
  CONSTRAINT fk_usuario_rol_usuario
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_usuario_rol_rol
    FOREIGN KEY (id_rol) REFERENCES roles(id_rol)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- =====================================================================
--  TABLA: propiedades (pertenecen a un anfitrión = usuario con rol anfitrión)
-- =====================================================================
CREATE TABLE propiedades (
  id_propiedad       BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_anfitrion       BIGINT UNSIGNED NOT NULL,
  nombre_propiedad   VARCHAR(100) NOT NULL,
  tipo_propiedad     VARCHAR(50)  NOT NULL,
  direccion          VARCHAR(150),
  codigo_postal      CHAR(5),
  municipio          VARCHAR(50),
  estado             VARCHAR(50),
  ubicacion_url      VARCHAR(255),
  descripcion        TEXT,
  politicas_hospedaje TEXT,
  fecha_registro     DATE,
  estado_propiedad   ENUM('activa','inactiva') NOT NULL DEFAULT 'activa',
  CONSTRAINT fk_propiedades_anfitrion
    FOREIGN KEY (id_anfitrion) REFERENCES usuarios(id_usuario)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX idx_propiedades_anfitrion (id_anfitrion),
  INDEX idx_propiedades_ubicacion (municipio, estado)
) ENGINE=InnoDB;

-- =====================================================================
--  TABLA: habitacion (cada habitación pertenece a una propiedad)
-- =====================================================================
CREATE TABLE habitacion (
  id_habitacion     BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_propiedad      BIGINT UNSIGNED NOT NULL,
  descripcion       TEXT,
  capacidad_maxima  SMALLINT UNSIGNED,
  precio_por_noche  DECIMAL(10,2),
  precio_por_semana DECIMAL(10,2),
  precio_por_mes    DECIMAL(10,2),
  estado_habitacion ENUM('activa','inactiva') NOT NULL DEFAULT 'activa',
  CONSTRAINT fk_habitacion_propiedad
    FOREIGN KEY (id_propiedad) REFERENCES propiedades(id_propiedad)
    ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_habitacion_propiedad (id_propiedad)
) ENGINE=InnoDB;

-- =====================================================================
--  TABLA: habitacion_foto (múltiples fotos por habitación)
-- =====================================================================
CREATE TABLE habitacion_foto (
  id_foto       BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_habitacion BIGINT UNSIGNED NOT NULL,
  url           VARCHAR(255) NOT NULL,
  creado_en     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_hab_foto_habitacion
    FOREIGN KEY (id_habitacion) REFERENCES habitacion(id_habitacion)
    ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_foto_habitacion (id_habitacion)
) ENGINE=InnoDB;

-- =====================================================================
--  TABLAS: servicios (catálogo) y habitacion_servicio (relación N:M)
-- =====================================================================
CREATE TABLE servicios (
  id_servicio SMALLINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre      VARCHAR(80) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE habitacion_servicio (
  id_habitacion BIGINT UNSIGNED NOT NULL,
  id_servicio   SMALLINT UNSIGNED NOT NULL,
  PRIMARY KEY (id_habitacion, id_servicio),
  CONSTRAINT fk_hab_serv_habitacion
    FOREIGN KEY (id_habitacion) REFERENCES habitacion(id_habitacion)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_hab_serv_servicio
    FOREIGN KEY (id_servicio) REFERENCES servicios(id_servicio)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX idx_hab_serv_servicio (id_servicio)
) ENGINE=InnoDB;

-- =====================================================================
--  TABLA: reservaciones (reserva una habitación por un huésped)
-- =====================================================================
CREATE TABLE reservaciones (
  id_reservacion BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_habitacion  BIGINT UNSIGNED NOT NULL,
  id_huesped     BIGINT UNSIGNED NOT NULL,
  estado_reserva ENUM('en_proceso','reservado','cancelado','finalizado') NOT NULL DEFAULT 'en_proceso',
  fecha_reserva  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_inicio   DATE NOT NULL,
  fecha_salida   DATE NOT NULL,
  monto_total    DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  CONSTRAINT fk_reserva_habitacion
    FOREIGN KEY (id_habitacion) REFERENCES habitacion(id_habitacion)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_reserva_huesped
    FOREIGN KEY (id_huesped) REFERENCES usuarios(id_usuario)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT chk_reserva_rango_valido CHECK (fecha_salida > fecha_inicio),
  INDEX idx_reserva_hab_rango (id_habitacion, fecha_inicio, fecha_salida),
  INDEX idx_reserva_huesped (id_huesped)
) ENGINE=InnoDB;

-- =====================================================================
--  TABLA: pagos (puede haber varios intentos por reservación)
-- =====================================================================
CREATE TABLE pagos (
  id_pago        BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_reservacion BIGINT UNSIGNED NOT NULL,
  monto          DECIMAL(10,2) NOT NULL,
  metodo_pago    ENUM('tarjeta') NOT NULL DEFAULT 'tarjeta',
  fecha_pago     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  estado_pago    ENUM('aprobado','pendiente','rechazado') NOT NULL DEFAULT 'pendiente',
  referencia     VARCHAR(100),
  CONSTRAINT fk_pagos_reservacion
    FOREIGN KEY (id_reservacion) REFERENCES reservaciones(id_reservacion)
    ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_pagos_estado_fecha (estado_pago, fecha_pago),
  INDEX idx_pagos_reservacion (id_reservacion)
) ENGINE=InnoDB;

-- =====================================================================
--  TABLA: habitacion_bloqueo (bloqueos de calendario: mantenimiento/uso propietario, etc.)
-- =====================================================================
CREATE TABLE habitacion_bloqueo (
  id_bloqueo     BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_habitacion  BIGINT UNSIGNED NOT NULL,
  fecha_inicio   DATE NOT NULL,
  fecha_fin      DATE NOT NULL,
  motivo         VARCHAR(120),
  CONSTRAINT fk_bloqueo_habitacion
    FOREIGN KEY (id_habitacion) REFERENCES habitacion(id_habitacion)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT chk_bloqueo_rango_valido CHECK (fecha_fin > fecha_inicio),
  INDEX idx_bloqueo_hab_rango (id_habitacion, fecha_inicio, fecha_fin)
) ENGINE=InnoDB;

-- =====================================================================
--  TABLA: resenas (reseñas de huéspedes a habitación o propiedad)
--  Al menos una FK (habitacion o propiedad) debe estar informada.
-- =====================================================================
CREATE TABLE resenas (
  id_resena      BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_huesped     BIGINT UNSIGNED NOT NULL,
  id_habitacion  BIGINT UNSIGNED NULL,
  id_propiedad   BIGINT UNSIGNED NULL,
  rating         TINYINT UNSIGNED NOT NULL,
  titulo         VARCHAR(120),
  comentario     TEXT,
  fecha          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  visible        BOOLEAN NOT NULL DEFAULT 1,
  CONSTRAINT fk_resena_huesped
    FOREIGN KEY (id_huesped) REFERENCES usuarios(id_usuario)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_resena_habitacion
    FOREIGN KEY (id_habitacion) REFERENCES habitacion(id_habitacion)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_resena_propiedad
    FOREIGN KEY (id_propiedad) REFERENCES propiedades(id_propiedad)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT chk_resena_rating CHECK (rating BETWEEN 1 AND 5),
  CONSTRAINT chk_resena_destino CHECK (
    (id_habitacion IS NOT NULL) OR (id_propiedad IS NOT NULL)
  ),
  INDEX idx_resena_visible (visible),
  INDEX idx_resena_destinos (id_habitacion, id_propiedad)
) ENGINE=InnoDB;

-- =====================================================================
--  ÍNDICES ADICIONALES sugeridos para búsquedas y reportes
-- =====================================================================
CREATE INDEX idx_hab_capacidad_precio
  ON habitacion (capacidad_maxima, precio_por_noche);

CREATE INDEX idx_propiedad_estado
  ON propiedades (estado_propiedad);

-- =====================================================================
--  SEED: roles base
-- =====================================================================
INSERT INTO roles (nombre) VALUES
  ('huesped'), ('anfitrion'), ('admin_global')
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);
