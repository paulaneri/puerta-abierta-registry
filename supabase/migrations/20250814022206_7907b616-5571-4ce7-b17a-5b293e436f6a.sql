-- Crear tabla de mujeres/participantes
CREATE TABLE public.mujeres (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT,
  apellido TEXT,
  apodo TEXT,
  edad INTEGER,
  fecha_nacimiento DATE,
  nacionalidad TEXT,
  telefono TEXT,
  email TEXT,
  direccion TEXT,
  situacion_laboral TEXT,
  hijos BOOLEAN DEFAULT false,
  numero_hijos INTEGER,
  observaciones TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla de equipo/profesionales
CREATE TABLE public.equipo (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  profesion TEXT,
  telefono TEXT,
  email TEXT,
  fecha_nacimiento DATE,
  especialidad TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla de gastos
CREATE TABLE public.gastos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  concepto TEXT NOT NULL,
  monto DECIMAL(10,2) NOT NULL,
  fecha DATE NOT NULL,
  categoria TEXT NOT NULL,
  descripcion TEXT,
  metodo_pago TEXT,
  comprobante_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla de contactos
CREATE TABLE public.contactos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  apellido TEXT,
  telefono TEXT,
  email TEXT,
  organizacion TEXT,
  cargo TEXT,
  notas TEXT,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla de trabajo de campo
CREATE TABLE public.trabajo_campo (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fecha DATE NOT NULL,
  lugar TEXT NOT NULL,
  actividad TEXT NOT NULL,
  participantes TEXT[],
  profesional_responsable TEXT,
  observaciones TEXT,
  resultados TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla de centro de día
CREATE TABLE public.centro_dia (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fecha DATE NOT NULL,
  mujer_id UUID,
  tipo_actividad TEXT NOT NULL CHECK (tipo_actividad IN ('entrevista', 'llamada_telefonica', 'seguimiento', 'actividad_grupal', 'taller', 'otro')),
  descripcion TEXT,
  profesional TEXT,
  observaciones TEXT,
  proxima_cita DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS en todas las tablas
ALTER TABLE public.mujeres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gastos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contactos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trabajo_campo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.centro_dia ENABLE ROW LEVEL SECURITY;

-- Crear políticas para acceso público (ajustar según necesites autenticación)
-- Políticas para mujeres
CREATE POLICY "Mujeres son visibles para todos" ON public.mujeres FOR SELECT USING (true);
CREATE POLICY "Cualquiera puede crear mujeres" ON public.mujeres FOR INSERT WITH CHECK (true);
CREATE POLICY "Cualquiera puede actualizar mujeres" ON public.mujeres FOR UPDATE USING (true);
CREATE POLICY "Cualquiera puede eliminar mujeres" ON public.mujeres FOR DELETE USING (true);

-- Políticas para equipo
CREATE POLICY "Equipo es visible para todos" ON public.equipo FOR SELECT USING (true);
CREATE POLICY "Cualquiera puede crear equipo" ON public.equipo FOR INSERT WITH CHECK (true);
CREATE POLICY "Cualquiera puede actualizar equipo" ON public.equipo FOR UPDATE USING (true);
CREATE POLICY "Cualquiera puede eliminar equipo" ON public.equipo FOR DELETE USING (true);

-- Políticas para gastos
CREATE POLICY "Gastos son visibles para todos" ON public.gastos FOR SELECT USING (true);
CREATE POLICY "Cualquiera puede crear gastos" ON public.gastos FOR INSERT WITH CHECK (true);
CREATE POLICY "Cualquiera puede actualizar gastos" ON public.gastos FOR UPDATE USING (true);
CREATE POLICY "Cualquiera puede eliminar gastos" ON public.gastos FOR DELETE USING (true);

-- Políticas para contactos
CREATE POLICY "Contactos son visibles para todos" ON public.contactos FOR SELECT USING (true);
CREATE POLICY "Cualquiera puede crear contactos" ON public.contactos FOR INSERT WITH CHECK (true);
CREATE POLICY "Cualquiera puede actualizar contactos" ON public.contactos FOR UPDATE USING (true);
CREATE POLICY "Cualquiera puede eliminar contactos" ON public.contactos FOR DELETE USING (true);

-- Políticas para trabajo de campo
CREATE POLICY "Trabajo campo es visible para todos" ON public.trabajo_campo FOR SELECT USING (true);
CREATE POLICY "Cualquiera puede crear trabajo campo" ON public.trabajo_campo FOR INSERT WITH CHECK (true);
CREATE POLICY "Cualquiera puede actualizar trabajo campo" ON public.trabajo_campo FOR UPDATE USING (true);
CREATE POLICY "Cualquiera puede eliminar trabajo campo" ON public.trabajo_campo FOR DELETE USING (true);

-- Políticas para centro de día
CREATE POLICY "Centro dia es visible para todos" ON public.centro_dia FOR SELECT USING (true);
CREATE POLICY "Cualquiera puede crear centro dia" ON public.centro_dia FOR INSERT WITH CHECK (true);
CREATE POLICY "Cualquiera puede actualizar centro dia" ON public.centro_dia FOR UPDATE USING (true);
CREATE POLICY "Cualquiera puede eliminar centro dia" ON public.centro_dia FOR DELETE USING (true);

-- Triggers para actualizar updated_at
CREATE TRIGGER update_mujeres_updated_at BEFORE UPDATE ON public.mujeres FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_equipo_updated_at BEFORE UPDATE ON public.equipo FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_gastos_updated_at BEFORE UPDATE ON public.gastos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_contactos_updated_at BEFORE UPDATE ON public.contactos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_trabajo_campo_updated_at BEFORE UPDATE ON public.trabajo_campo FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_centro_dia_updated_at BEFORE UPDATE ON public.centro_dia FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();