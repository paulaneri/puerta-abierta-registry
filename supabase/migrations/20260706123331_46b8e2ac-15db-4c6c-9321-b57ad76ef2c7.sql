
-- Revoke EXECUTE from authenticated (and PUBLIC) on trigger-only SECURITY DEFINER functions.
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
