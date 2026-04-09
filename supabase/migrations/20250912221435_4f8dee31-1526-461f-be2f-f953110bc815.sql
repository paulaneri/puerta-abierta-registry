-- Fix critical security vulnerability in centro_dia table
-- Ensure all existing policies are dropped and recreate secure ones

-- Drop ALL existing policies (both old vulnerable and new secure ones)
DROP POLICY IF EXISTS "Centro dia es visible para todos" ON public.centro_dia;
DROP POLICY IF EXISTS "Cualquiera puede actualizar centro dia" ON public.centro_dia;
DROP POLICY IF EXISTS "Cualquiera puede crear centro dia" ON public.centro_dia;
DROP POLICY IF EXISTS "Cualquiera puede eliminar centro dia" ON public.centro_dia;
DROP POLICY IF EXISTS "Only authorized roles can view centro dia" ON public.centro_dia;
DROP POLICY IF EXISTS "Only authorized roles can create centro dia" ON public.centro_dia;
DROP POLICY IF EXISTS "Only authorized roles can update centro dia" ON public.centro_dia;
DROP POLICY IF EXISTS "Only administrators can delete centro dia" ON public.centro_dia;

-- Create secure role-based policies for day center data containing sensitive information

-- SELECT: Only authorized personnel (administrators and workers) can view sensitive day center data
CREATE POLICY "Only authorized roles can view centro dia" 
ON public.centro_dia 
FOR SELECT 
USING (public.is_authorized_for_mujeres(auth.uid()));

-- INSERT: Only authorized personnel can create day center records
CREATE POLICY "Only authorized roles can create centro dia" 
ON public.centro_dia 
FOR INSERT 
WITH CHECK (public.is_authorized_for_mujeres(auth.uid()));

-- UPDATE: Only authorized personnel can update day center records
CREATE POLICY "Only authorized roles can update centro dia" 
ON public.centro_dia 
FOR UPDATE 
USING (public.is_authorized_for_mujeres(auth.uid()));

-- DELETE: Only administrators can delete day center records (most restrictive)
CREATE POLICY "Only administrators can delete centro dia" 
ON public.centro_dia 
FOR DELETE 
USING (is_admin(auth.uid()));

-- Update table comment for documentation
COMMENT ON TABLE public.centro_dia IS 'Contains highly sensitive day center data including women attendees, interview records, calls, and support activities. Access restricted to authorized roles only (administrador, trabajador). Unauthorized access could endanger vulnerable individuals.';