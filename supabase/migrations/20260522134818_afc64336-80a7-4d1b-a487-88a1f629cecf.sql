-- Permitir a coordinadores eliminar mujeres
DROP POLICY IF EXISTS "Only administrators can delete mujeres" ON public.mujeres;

CREATE POLICY "Admins y coordinadores pueden eliminar mujeres"
ON public.mujeres
FOR DELETE
USING (
  is_admin(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'coordinador'
  )
);

-- Eliminar los 3 registros de ejemplo
DELETE FROM public.mujeres
WHERE id IN (
  '44fc35a8-9c97-4bf0-b3eb-022254f4116b',
  'fb458a4d-2a6b-4d3d-b5d0-27647d1626a1',
  '6a6c3a4f-1432-4cff-bb3d-a58058ccf0e5'
);