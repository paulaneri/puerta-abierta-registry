-- Create lugares table for managing location options in trabajo de campo
CREATE TABLE public.lugares (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre TEXT NOT NULL UNIQUE,
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lugares ENABLE ROW LEVEL SECURITY;

-- Create RLS policies - only authenticated users can access
CREATE POLICY "Authenticated users can view lugares" 
ON public.lugares 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create lugares" 
ON public.lugares 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update lugares" 
ON public.lugares 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Only administrators can delete lugares" 
ON public.lugares 
FOR DELETE 
USING (is_admin(auth.uid()));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_lugares_updated_at
BEFORE UPDATE ON public.lugares
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some default locations
INSERT INTO public.lugares (nombre) VALUES 
('Plaza del Barrio'),
('Centro Comunitario'),
('Escuela Primaria'),
('Centro de Salud'),
('Parque Municipal'),
('Iglesia San José'),
('Mercado Central'),
('Terminal de Ómnibus'),
('Biblioteca Popular'),
('Club Deportivo');