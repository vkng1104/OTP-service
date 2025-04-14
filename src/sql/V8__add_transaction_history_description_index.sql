-- Enable the pg_trgm extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add GiST index for description field to improve ILIKE search performance
CREATE INDEX IF NOT EXISTS idx_transaction_history_description_trgm ON public.transaction_history USING gist (description gist_trgm_ops);

-- Make description field NOT NULL
ALTER TABLE public.transaction_history ALTER COLUMN description SET NOT NULL; 