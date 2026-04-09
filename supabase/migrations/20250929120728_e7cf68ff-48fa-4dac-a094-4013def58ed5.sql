-- Crear un usuario coordinador con credenciales conocidas para testing
-- Primero verificamos si ya existe y lo eliminamos si es necesario

-- Insertar directamente en auth.users (esto simula el registro)
-- Como no podemos usar la API de auth directamente desde SQL, 
-- crearemos registros en nuestras tablas y luego el usuario real se creará via aplicación

-- Verificar usuarios coordinadores existentes
SELECT u.email, ur.role 
FROM auth.users u 
JOIN user_roles ur ON u.id = ur.user_id 
WHERE ur.role = 'coordinador';