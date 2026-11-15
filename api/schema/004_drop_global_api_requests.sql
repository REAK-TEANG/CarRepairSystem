-- The global request limiter now counts only in the cache tier (Redis/APCu), per signed-in user
-- or per IP, so its database table is no longer used.
DROP TABLE IF EXISTS global_api_requests;
