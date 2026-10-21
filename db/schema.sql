CREATE TABLE IF NOT EXISTS bookmarks (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    url VARCHAR(2048) NOT NULL,
    category VARCHAR(50),
    description VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_created_at
ON bookmarks (created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_bookmarks_category
ON bookmarks (category);

CREATE OR REPLACE FUNCTION set_bookmark_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS bookmarks_set_updated_at ON bookmarks;
CREATE TRIGGER bookmarks_set_updated_at
BEFORE UPDATE ON bookmarks
FOR EACH ROW
EXECUTE FUNCTION set_bookmark_updated_at();
