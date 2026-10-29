CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, nombre, apellido)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'nombre', NEW.raw_user_meta_data ->> 'apellido');
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'trabajador');
  RETURN NEW;
END;
$function$;

DROP POLICY IF EXISTS "Authenticated users can view eventos" ON public.eventos;
DROP POLICY IF EXISTS "Authenticated users can delete eventos" ON public.eventos;
DROP POLICY IF EXISTS "Authenticated users can update eventos" ON public.eventos;
DROP POLICY IF EXISTS "Authenticated users can insert eventos" ON public.eventos;
CREATE POLICY "Staff can view eventos" ON public.eventos FOR SELECT TO authenticated USING (public.is_authorized_for_mujeres(auth.uid()));
CREATE POLICY "Staff can insert eventos" ON public.eventos FOR INSERT TO authenticated WITH CHECK (public.is_authorized_for_mujeres(auth.uid()));
CREATE POLICY "Staff can update eventos" ON public.eventos FOR UPDATE TO authenticated USING (public.is_authorized_for_mujeres(auth.uid())) WITH CHECK (public.is_authorized_for_mujeres(auth.uid()));
CREATE POLICY "Staff can delete eventos" ON public.eventos FOR DELETE TO authenticated USING (public.is_authorized_for_mujeres(auth.uid()));

DROP POLICY IF EXISTS "Usuarios autenticados pueden ver álbumes" ON public.albumes;
DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar álbumes" ON public.albumes;
DROP POLICY IF EXISTS "Usuarios autenticados pueden eliminar álbumes" ON public.albumes;
DROP POLICY IF EXISTS "Usuarios autenticados pueden crear álbumes" ON public.albumes;
CREATE POLICY "Equipo puede ver álbumes" ON public.albumes FOR SELECT TO authenticated USING (public.is_authorized_for_mujeres(auth.uid()));
CREATE POLICY "Equipo puede crear álbumes" ON public.albumes FOR INSERT TO authenticated WITH CHECK (public.is_authorized_for_mujeres(auth.uid()));
CREATE POLICY "Equipo puede actualizar álbumes" ON public.albumes FOR UPDATE TO authenticated USING (public.is_authorized_for_mujeres(auth.uid())) WITH CHECK (public.is_authorized_for_mujeres(auth.uid()));
CREATE POLICY "Equipo puede eliminar álbumes" ON public.albumes FOR DELETE TO authenticated USING (public.is_authorized_for_mujeres(auth.uid()));

DROP POLICY IF EXISTS "Usuarios autenticados pueden ver fotos" ON public.fotos_album;
DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar fotos" ON public.fotos_album;
DROP POLICY IF EXISTS "Usuarios autenticados pueden eliminar fotos" ON public.fotos_album;
DROP POLICY IF EXISTS "Usuarios autenticados pueden subir fotos" ON public.fotos_album;
CREATE POLICY "Equipo puede ver fotos" ON public.fotos_album FOR SELECT TO authenticated USING (public.is_authorized_for_mujeres(auth.uid()));
CREATE POLICY "Equipo puede subir fotos" ON public.fotos_album FOR INSERT TO authenticated WITH CHECK (public.is_authorized_for_mujeres(auth.uid()));
CREATE POLICY "Equipo puede actualizar fotos" ON public.fotos_album FOR UPDATE TO authenticated USING (public.is_authorized_for_mujeres(auth.uid())) WITH CHECK (public.is_authorized_for_mujeres(auth.uid()));
CREATE POLICY "Equipo puede eliminar fotos" ON public.fotos_album FOR DELETE TO authenticated USING (public.is_authorized_for_mujeres(auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can view disponibilidad" ON public.disponibilidad_reuniones;
CREATE POLICY "Equipo puede ver disponibilidad" ON public.disponibilidad_reuniones FOR SELECT TO authenticated USING (public.is_authorized_for_mujeres(auth.uid()));
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver etiquetas" ON public.etiquetas_gastos;
CREATE POLICY "Equipo puede ver etiquetas" ON public.etiquetas_gastos FOR SELECT TO authenticated USING (public.is_authorized_for_mujeres(auth.uid()));
DROP POLICY IF EXISTS "Authenticated users can view lugares" ON public.lugares;
CREATE POLICY "Equipo puede ver lugares" ON public.lugares FOR SELECT TO authenticated USING (public.is_authorized_for_mujeres(auth.uid()));
DROP POLICY IF EXISTS "Cargos son visibles para usuarios autenticados" ON public.cargos_profesionales;
CREATE POLICY "Equipo puede ver cargos" ON public.cargos_profesionales FOR SELECT TO authenticated USING (public.is_authorized_for_mujeres(auth.uid()));
DROP POLICY IF EXISTS "Nacionalidades son visibles para usuarios autenticados" ON public.nacionalidades;
CREATE POLICY "Equipo puede ver nacionalidades" ON public.nacionalidades FOR SELECT TO authenticated USING (public.is_authorized_for_mujeres(auth.uid()));
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver reuniones" ON public.reuniones_semanales;
CREATE POLICY "Equipo puede ver reuniones" ON public.reuniones_semanales FOR SELECT TO authenticated USING (public.is_authorized_for_mujeres(auth.uid()));
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver asignaciones" ON public.asignaciones_roles;
CREATE POLICY "Equipo puede ver asignaciones" ON public.asignaciones_roles FOR SELECT TO authenticated USING (public.is_authorized_for_mujeres(auth.uid()));

DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar fotos" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios autenticados pueden subir fotos" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios autenticados pueden eliminar fotos" ON storage.objects;
DROP POLICY IF EXISTS "Cualquiera puede ver fotos de álbumes" ON storage.objects;
CREATE POLICY "Fotos: equipo puede ver" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'fotos-albumes' AND public.is_authorized_for_mujeres(auth.uid()));
CREATE POLICY "Fotos: equipo puede subir" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'fotos-albumes' AND public.is_authorized_for_mujeres(auth.uid()));
CREATE POLICY "Fotos: equipo puede actualizar" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'fotos-albumes' AND public.is_authorized_for_mujeres(auth.uid())) WITH CHECK (bucket_id = 'fotos-albumes' AND public.is_authorized_for_mujeres(auth.uid()));
CREATE POLICY "Fotos: equipo puede eliminar" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'fotos-albumes' AND public.is_authorized_for_mujeres(auth.uid()));