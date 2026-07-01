DROP POLICY IF EXISTS "Only administrators can delete trabajo campo" ON public.trabajo_campo;
CREATE POLICY "Admins or creators can delete trabajo campo"
ON public.trabajo_campo
FOR DELETE
USING (is_admin(auth.uid()) OR creado_por = auth.uid());