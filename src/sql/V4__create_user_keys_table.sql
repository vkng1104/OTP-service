-- Create user_keys table
CREATE TABLE public.user_keys (
    id UUID DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id UUID NOT NULL,
    public_key TEXT NOT NULL,
    encrypted_private_key TEXT NOT NULL,
    encrypted_mnemonic_phrase TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create an index for active user keys
CREATE INDEX idx_user_keys_active ON public.user_keys (user_id) WHERE deleted_at IS NULL;
