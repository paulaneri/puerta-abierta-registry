-- Eliminar duplicados de Lucía Sánchez, manteniendo solo el más reciente
DELETE FROM mujeres 
WHERE id NOT IN (
  SELECT DISTINCT ON (LOWER(nombre), LOWER(apellido)) id
  FROM mujeres 
  WHERE LOWER(nombre) = 'lucía' AND LOWER(apellido) = 'sánchez'
  ORDER BY LOWER(nombre), LOWER(apellido), created_at DESC
);

-- Crear un índice único para evitar duplicados futuros basado en nombre y apellido  
CREATE UNIQUE INDEX IF NOT EXISTS idx_mujeres_nombre_apellido 
ON mujeres (LOWER(nombre), LOWER(apellido));