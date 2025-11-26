-- =====================================================================
-- Agregar columnas faltantes a la tabla propiedades
-- =====================================================================

USE habitapp;

-- Agregar columna url_fotos_p (para la foto de la propiedad)
ALTER TABLE propiedades 
ADD COLUMN url_fotos_p VARCHAR(255) NULL AFTER estado_propiedad;

-- Agregar columna servicios_generales (servicios que ofrece la propiedad)
ALTER TABLE propiedades 
ADD COLUMN servicios_generales TEXT NULL AFTER politicas_hospedaje;

-- Verificar los cambios
DESCRIBE propiedades;
