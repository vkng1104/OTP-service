-- Enable the uuid-ossp extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create table users
CREATE TABLE public.users (
    id UUID DEFAULT public.uuid_generate_v4() NOT NULL,
    username TEXT NOT NULL,
    authentication_type text NOT NULL,
    role text NOT NULL,
    status text NOT NULL,

    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone,

    phone text,
    email text,
    platform text,
    language text,
    image_url text,
    password_reset_key text,
    first_name text,
    last_name text
);