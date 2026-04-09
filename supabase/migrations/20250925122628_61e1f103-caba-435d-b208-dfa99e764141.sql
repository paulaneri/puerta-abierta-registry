-- Actualizar políticas RLS de gastos para restringir acceso solo a administradores y coordinadores

-- Eliminar políticas existentes de gastos
DROP POLICY IF EXISTS "Authenticated users can view gastos" ON public.gastos;
DROP POLICY IF EXISTS "Authenticated users can create gastos" ON public.gastos;
DROP POLICY IF EXISTS "Authenticated users can update gastos" ON public.gastos;
DROP POLICY IF EXISTS "Authenticated users can delete gastos" ON public.gastos;

-- Crear nuevas políticas más restrictivas para gastos
CREATE POLICY "Solo administradores y coordinadores pueden ver gastos" 
ON public.gastos 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('administrador', 'coordinador')
  )
);

CREATE POLICY "Solo administradores y coordinadores pueden crear gastos" 
ON public.gastos 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('administrador', 'coordinador')
  )
);

CREATE POLICY "Solo administradores y coordinadores pueden actualizar gastos" 
ON public.gastos 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('administrador', 'coordinador')
  )
);

CREATE POLICY "Solo administradores pueden eliminar gastos" 
ON public.gastos 
FOR DELETE 
USING (is_admin(auth.uid()));