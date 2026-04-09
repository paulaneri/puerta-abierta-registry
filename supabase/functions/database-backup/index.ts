import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TABLES = [
  'mujeres',
  'centro_dia',
  'trabajo_campo',
  'contactos',
  'equipo',
  'duplas_acompanamiento',
  'eventos',
  'gastos',
  'etiquetas_gastos',
  'albumes',
  'fotos_album',
  'reuniones_semanales',
  'asignaciones_roles',
  'disponibilidad_reuniones',
  'cargos_profesionales',
  'nacionalidades',
  'lugares',
  'actividades',
  'profiles',
  'user_roles',
];

// Catalog tables (config data without sensitive records)
const CATALOG_TABLES = ['etiquetas_gastos', 'cargos_profesionales', 'nacionalidades', 'lugares'];

function escapeValue(val: unknown): string {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  if (typeof val === 'number') return String(val);
  if (Array.isArray(val)) {
    const escaped = val.map(v => `"${String(v).replace(/"/g, '\\"')}"`).join(',');
    return `ARRAY[${escaped}]`;
  }
  if (typeof val === 'object') {
    return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
  }
  return `'${String(val).replace(/'/g, "''")}'`;
}

async function dumpTable(supabase: ReturnType<typeof createClient>, table: string): Promise<{ sql: string; count: number; error?: string }> {
  try {
    const { data, error } = await supabase.from(table).select('*');
    if (error) return { sql: `-- Error al exportar tabla ${table}: ${error.message}\n\n`, count: 0, error: error.message };
    if (!data || data.length === 0) return { sql: `-- Tabla ${table}: sin registros\n\n`, count: 0 };

    const columns = Object.keys(data[0]);
    let sql = `-- Tabla: ${table} (${data.length} registros)\n`;
    sql += `TRUNCATE TABLE public."${table}" CASCADE;\n`;
    sql += `INSERT INTO public."${table}" (${columns.map(c => `"${c}"`).join(', ')}) VALUES\n`;
    const rows = data.map(row => `  (${columns.map(col => escapeValue(row[col])).join(', ')})`);
    sql += rows.join(',\n') + ';\n\n';
    return { sql, count: data.length };
  } catch (e) {
    return { sql: `-- Error inesperado en tabla ${table}\n\n`, count: 0, error: String(e) };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Auth check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', user.id).single();
    if (!roleData || roleData.role !== 'administrador') {
      return new Response(JSON.stringify({ error: 'Forbidden: admin only' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Determine export mode
    const url = new URL(req.url);
    const mode = url.searchParams.get('mode') ?? 'full'; // full | catalogs | json_summary

    const now = new Date().toISOString();

    // --- JSON summary mode ---
    if (mode === 'json_summary') {
      const summary: Record<string, number> = {};
      for (const table of TABLES) {
        const { data } = await supabase.from(table).select('id', { count: 'exact', head: true });
        summary[table] = (data as any)?.length ?? 0;
      }
      // Count properly
      const counts: Record<string, number> = {};
      for (const table of TABLES) {
        const { count } = await supabase.from(table).select('*', { count: 'exact', head: true });
        counts[table] = count ?? 0;
      }
      const json = JSON.stringify({ generado: now, tablas: counts }, null, 2);
      return new Response(json, {
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Content-Disposition': `attachment; filename="resumen_${now.slice(0,10)}.json"` }
      });
    }

    // --- SQL backup mode (full or catalogs) ---
    const tablesToExport = mode === 'catalogs' ? CATALOG_TABLES : TABLES;
    let sql = `-- ============================================================\n`;
    sql += `-- Backup Puerta Abierta Recreando\n`;
    sql += `-- Generado: ${now}\n`;
    sql += `-- Modo: ${mode === 'catalogs' ? 'Solo catálogos de configuración' : 'Completo'}\n`;
    sql += `-- ============================================================\n\n`;
    sql += `SET client_encoding = 'UTF8';\nSET standard_conforming_strings = on;\n\n`;

    let totalRecords = 0;
    for (const table of tablesToExport) {
      const result = await dumpTable(supabase, table);
      sql += result.sql;
      totalRecords += result.count;
    }

    sql += `-- ============================================================\n`;
    sql += `-- Total registros exportados: ${totalRecords}\n`;
    sql += `-- ============================================================\n`;

    const filename = mode === 'catalogs'
      ? `catalogos_${now.slice(0, 10)}.sql`
      : `backup_completo_${now.slice(0, 10)}.sql`;

    return new Response(sql, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
