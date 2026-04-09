-- Crear tabla de eventos
CREATE TABLE public.eventos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  descripcion TEXT,
  fecha DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  lugar TEXT,
  tipo TEXT NOT NULL CHECK (tipo IN ('reunion', 'taller', 'actividad', 'seguimiento', 'celebracion', 'otro')),
  participantes TEXT[] DEFAULT '{}',
  recordatorio BOOLEAN DEFAULT false,
  repeticion TEXT CHECK (repeticion IN ('ninguna', 'semanal', 'mensual', 'anualmente')),
  fecha_fin_repeticion DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.eventos ENABLE ROW LEVEL SECURITY;

-- Crear políticas para acceso público (puedes ajustar esto según necesites autenticación)
CREATE POLICY "Eventos son visibles para todos" 
ON public.eventos 
FOR SELECT 
USING (true);

CREATE POLICY "Cualquiera puede crear eventos" 
ON public.eventos 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Cualquiera puede actualizar eventos" 
ON public.eventos 
FOR UPDATE 
USING (true);

CREATE POLICY "Cualquiera puede eliminar eventos" 
ON public.eventos 
FOR DELETE 
USING (true);

-- Función para actualizar timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar automáticamente updated_at
CREATE TRIGGER update_eventos_updated_at
  BEFORE UPDATE ON public.eventos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();