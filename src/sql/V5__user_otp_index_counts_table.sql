-- Create user_keys table
CREATE TABLE public.user_otp_index_counts (
    id uuid PRIMARY KEY DEFAULT public.uuid_generate_v4(),
    user_id uuid NOT NULL,
    otp_index BIGINT NOT NULL DEFAULT 1,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone
);

-- Create an index on the user_id column
CREATE UNIQUE INDEX idx_user_otp_index_counts_user_id ON public.user_otp_index_counts (user_id) WHERE deleted_at IS NULL;