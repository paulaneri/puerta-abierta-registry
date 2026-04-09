-- Clean up all existing policies on equipo table and create secure ones
DO $$
BEGIN
  -- Drop all possible existing policies on equipo table
  DROP POLICY IF EXISTS "Only administrators can view staff data" ON public.equipo;
  DROP POLICY IF EXISTS "Only administrators can create staff records" ON public.equipo;
  DROP POLICY IF EXISTS "Only administrators can update staff records" ON public.equipo;
  DROP POLICY IF EXISTS "Only administrators can delete staff records" ON public.equipo;
  DROP POLICY IF EXISTS "Authenticated users can view equipo" ON public.equipo;
  DROP POLICY IF EXISTS "Authenticated users can create equipo" ON public.equipo;
  DROP POLICY IF EXISTS "Authenticated users can update equipo" ON public.equipo;
  DROP POLICY IF EXISTS "Authenticated users can delete equipo" ON public.equipo;
END $$;

-- Create secure administrator-only policies for staff personal information

CREATE POLICY "Only administrators can view staff data" 
ON public.equipo 
FOR SELECT 
USING (is_admin(auth.uid()));

CREATE POLICY "Only administrators can create staff records" 
ON public.equipo 
FOR INSERT 
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Only administrators can update staff records" 
ON public.equipo 
FOR UPDATE 
USING (is_admin(auth.uid()));

CREATE POLICY "Only administrators can delete staff records" 
ON public.equipo 
FOR DELETE 
USING (is_admin(auth.uid()));

-- Update table comment for documentation
COMMENT ON TABLE public.equipo IS 'Contains sensitive staff personal information including names, phone numbers, and email addresses. Access strictly restricted to administrators only to prevent unauthorized access to employee personal data.';