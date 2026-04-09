-- Crear tabla de álbumes de fotos
CREATE TABLE public.albumes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  fecha DATE NOT NULL,
  evento TEXT,
  descripcion TEXT,
  foto_portada_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla de fotos
CREATE TABLE public.fotos_album (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  album_id UUID NOT NULL REFERENCES public.albumes(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  nombre_archivo TEXT,
  descripcion TEXT,
  orden INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.albumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fotos_album ENABLE ROW LEVEL SECURITY;

-- Políticas para álbumes (cualquier usuario autenticado puede ver y gestionar)
CREATE POLICY "Usuarios autenticados pueden ver álbumes" 
ON public.albumes FOR SELECT 
USING (true);

CREATE POLICY "Usuarios autenticados pueden crear álbumes" 
ON public.albumes FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Usuarios autenticados pueden actualizar álbumes" 
ON public.albumes FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuarios autenticados pueden eliminar álbumes" 
ON public.albumes FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Políticas para fotos
CREATE POLICY "Usuarios autenticados pueden ver fotos" 
ON public.fotos_album FOR SELECT 
USING (true);

CREATE POLICY "Usuarios autenticados pueden subir fotos" 
ON public.fotos_album FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Usuarios autenticados pueden actualizar fotos" 
ON public.fotos_album FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuarios autenticados pueden eliminar fotos" 
ON public.fotos_album FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Trigger para updated_at
CREATE TRIGGER update_albumes_updated_at
BEFORE UPDATE ON public.albumes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Crear bucket para fotos de álbumes
INSERT INTO storage.buckets (id, name, public) 
VALUES ('fotos-albumes', 'fotos-albumes', true);

-- Políticas de storage para fotos
CREATE POLICY "Cualquiera puede ver fotos de álbumes"
ON storage.objects FOR SELECT
USING (bucket_id = 'fotos-albumes');

CREATE POLICY "Usuarios autenticados pueden subir fotos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'fotos-albumes' AND auth.uid() IS NOT NULL);

CREATE POLICY "Usuarios autenticados pueden actualizar fotos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'fotos-albumes' AND auth.uid() IS NOT NULL);

CREATE POLICY "Usuarios autenticados pueden eliminar fotos"
ON storage.objects FOR DELETE
USING (bucket_id = 'fotos-albumes' AND auth.uid() IS NOT NULL);