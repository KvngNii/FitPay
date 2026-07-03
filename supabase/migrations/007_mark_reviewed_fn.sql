-- Direct UPDATE function for marking medical history as trainer-reviewed.
-- Bypasses PostgREST's PATCH path, which can have edge-case issues with
-- GENERATED ALWAYS AS STORED columns on the same table.
CREATE OR REPLACE FUNCTION public.mark_medical_history_reviewed(p_client_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_trainer_reviewed boolean;
BEGIN
  UPDATE public.medical_history
  SET
    trainer_reviewed    = true,
    trainer_reviewed_at = now()
  WHERE client_id = p_client_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Record not found for client_id ' || p_client_id);
  END IF;

  SELECT trainer_reviewed INTO v_trainer_reviewed
  FROM public.medical_history
  WHERE client_id = p_client_id;

  RETURN jsonb_build_object(
    'success',           true,
    'trainer_reviewed',  v_trainer_reviewed
  );
END;
$$;

-- Only service_role (used by the API) can call this
GRANT EXECUTE ON FUNCTION public.mark_medical_history_reviewed(uuid) TO service_role;
REVOKE EXECUTE ON FUNCTION public.mark_medical_history_reviewed(uuid) FROM anon, authenticated;
