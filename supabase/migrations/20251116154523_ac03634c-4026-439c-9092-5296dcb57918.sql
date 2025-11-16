-- Drop and recreate the trigger function to handle null auth.uid()
DROP FUNCTION IF EXISTS public.log_batch_status_change() CASCADE;

CREATE OR REPLACE FUNCTION public.log_batch_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) OR TG_OP = 'INSERT' THEN
    -- Use auth.uid() if available, otherwise use manufacturer_id as fallback
    INSERT INTO public.batch_status_history (batch_id, status, location, changed_by, notes)
    VALUES (
      NEW.id, 
      NEW.status, 
      NEW.current_location, 
      COALESCE(auth.uid(), NEW.manufacturer_id), 
      NEW.notes
    );
  END IF;
  RETURN NEW;
END;
$function$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS log_batch_status_change ON batches;
CREATE TRIGGER log_batch_status_change
  AFTER INSERT OR UPDATE ON batches
  FOR EACH ROW
  EXECUTE FUNCTION log_batch_status_change();