INSERT INTO public.reuniones_semanales (fecha, semana_numero, ano, estado)
VALUES ('2026-02-02', 5, 2026, 'planificada')
ON CONFLICT DO NOTHING;