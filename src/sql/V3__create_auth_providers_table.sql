-- Create auth_providers table
CREATE TABLE public.auth_providers (
    id UUID DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id UUID NOT NULL,
    provider TEXT NOT NULL,
    provider_id TEXT, -- Stores either hashed password or OAuth ID

    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create an index for active user keys
CREATE INDEX idx_auth_providers_active ON public.auth_providers (user_id) WHERE deleted_at IS NULL;

-- Add active_auth_provider_id column to users table
ALTER TABLE public.users 
ADD COLUMN active_auth_provider_id UUID;
