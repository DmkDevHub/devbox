-- Provision devbox_app_runtime separately with LOGIN, NOSUPERUSER, NOCREATEDB,
-- NOCREATEROLE, NOBYPASSRLS, and NOINHERIT. Keep its password in a secret store.
GRANT USAGE ON SCHEMA public TO devbox_app_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLE public.bookmarks, public.rate_limit_windows
TO devbox_app_runtime;
GRANT USAGE, SELECT ON SEQUENCE public.bookmarks_id_seq TO devbox_app_runtime;
