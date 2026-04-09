-- Actualizar la función is_authorized_for_mujeres para incluir coordinador
CREATE OR REPLACE FUNCTION public.is_authorized_for_mujeres(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_roles.user_id = is_authorized_for_mujeres.user_id
      AND role IN ('administrador', 'coordinador', 'trabajador')
  )
$function$;

-- Actualizar políticas para la tabla equipo para permitir coordinadores
DROP POLICY IF EXISTS "Only administrators can view staff data" ON public.equipo;
CREATE POLICY "Administrators and coordinators can view staff data"
ON public.equipo
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
      AND role IN ('administrador', 'coordinador')
  )
);

DROP POLICY IF EXISTS "Only administrators can create staff records" ON public.equipo;
CREATE POLICY "Administrators and coordinators can create staff records"
ON public.equipo
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
      AND role IN ('administrador', 'coordinador')
  )
);

DROP POLICY IF EXISTS "Only administrators can update staff records" ON public.equipo;
CREATE POLICY "Administrators and coordinators can update staff records"
ON public.equipo
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
      AND role IN ('administrador', 'coordinador')
  )
);

DROP POLICY IF EXISTS "Only administrators can delete staff records" ON public.equipo;
CREATE POLICY "Only administrators can delete staff records"
ON public.equipo
FOR DELETE
TO authenticated
USING (is_admin(auth.uid()));