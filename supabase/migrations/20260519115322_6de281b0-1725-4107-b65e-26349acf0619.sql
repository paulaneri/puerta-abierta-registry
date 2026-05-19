INSERT INTO public.reuniones_semanales (fecha, semana_numero, ano, estado) VALUES
  ('2026-03-23', 11, 2026, 'planificada'),
  ('2026-12-28', 53, 2026, 'planificada')
ON CONFLICT DO NOTHING;