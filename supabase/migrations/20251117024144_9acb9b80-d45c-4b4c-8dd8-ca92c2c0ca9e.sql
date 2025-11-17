-- Add RLS policy to allow pharmacists to view batches that are in transit or delivered
-- so they can scan and confirm delivery
CREATE POLICY "Pharmacists can view in-transit and delivered batches"
ON batches
FOR SELECT
USING (
  (status IN ('in_transit', 'delivered')) AND 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'pharmacist'
  )
);