-- Actualizar el rol del usuario puertaabiertarecreando@gmail.com a coordinador
UPDATE user_roles 
SET role = 'coordinador'
WHERE user_id = (
  SELECT id 
  FROM profiles 
  WHERE email = 'puertaabiertarecreando@gmail.com'
);