-- Tabla para trackear invitaciones de reseña enviadas
-- Evita enviar múltiples correos a la misma reservación

CREATE TABLE IF NOT EXISTS review_invites_sent (
    id_invite BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_reservacion BIGINT UNSIGNED NOT NULL,
    id_huesped BIGINT UNSIGNED NOT NULL,
    id_habitacion BIGINT UNSIGNED NOT NULL,
    email VARCHAR(255) NOT NULL,
    fecha_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    token_enviado VARCHAR(500),
    UNIQUE KEY unique_invite (id_reservacion),
    INDEX idx_huesped (id_huesped),
    INDEX idx_habitacion (id_habitacion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
