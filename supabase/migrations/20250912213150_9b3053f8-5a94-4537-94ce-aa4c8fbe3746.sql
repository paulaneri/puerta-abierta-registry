-- Insertar perfiles de ejemplo para cada rol
-- Primero insertamos los perfiles de usuario
INSERT INTO public.profiles (id, email, nombre, apellido) VALUES
  ('11111111-1111-1111-1111-111111111111', 'admin@ejemplo.com', 'María', 'González'),
  ('22222222-2222-2222-2222-222222222222', 'coordinador@ejemplo.com', 'Juan', 'Pérez'),
  ('33333333-3333-3333-3333-333333333333', 'trabajador@ejemplo.com', 'Ana', 'Rodríguez');

-- Luego asignamos los roles correspondientes
INSERT INTO public.user_roles (user_id, role) VALUES
  ('11111111-1111-1111-1111-111111111111', 'administrador'),
  ('22222222-2222-2222-2222-222222222222', 'coordinador'),
  ('33333333-3333-3333-3333-333333333333', 'trabajador');