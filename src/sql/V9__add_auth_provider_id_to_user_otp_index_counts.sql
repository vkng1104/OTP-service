-- Add auth_provider_id column to user_otp_index_counts table
ALTER TABLE public.user_otp_index_counts
ADD COLUMN auth_provider_id uuid NOT NULL;

-- Drop the existing index on user_id
DROP INDEX IF EXISTS idx_user_otp_index_counts_user_id;

-- Create a new unique index on auth_provider_id
CREATE UNIQUE INDEX idx_user_otp_index_counts_auth_provider_id ON public.user_otp_index_counts USING btree (auth_provider_id)
WHERE
    deleted_at IS NULL;