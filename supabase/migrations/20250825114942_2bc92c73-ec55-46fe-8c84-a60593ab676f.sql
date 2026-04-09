-- Fix critical security vulnerability: Replace permissive RLS policies on gastos table
-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Gastos son visibles para todos" ON public.gastos;
DROP POLICY IF EXISTS "Cualquiera puede crear gastos" ON public.gastos;
DROP POLICY IF EXISTS "Cualquiera puede actualizar gastos" ON public.gastos;
DROP POLICY IF EXISTS "Cualquiera puede eliminar gastos" ON public.gastos;

-- Create secure policies that require authentication
CREATE POLICY "Authenticated users can view gastos" 
ON public.gastos 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can create gastos" 
ON public.gastos 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update gastos" 
ON public.gastos 
FOR UPDATE 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can delete gastos" 
ON public.gastos 
FOR DELETE 
TO authenticated 
USING (true);