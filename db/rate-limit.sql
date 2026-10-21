CREATE TABLE IF NOT EXISTS rate_limit_windows (
    scope VARCHAR(10) NOT NULL CHECK (scope IN ('GET', 'POST', 'PUT', 'DELETE')),
    client_key CHAR(64) NOT NULL,
    window_start TIMESTAMPTZ NOT NULL,
    request_count INTEGER NOT NULL CHECK (request_count > 0),
    PRIMARY KEY (scope, client_key, window_start)
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_windows_window_start
ON rate_limit_windows (window_start);
