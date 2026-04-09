-- Crear enum para los roles de usuario
CREATE TYPE public.app_role AS ENUM ('administrador', 'coordinador', 'trabajador');

-- Crear tabla de perfiles de usuario
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  nombre TEXT,
  apellido TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Crear tabla de roles de usuario
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Habilitar RLS en las tablas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Función para verificar roles (security definer para evitar recursión en RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Función para verificar si es administrador
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT public.has_role(_user_id, 'administrador')
$$;

-- Políticas RLS para profiles
CREATE POLICY "Los usuarios pueden ver todos los perfiles" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Los usuarios pueden actualizar su propio perfil" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Los administradores pueden actualizar cualquier perfil" 
ON public.profiles 
FOR UPDATE 
USING (public.is_admin(auth.uid()));

CREATE POLICY "Los perfiles se crean automáticamente" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Políticas RLS para user_roles
CREATE POLICY "Solo administradores pueden ver roles" 
ON public.user_roles 
FOR SELECT 
USING (public.is_admin(auth.uid()));

CREATE POLICY "Solo administradores pueden gestionar roles" 
ON public.user_roles 
FOR ALL 
USING (public.is_admin(auth.uid()));

-- Función para crear perfil automáticamente al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nombre, apellido)
  VALUES (
    NEW.id, 
    NEW.email,
    NEW.raw_user_meta_data ->> 'nombre',
    NEW.raw_user_meta_data ->> 'apellido'
  );
  
  -- Asignar rol de administrador a paulaneri@gmail.com
  IF NEW.email = 'paulaneri@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'administrador');
  ELSE
    -- Por defecto, asignar rol de trabajador
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'trabajador');
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para crear perfil automáticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger para actualizar updated_at en profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insertar perfil y rol para el administrador principal si ya existe
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Buscar el usuario administrador
  SELECT id INTO admin_user_id 
  FROM auth.users 
  WHERE email = 'paulaneri@gmail.com' 
  LIMIT 1;
  
  -- Si existe, crear su perfil y rol
  IF admin_user_id IS NOT NULL THEN
    INSERT INTO public.profiles (id, email, nombre, apellido)
    VALUES (admin_user_id, 'paulaneri@gmail.com', 'Paula', 'Neri')
    ON CONFLICT (id) DO NOTHING;
    
    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_user_id, 'administrador')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END $$;