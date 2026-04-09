-- Fix critical security vulnerability: Replace permissive RLS policies on contactos table
-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Contactos son visibles para todos" ON public.contactos;
DROP POLICY IF EXISTS "Cualquiera puede crear contactos" ON public.contactos;
DROP POLICY IF EXISTS "Cualquiera puede actualizar contactos" ON public.contactos;
DROP POLICY IF EXISTS "Cualquiera puede eliminar contactos" ON public.contactos;

-- Create secure policies that require authentication
CREATE POLICY "Authenticated users can view contactos" 
ON public.contactos 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can create contactos" 
ON public.contactos 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update contactos" 
ON public.contactos 
FOR UPDATE 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can delete contactos" 
ON public.contactos 
FOR DELETE 
TO authenticated 
USING (true);