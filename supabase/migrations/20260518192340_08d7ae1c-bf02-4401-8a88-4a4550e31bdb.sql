DELETE FROM public.asignaciones_roles WHERE reunion_id IN (SELECT id FROM public.reuniones_semanales WHERE ano=2026 AND fecha < '2026-02-01');
DELETE FROM public.disponibilidad_reuniones WHERE reunion_id IN (SELECT id FROM public.reuniones_semanales WHERE ano=2026 AND fecha < '2026-02-01');
DELETE FROM public.reuniones_semanales WHERE ano=2026 AND fecha < '2026-02-01';
UPDATE public.reuniones_semanales SET numero_acta = NULL WHERE ano=2026;