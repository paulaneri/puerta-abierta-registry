# Architecture rules

- Use `sessionLock` for the shared Supabase client: preserve cross-tab exclusion without stealing active authentication locks; PHP authentication stays independent.
- Self-hosted update archives must compile explicitly for PHP with `/api` and exclude `api/config.php`, installers and existing storage data to preserve credentials and records.