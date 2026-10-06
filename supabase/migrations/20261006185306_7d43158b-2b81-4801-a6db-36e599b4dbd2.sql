DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['actividades','albumes','asignaciones_roles','cargos_profesionales','centro_dia','contactos','disponibilidad_reuniones','duplas_acompanamiento','equipo','etiquetas_gastos','eventos','fotos_album','gastos','lugares','mujeres','nacionalidades','reuniones_semanales','trabajo_campo']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Coordinador puede actualizar todo" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "Coordinador puede eliminar todo" ON public.%I', t);
    EXECUTE format('CREATE POLICY "Coordinador puede actualizar todo" ON public.%I FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), ''coordinador''::app_role)) WITH CHECK (public.has_role(auth.uid(), ''coordinador''::app_role))', t);
    EXECUTE format('CREATE POLICY "Coordinador puede eliminar todo" ON public.%I FOR DELETE TO authenticated USING (public.has_role(auth.uid(), ''coordinador''::app_role))', t);
    EXECUTE format('GRANT UPDATE, DELETE ON public.%I TO authenticated', t);
  END LOOP;
END $$;