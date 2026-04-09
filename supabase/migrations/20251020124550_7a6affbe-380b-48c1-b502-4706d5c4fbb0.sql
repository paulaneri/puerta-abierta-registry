-- Agregar columna archivado a centro_dia
ALTER TABLE public.centro_dia 
ADD COLUMN archivado boolean NOT NULL DEFAULT false;

-- Agregar columna archivado a trabajo_campo
ALTER TABLE public.trabajo_campo 
ADD COLUMN archivado boolean NOT NULL DEFAULT false;

-- Agregar columna archivado a gastos
ALTER TABLE public.gastos 
ADD COLUMN archivado boolean NOT NULL DEFAULT false;

-- Agregar columna archivado a duplas_acompanamiento
ALTER TABLE public.duplas_acompanamiento 
ADD COLUMN archivado boolean NOT NULL DEFAULT false;

-- Agregar índices para mejorar el rendimiento de las consultas por año
CREATE INDEX idx_centro_dia_fecha ON public.centro_dia(fecha);
CREATE INDEX idx_trabajo_campo_fecha ON public.trabajo_campo(fecha);
CREATE INDEX idx_gastos_fecha ON public.gastos(fecha);
CREATE INDEX idx_duplas_fecha_formacion ON public.duplas_acompanamiento(fecha_formacion);