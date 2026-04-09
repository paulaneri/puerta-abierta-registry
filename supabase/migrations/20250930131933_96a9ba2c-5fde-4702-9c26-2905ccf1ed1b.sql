-- Agregar política para permitir que administradores eliminen perfiles
CREATE POLICY "Los administradores pueden eliminar perfiles"
ON public.profiles
FOR DELETE
TO authenticated
USING (is_admin(auth.uid()));