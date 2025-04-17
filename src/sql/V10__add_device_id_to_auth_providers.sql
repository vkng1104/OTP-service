-- Add device_id column to auth_providers table
ALTER TABLE public.auth_providers
ADD COLUMN device_id TEXT;

-- Drop the existing unique index
DROP INDEX IF EXISTS idx_auth_providers_user_id_provider;

-- Create a unique index for auth providers without device_id (like password auth)
CREATE UNIQUE INDEX idx_auth_providers_user_id_provider_no_device 
ON public.auth_providers (user_id, provider) 
WHERE device_id IS NULL AND deleted_at IS NULL;

-- Create a unique index for auth providers with device_id (like PIN auth)
CREATE UNIQUE INDEX idx_auth_providers_user_id_provider_device 
ON public.auth_providers (user_id, provider, device_id) 
WHERE device_id IS NOT NULL AND deleted_at IS NULL;

-- Add a comment to explain the purpose of the device_id column
COMMENT ON COLUMN public.auth_providers.device_id IS 'Device identifier for device-specific authentication methods like PIN';
