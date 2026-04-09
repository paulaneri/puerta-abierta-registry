-- Fix critical security vulnerability in equipo (staff) table
-- Restrict access to staff personal information to administrators only

-- Drop existing vulnerable policies that allow any authenticated user access
DROP POLICY IF EXISTS "Authenticated users can view equipo" ON public.equipo;
DROP POLICY IF EXISTS "Authenticated users can create equipo" ON public.equipo;
DROP POLICY IF EXISTS "Authenticated users can update equipo" ON public.equipo;
DROP POLICY IF EXISTS "Authenticated users can delete equipo" ON public.equipo;

-- Create strict administrator-only policies for staff data

-- SELECT: Only administrators can view staff personal information
CREATE POLICY "Only administrators can view staff data" 
ON public.equipo 
FOR SELECT 
USING (is_admin(auth.uid()));

-- INSERT: Only administrators can create staff records
CREATE POLICY "Only administrators can create staff records" 
ON public.equipo 
FOR INSERT 
WITH CHECK (is_admin(auth.uid()));

-- UPDATE: Only administrators can update staff information
CREATE POLICY "Only administrators can update staff records" 
ON public.equipo 
FOR UPDATE 
USING (is_admin(auth.uid()));

-- DELETE: Only administrators can delete staff records
CREATE POLICY "Only administrators can delete staff records" 
ON public.equipo 
FOR DELETE 
USING (is_admin(auth.uid()));

-- Update table comment for documentation
COMMENT ON TABLE public.equipo IS 'Contains sensitive staff personal information including contact details. Access restricted to administrators only to prevent unauthorized access to employee data.';