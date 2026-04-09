// ─── PHP API Client ──────────────────────────────────────────
// Drop-in replacement for Supabase client that talks to PHP backend
// Implements the same chainable API so existing stores work unchanged
// ─────────────────────────────────────────────────────────────

type AuthChangeCallback = (event: string, session: any) => void;

const AUTH_TOKEN_KEY = 'pa_auth_token';
const AUTH_SESSION_KEY = 'pa_auth_session';

// ─── Auth Client ─────────────────────────────────────────────

class PhpAuthClient {
  private apiUrl: string;
  private listeners: AuthChangeCallback[] = [];

  constructor(apiUrl: string) {
    this.apiUrl = apiUrl;
  }

  private getStoredToken(): string | null {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  }

  private storeSession(session: any) {
    if (session) {
      localStorage.setItem(AUTH_TOKEN_KEY, session.access_token);
      localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(AUTH_SESSION_KEY);
    }
  }

  private notifyListeners(event: string, session: any) {
    this.listeners.forEach(cb => {
      try { cb(event, session); } catch (e) { console.error('Auth listener error:', e); }
    });
  }

  async signInWithPassword({ email, password }: { email: string; password: string }) {
    try {
      const res = await fetch(`${this.apiUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (!res.ok) return { data: { user: null, session: null }, error: { message: json.error || 'Error de autenticación' } };
      
      // PHP API returns { access_token, user } directly
      const session = {
        access_token: json.access_token,
        user: json.user,
      };
      this.storeSession(session);
      this.notifyListeners('SIGNED_IN', session);
      return { data: { user: json.user, session }, error: null };
    } catch (e: any) {
      return { data: { user: null, session: null }, error: { message: e.message } };
    }
  }

  async signUp({ email, password, options }: { email: string; password: string; options?: { data?: Record<string, any> } }) {
    try {
      const res = await fetch(`${this.apiUrl}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, options }),
      });
      const json = await res.json();
      if (!res.ok) return { data: { user: null, session: null }, error: { message: json.error || 'Error al registrar' } };
      
      const session = {
        access_token: json.access_token,
        user: json.user,
      };
      this.storeSession(session);
      this.notifyListeners('SIGNED_IN', session);
      return { data: { user: json.user, session }, error: null };
    } catch (e: any) {
      return { data: { user: null, session: null }, error: { message: e.message } };
    }
  }

  async signOut() {
    this.storeSession(null);
    this.notifyListeners('SIGNED_OUT', null);
    return { error: null };
  }

  async getSession() {
    const stored = localStorage.getItem(AUTH_SESSION_KEY);
    if (!stored) return { data: { session: null }, error: null };
    try {
      const session = JSON.parse(stored);
      // Verify token is still valid by calling the server
      const res = await fetch(`${this.apiUrl}/auth/session`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });
      if (!res.ok) {
        this.storeSession(null);
        return { data: { session: null }, error: null };
      }
      const json = await res.json();
      // PHP API returns { session: { access_token, user } } directly
      return { data: { session: json.session || session }, error: null };
    } catch {
      return { data: { session: JSON.parse(stored) }, error: null };
    }
  }

  async getUser() {
    const token = this.getStoredToken();
    if (!token) return { data: { user: null }, error: null };
    try {
      const res = await fetch(`${this.apiUrl}/auth/user`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const json = await res.json();
      return { data: { user: json.user || null }, error: null };
    } catch {
      return { data: { user: null }, error: null };
    }
  }

  onAuthStateChange(callback: AuthChangeCallback) {
    this.listeners.push(callback);
    
    // Check current session immediately
    const stored = localStorage.getItem(AUTH_SESSION_KEY);
    if (stored) {
      try {
        const session = JSON.parse(stored);
        setTimeout(() => callback('INITIAL_SESSION', session), 0);
      } catch { /* ignore */ }
    } else {
      setTimeout(() => callback('INITIAL_SESSION', null), 0);
    }

    return {
      data: {
        subscription: {
          unsubscribe: () => {
            const idx = this.listeners.indexOf(callback);
            if (idx !== -1) this.listeners.splice(idx, 1);
          }
        }
      }
    };
  }
}

// ─── Query Builder ───────────────────────────────────────────

class PhpQueryBuilder {
  private apiUrl: string;
  private _table: string;
  private _operation: 'select' | 'insert' | 'update' | 'delete' = 'select';
  private _filters: string[] = [];
  private _order: string[] = [];
  private _limit?: number;
  private _single = false;
  private _maybeSingle = false;
  private _data: any = null;
  private _selectCols = '*';
  private _returnSelect = false;

  constructor(apiUrl: string, table: string) {
    this.apiUrl = apiUrl;
    this._table = table;
  }

  private getToken(): string | null {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  }

  select(columns = '*') {
    if (this._operation === 'insert' || this._operation === 'update') {
      this._returnSelect = true;
    } else {
      this._operation = 'select';
    }
    this._selectCols = columns;
    return this;
  }

  insert(data: any) {
    this._operation = 'insert';
    this._data = data;
    return this;
  }

  update(data: any) {
    this._operation = 'update';
    this._data = data;
    return this;
  }

  delete() {
    this._operation = 'delete';
    return this;
  }

  eq(column: string, value: any) {
    this._filters.push(`${column}=eq.${value}`);
    return this;
  }

  neq(column: string, value: any) {
    this._filters.push(`${column}=neq.${value}`);
    return this;
  }

  gt(column: string, value: any) {
    this._filters.push(`${column}=gt.${value}`);
    return this;
  }

  gte(column: string, value: any) {
    this._filters.push(`${column}=gte.${value}`);
    return this;
  }

  lt(column: string, value: any) {
    this._filters.push(`${column}=lt.${value}`);
    return this;
  }

  lte(column: string, value: any) {
    this._filters.push(`${column}=lte.${value}`);
    return this;
  }

  ilike(column: string, pattern: string) {
    this._filters.push(`${column}=ilike.${pattern}`);
    return this;
  }

  in(column: string, values: any[]) {
    this._filters.push(`${column}=in.(${values.join(',')})`);
    return this;
  }

  is(column: string, value: any) {
    this._filters.push(`${column}=is.${value}`);
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    const dir = options?.ascending === false ? 'desc' : 'asc';
    this._order.push(`${column}.${dir}`);
    return this;
  }

  limit(count: number) {
    this._limit = count;
    return this;
  }

  single() {
    this._single = true;
    return this;
  }

  maybeSingle() {
    this._maybeSingle = true;
    return this;
  }

  // Make it thenable
  then(resolve: (value: any) => any, reject?: (reason: any) => any) {
    return this._execute().then(resolve, reject);
  }

  private async _execute(): Promise<{ data: any; error: any; count?: number }> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      let url: string;
      let method: string;
      let body: string | undefined;

      const params = new URLSearchParams();
      this._filters.forEach(f => {
        const [key, ...rest] = f.split('=');
        params.append(key, rest.join('='));
      });
      if (this._order.length) params.set('order', this._order.join(','));
      if (this._limit) params.set('limit', String(this._limit));
      if (this._selectCols !== '*') params.set('select', this._selectCols);
      
      const qs = params.toString();

      switch (this._operation) {
        case 'select':
          url = `${this.apiUrl}/${this._table}${qs ? '?' + qs : ''}`;
          method = 'GET';
          break;
        case 'insert':
          url = `${this.apiUrl}/${this._table}`;
          method = 'POST';
          body = JSON.stringify(this._data);
          break;
        case 'update':
          url = `${this.apiUrl}/${this._table}${qs ? '?' + qs : ''}`;
          method = 'PATCH';
          body = JSON.stringify(this._data);
          break;
        case 'delete':
          url = `${this.apiUrl}/${this._table}${qs ? '?' + qs : ''}`;
          method = 'DELETE';
          break;
        default:
          url = `${this.apiUrl}/${this._table}`;
          method = 'GET';
      }

      const res = await fetch(url, { method, headers, body });
      
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: res.statusText }));
        return { data: null, error: { message: err.error || err.message || 'Error del servidor' } };
      }

      let data = await res.json();

      // Handle single/maybeSingle
      if (this._single) {
        if (Array.isArray(data)) {
          data = data[0] || null;
          if (!data) return { data: null, error: { message: 'No se encontró el registro', code: 'PGRST116' } };
        }
      } else if (this._maybeSingle) {
        if (Array.isArray(data)) {
          data = data[0] || null;
        }
      }

      return { data, error: null };
    } catch (e: any) {
      return { data: null, error: { message: e.message } };
    }
  }
}

// ─── Storage Client ──────────────────────────────────────────

class PhpStorageBucketClient {
  private apiUrl: string;
  private bucket: string;

  constructor(apiUrl: string, bucket: string) {
    this.apiUrl = apiUrl;
    this.bucket = bucket;
  }

  async upload(path: string, file: File) {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${this.apiUrl}/storage/object/${this.bucket}/${path}`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) return { data: null, error: { message: json.error } };
      return { data: json.data, error: null };
    } catch (e: any) {
      return { data: null, error: { message: e.message } };
    }
  }

  getPublicUrl(path: string) {
    // In self-hosted mode, storage files are served directly
    const baseUrl = this.apiUrl.replace('/api', '');
    return { data: { publicUrl: `${baseUrl}/storage/${this.bucket}/${path}` } };
  }

  async remove(paths: string[]) {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    for (const path of paths) {
      await fetch(`${this.apiUrl}/storage/object/${this.bucket}/${path}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
    }
    return { data: null, error: null };
  }
}

class PhpStorageClient {
  private apiUrl: string;
  constructor(apiUrl: string) { this.apiUrl = apiUrl; }
  from(bucket: string) { return new PhpStorageBucketClient(this.apiUrl, bucket); }
}

// ─── Main Client ─────────────────────────────────────────────

export class PhpApiClient {
  auth: PhpAuthClient;
  storage: PhpStorageClient;
  private apiUrl: string;

  constructor(apiUrl: string) {
    this.apiUrl = apiUrl;
    this.auth = new PhpAuthClient(apiUrl);
    this.storage = new PhpStorageClient(apiUrl);
  }

  from(table: string) {
    return new PhpQueryBuilder(this.apiUrl, table);
  }

  async rpc(fnName: string, args?: Record<string, any>) {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      const res = await fetch(`${this.apiUrl}/rpc/${fnName}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(args || {}),
      });
      const data = await res.json();
      if (!res.ok) return { data: null, error: { message: data.error || 'Error en RPC' } };
      return { data, error: null };
    } catch (e: any) {
      return { data: null, error: { message: e.message } };
    }
  }
}

export function createPhpClient(apiUrl: string) {
  return new PhpApiClient(apiUrl);
}
