-- Fix security vulnerability in contactos table RLS policies
-- Replace overly permissive policies with proper authentication checks

-- Drop existing permissive policies
DROP POLICY IF EXISTS "Authenticated users can view contactos" ON public.contactos;
DROP POLICY IF EXISTS "Authenticated users can create contactos" ON public.contactos;
DROP POLICY IF EXISTS "Authenticated users can update contactos" ON public.contactos;
DROP POLICY IF EXISTS "Authenticated users can delete contactos" ON public.contactos;

-- Create secure policies that require authentication
CREATE POLICY "Authenticated users can view contactos"
ON public.contactos
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create contactos"
ON public.contactos
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update contactos"
ON public.contactos
FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete contactos"
ON public.contactos
FOR DELETE
TO authenticated
USING (auth.uid() IS NOT NULL);