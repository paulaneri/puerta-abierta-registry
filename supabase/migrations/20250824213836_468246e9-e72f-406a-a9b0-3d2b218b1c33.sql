-- Fix critical security vulnerability: Replace permissive RLS policies on mujeres table
-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Mujeres son visibles para todos" ON public.mujeres;
DROP POLICY IF EXISTS "Cualquiera puede crear mujeres" ON public.mujeres;
DROP POLICY IF EXISTS "Cualquiera puede actualizar mujeres" ON public.mujeres;
DROP POLICY IF EXISTS "Cualquiera puede eliminar mujeres" ON public.mujeres;

-- Create secure policies that require authentication
CREATE POLICY "Authenticated users can view mujeres" 
ON public.mujeres 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can create mujeres" 
ON public.mujeres 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update mujeres" 
ON public.mujeres 
FOR UPDATE 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can delete mujeres" 
ON public.mujeres 
FOR DELETE 
TO authenticated 
USING (true);

-- Also fix the database function security issue identified in linter
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;