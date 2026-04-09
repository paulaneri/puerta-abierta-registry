-- Agregar restricción única a la columna user_id en user_roles
-- Esto es necesario para que funcione el upsert en createExampleUsers

-- Primero eliminar duplicados si existen usando row_number
WITH duplicates AS (
  SELECT id, 
         ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at) as rn
  FROM public.user_roles
)
DELETE FROM public.user_roles 
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Agregar la restricción única
ALTER TABLE public.user_roles 
ADD CONSTRAINT user_roles_user_id_unique UNIQUE (user_id);