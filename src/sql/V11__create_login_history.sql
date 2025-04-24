-- Create login_history table
CREATE TABLE
    public.login_history (
        id UUID DEFAULT public.uuid_generate_v4 () NOT NULL,
        user_id UUID NOT NULL,
        auth_provider_id UUID NOT NULL,
        auth_provider TEXT NOT NULL,
        device_id TEXT,
        ipfs_cid TEXT NOT NULL,
        description TEXT NOT NULL,

        created_at TIMESTAMP WITH TIME ZONE DEFAULT now () NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE,
        deleted_at TIMESTAMP WITH TIME ZONE
    );

ALTER TABLE public.transaction_history
ADD COLUMN ipfs_cid TEXT NOT NULL;