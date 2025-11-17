-- Drop the restrictive update policy and create a new one that allows pharmacists
-- to claim and update batches that are in-transit or delivered
DROP POLICY IF EXISTS "Pharmacists can update batches assigned to them" ON batches;

CREATE POLICY "Pharmacists can update batches"
ON batches
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'pharmacist'
  ) 
  AND (
    -- Can update batches already assigned to them
    auth.uid() = pharmacist_id
    OR 
    -- Can claim batches that are in-transit or delivered (not yet assigned)
    (status IN ('in_transit', 'delivered') AND pharmacist_id IS NULL)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'pharmacist'
  )
);