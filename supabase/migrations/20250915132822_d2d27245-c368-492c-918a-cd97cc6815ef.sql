-- Crear usuarios de ejemplo directamente en la base de datos
-- Primero insertar en auth.users (esto normalmente se hace automáticamente, pero lo simularemos)

-- Función para crear usuarios de ejemplo de forma segura
CREATE OR REPLACE FUNCTION create_example_user(
  user_email TEXT,
  user_password TEXT,
  user_role app_role,
  user_nombre TEXT DEFAULT 'Usuario',
  user_apellido TEXT DEFAULT 'Ejemplo'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_user_id UUID;
BEGIN
  -- Verificar si el usuario ya existe
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = user_email) THEN
    RETURN FALSE; -- Usuario ya existe
  END IF;
  
  -- Generar un UUID para el nuevo usuario
  new_user_id := gen_random_uuid();
  
  -- Insertar en auth.users usando la API de Supabase sería lo ideal,
  -- pero como no podemos hacerlo directamente desde SQL, vamos a crear
  -- usuarios "virtuales" en nuestras tablas por ahora
  
  -- Insertar en profiles
  INSERT INTO public.profiles (id, email, nombre, apellido)
  VALUES (new_user_id, user_email, user_nombre, user_apellido);
  
  -- Insertar rol
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new_user_id, user_role);
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;

-- Llamar a la función para crear usuarios de ejemplo
SELECT create_example_user('admin@ejemplo.com', 'AdminTest123!', 'administrador', 'María', 'González');
SELECT create_example_user('coordinador@ejemplo.com', 'CoordTest123!', 'coordinador', 'Juan', 'Pérez'); 
SELECT create_example_user('trabajador@ejemplo.com', 'TrabTest123!', 'trabajador', 'Ana', 'Rodríguez');