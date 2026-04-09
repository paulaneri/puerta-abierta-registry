-- Fix critical security vulnerability: Replace permissive RLS policies on equipo table
-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Equipo es visible para todos" ON public.equipo;
DROP POLICY IF EXISTS "Cualquiera puede crear equipo" ON public.equipo;
DROP POLICY IF EXISTS "Cualquiera puede actualizar equipo" ON public.equipo;
DROP POLICY IF EXISTS "Cualquiera puede eliminar equipo" ON public.equipo;

-- Create secure policies that require authentication
CREATE POLICY "Authenticated users can view equipo" 
ON public.equipo 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can create equipo" 
ON public.equipo 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update equipo" 
ON public.equipo 
FOR UPDATE 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can delete equipo" 
ON public.equipo 
FOR DELETE 
TO authenticated 
USING (true);