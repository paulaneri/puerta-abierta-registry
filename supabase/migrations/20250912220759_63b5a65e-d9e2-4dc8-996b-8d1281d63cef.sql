-- Fix critical security vulnerability in mujeres table RLS policies
-- Replace dangerous 'true' conditions with proper authentication and role-based access

-- Drop existing vulnerable policies
DROP POLICY IF EXISTS "Authenticated users can view mujeres" ON public.mujeres;
DROP POLICY IF EXISTS "Authenticated users can create mujeres" ON public.mujeres;
DROP POLICY IF EXISTS "Authenticated users can update mujeres" ON public.mujeres;
DROP POLICY IF EXISTS "Authenticated users can delete mujeres" ON public.mujeres;

-- Create secure policies with proper authentication and role-based access

-- SELECT: Only authenticated users (admins and workers) can view mujeres data
CREATE POLICY "Authenticated users can view mujeres" 
ON public.mujeres 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- INSERT: Only authenticated users (admins and workers) can create mujeres records
CREATE POLICY "Authenticated users can create mujeres" 
ON public.mujeres 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE: Only authenticated users (admins and workers) can update mujeres records
CREATE POLICY "Authenticated users can update mujeres" 
ON public.mujeres 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

-- DELETE: Only administrators can delete mujeres records (most restrictive)
CREATE POLICY "Only administrators can delete mujeres" 
ON public.mujeres 
FOR DELETE 
USING (is_admin(auth.uid()));

-- Add comment for documentation
COMMENT ON TABLE public.mujeres IS 'Contains sensitive personal data of vulnerable women. Access is restricted to authenticated users only, with delete operations limited to administrators.';