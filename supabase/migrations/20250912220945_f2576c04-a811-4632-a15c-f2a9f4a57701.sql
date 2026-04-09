-- First, let's check what policies currently exist and drop them properly
DO $$
BEGIN
  -- Drop all existing policies on mujeres table
  DROP POLICY IF EXISTS "Only authorized roles can view mujeres" ON public.mujeres;
  DROP POLICY IF EXISTS "Only authorized roles can create mujeres" ON public.mujeres;
  DROP POLICY IF EXISTS "Only authorized roles can update mujeres" ON public.mujeres;
  DROP POLICY IF EXISTS "Authenticated users can view mujeres" ON public.mujeres;
  DROP POLICY IF EXISTS "Authenticated users can create mujeres" ON public.mujeres;
  DROP POLICY IF EXISTS "Authenticated users can update mujeres" ON public.mujeres;
  DROP POLICY IF EXISTS "Authenticated users can delete mujeres" ON public.mujeres;
  DROP POLICY IF EXISTS "Only administrators can delete mujeres" ON public.mujeres;
END $$;

-- Create function to check if user has authorized roles for accessing sensitive data
CREATE OR REPLACE FUNCTION public.is_authorized_for_mujeres(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_roles.user_id = is_authorized_for_mujeres.user_id
      AND role IN ('administrador', 'trabajador')
  )
$$;

-- Now create the strict role-based policies
CREATE POLICY "Only authorized roles can view mujeres" 
ON public.mujeres 
FOR SELECT 
USING (public.is_authorized_for_mujeres(auth.uid()));

CREATE POLICY "Only authorized roles can create mujeres" 
ON public.mujeres 
FOR INSERT 
WITH CHECK (public.is_authorized_for_mujeres(auth.uid()));

CREATE POLICY "Only authorized roles can update mujeres" 
ON public.mujeres 
FOR UPDATE 
USING (public.is_authorized_for_mujeres(auth.uid()));

CREATE POLICY "Only administrators can delete mujeres" 
ON public.mujeres 
FOR DELETE 
USING (is_admin(auth.uid()));

-- Update table comment for documentation
COMMENT ON TABLE public.mujeres IS 'Contains highly sensitive personal data of vulnerable women. Access restricted to authorized roles only (administrador, trabajador). Unauthorized access could endanger vulnerable individuals.';