-- CREATE INDEXES FOR FASTER QUERIES
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_by_username ON public.users USING btree (username)
WHERE
    (deleted_at IS NULL);