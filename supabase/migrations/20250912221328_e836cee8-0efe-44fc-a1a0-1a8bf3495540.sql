-- Fix critical security vulnerability in trabajo_campo table
-- Restrict access to sensitive field work data containing vulnerable women's information

-- Drop existing vulnerable policies that allow public access
DROP POLICY IF EXISTS "Trabajo campo es visible para todos" ON public.trabajo_campo;
DROP POLICY IF EXISTS "Cualquiera puede crear trabajo campo" ON public.trabajo_campo;
DROP POLICY IF EXISTS "Cualquiera puede actualizar trabajo campo" ON public.trabajo_campo;
DROP POLICY IF EXISTS "Cualquiera puede eliminar trabajo campo" ON public.trabajo_campo;

-- Create secure role-based policies for field work data containing sensitive information

-- SELECT: Only authorized personnel (administrators and workers) can view sensitive field work data
CREATE POLICY "Only authorized roles can view trabajo campo" 
ON public.trabajo_campo 
FOR SELECT 
USING (public.is_authorized_for_mujeres(auth.uid()));

-- INSERT: Only authorized personnel can create field work records
CREATE POLICY "Only authorized roles can create trabajo campo" 
ON public.trabajo_campo 
FOR INSERT 
WITH CHECK (public.is_authorized_for_mujeres(auth.uid()));

-- UPDATE: Only authorized personnel can update field work records
CREATE POLICY "Only authorized roles can update trabajo campo" 
ON public.trabajo_campo 
FOR UPDATE 
USING (public.is_authorized_for_mujeres(auth.uid()));

-- DELETE: Only administrators can delete field work records (most restrictive)
CREATE POLICY "Only administrators can delete trabajo campo" 
ON public.trabajo_campo 
FOR DELETE 
USING (is_admin(auth.uid()));

-- Update table comment for documentation
COMMENT ON TABLE public.trabajo_campo IS 'Contains highly sensitive field work data including names, personal conversations, and encounter details of vulnerable women. Access restricted to authorized roles only (administrador, trabajador). Unauthorized access could endanger vulnerable individuals.';