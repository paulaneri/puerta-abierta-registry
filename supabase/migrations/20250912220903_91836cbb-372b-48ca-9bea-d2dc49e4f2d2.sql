-- Implement stricter role-based access control for mujeres table
-- Only allow specific authorized roles to access vulnerable women's data

-- Drop current policies that allow any authenticated user
DROP POLICY IF EXISTS "Authenticated users can view mujeres" ON public.mujeres;
DROP POLICY IF EXISTS "Authenticated users can create mujeres" ON public.mujeres;
DROP POLICY IF EXISTS "Authenticated users can update mujeres" ON public.mujeres;

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

-- SELECT: Only administrators and workers (trabajador) can view mujeres data
CREATE POLICY "Only authorized roles can view mujeres" 
ON public.mujeres 
FOR SELECT 
USING (public.is_authorized_for_mujeres(auth.uid()));

-- INSERT: Only administrators and workers can create mujeres records
CREATE POLICY "Only authorized roles can create mujeres" 
ON public.mujeres 
FOR INSERT 
WITH CHECK (public.is_authorized_for_mujeres(auth.uid()));

-- UPDATE: Only administrators and workers can update mujeres records  
CREATE POLICY "Only authorized roles can update mujeres" 
ON public.mujeres 
FOR UPDATE 
USING (public.is_authorized_for_mujeres(auth.uid()));

-- DELETE: Only administrators can delete mujeres records (most restrictive)
-- (This policy already exists and is correct)

-- Update table comment for documentation
COMMENT ON TABLE public.mujeres IS 'Contains highly sensitive personal data of vulnerable women. Access restricted to authorized roles only (administrador, trabajador). Unauthorized access could endanger vulnerable individuals.';