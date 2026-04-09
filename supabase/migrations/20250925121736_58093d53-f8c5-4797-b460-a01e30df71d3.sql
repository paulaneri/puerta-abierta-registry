-- Corregir rol de paula@usinadeideas.com.ar para que sea coordinador
UPDATE user_roles 
SET role = 'coordinador' 
WHERE user_id = (SELECT id FROM profiles WHERE email = 'paula@usinadeideas.com.ar');

-- Eliminar usuarios con emails @ejemplo.com que no funcionan
DELETE FROM user_roles 
WHERE user_id IN (
  SELECT id FROM profiles 
  WHERE email IN ('admin@ejemplo.com', 'coordinador@ejemplo.com', 'trabajador@ejemplo.com')
);

DELETE FROM profiles 
WHERE email IN ('admin@ejemplo.com', 'coordinador@ejemplo.com', 'trabajador@ejemplo.com');