-- Crear tabla de etiquetas para gastos
CREATE TABLE public.etiquetas_gastos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#6b7280',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insertar etiquetas por defecto
INSERT INTO public.etiquetas_gastos (nombre) VALUES
  ('Caja Chica'),
  ('Gastos Generales'),
  ('Proyecto Luján'),
  ('Materiales'),
  ('Servicios'),
  ('Eventos');

-- Enable RLS
ALTER TABLE public.etiquetas_gastos ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Usuarios autenticados pueden ver etiquetas" ON public.etiquetas_gastos
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins y coordinadores pueden crear etiquetas" ON public.etiquetas_gastos
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = ANY(ARRAY['administrador'::app_role, 'coordinador'::app_role])
  ));

CREATE POLICY "Admins y coordinadores pueden eliminar etiquetas" ON public.etiquetas_gastos
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = ANY(ARRAY['administrador'::app_role, 'coordinador'::app_role])
  ));

-- Trigger de updated_at
CREATE TRIGGER update_etiquetas_gastos_updated_at
  BEFORE UPDATE ON public.etiquetas_gastos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Actualizar valores existentes de categoria
UPDATE public.gastos SET categoria = 'Gastos Generales' WHERE categoria = 'General';