-- Enable the uuid-ossp extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create table users
CREATE TABLE public.users (
    id UUID DEFAULT public.uuid_generate_v4() NOT NULL,
    username TEXT NOT NULL,
    role TEXT NOT NULL,
    status TEXT NOT NULL,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE,

    phone TEXT,
    email TEXT,
    platform TEXT,
    language TEXT,
    image_url TEXT,
    password_reset_key TEXT,
    first_name TEXT,
    last_name TEXT
);