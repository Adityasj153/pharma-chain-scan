-- Enable realtime for batches table so status updates are reflected immediately
ALTER TABLE batches REPLICA IDENTITY FULL;

-- Add batches table to realtime publication if not already added
ALTER PUBLICATION supabase_realtime ADD TABLE batches;