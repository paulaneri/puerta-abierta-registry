# Architecture rules

- Use `sessionLock` for the shared Supabase client: preserve cross-tab exclusion without stealing active authentication locks; PHP authentication stays independent.