import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import logoImg from "@/assets/logo-par.png";
import {
  saveSetupConfig,
  markSetupCompleted,
  getSetupConfig,
  REQUIRED_TABLES,
  SETUP_CONFIG_KEY,
} from "@/lib/setupConfig";
import {
  CheckCircle2,
  Circle,
  Database,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  RefreshCw,
  Server,
  ShieldCheck,
  Sparkles,
  Table2,
  UserPlus,
  XCircle,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type StepStatus = "pending" | "active" | "done" | "error";

interface Step {
  id: number;
  label: string;
  icon: React.ReactNode;
}

interface DbConfig {
  url: string;
  anonKey: string;
  projectId: string;
}

interface AdminConfig {
  email: string;
  password: string;
  confirmPassword: string;
  nombre: string;
  apellido: string;
}

type ConnectionStatus = "idle" | "testing" | "success" | "error";

// ─── Constants ───────────────────────────────────────────────────────────────

const STEPS: Step[] = [
  { id: 1, label: "Bienvenida", icon: <Sparkles className="w-4 h-4" /> },
  { id: 2, label: "Base de datos", icon: <Database className="w-4 h-4" /> },
  { id: 3, label: "Verificación", icon: <Table2 className="w-4 h-4" /> },
  { id: 4, label: "Administrador", icon: <UserPlus className="w-4 h-4" /> },
  { id: 5, label: "¡Listo!", icon: <CheckCircle2 className="w-4 h-4" /> },
];

// ─── Sub-components ──────────────────────────────────────────────────────────

const StepIndicator = ({
  step,
  status,
  isLast,
}: {
  step: Step;
  status: StepStatus;
  isLast: boolean;
}) => {
  const iconBg =
    status === "done"
      ? "bg-primary text-primary-foreground"
      : status === "active"
        ? "bg-primary/20 text-primary ring-2 ring-primary"
        : status === "error"
          ? "bg-destructive/20 text-destructive ring-2 ring-destructive"
          : "bg-muted text-muted-foreground";

  return (
    <div className="flex items-center gap-2 flex-1 min-w-0">
      <div className="flex flex-col items-center gap-1 flex-shrink-0">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${iconBg}`}>
          {status === "done" ? <CheckCircle2 className="w-4 h-4" /> : step.icon}
        </div>
        <span
          className={`text-[10px] font-medium leading-none text-center ${
            status === "active"
              ? "text-primary"
              : status === "done"
                ? "text-primary/70"
                : "text-muted-foreground"
          }`}
        >
          {step.label}
        </span>
      </div>
      {!isLast && (
        <div
          className={`h-[2px] flex-1 rounded-full transition-all ${
            status === "done" ? "bg-primary" : "bg-border"
          }`}
        />
      )}
    </div>
  );
};

const FieldHint = ({ children }: { children: React.ReactNode }) => (
  <p className="text-xs text-muted-foreground mt-1">{children}</p>
);

const StatusBadge = ({
  status,
  message,
}: {
  status: ConnectionStatus;
  message: string;
}) => {
  if (status === "idle") return null;
  const map = {
    testing: { icon: <Loader2 className="w-4 h-4 animate-spin" />, color: "text-muted-foreground" },
    success: { icon: <CheckCircle2 className="w-4 h-4" />, color: "text-green-600" },
    error: { icon: <XCircle className="w-4 h-4" />, color: "text-destructive" },
  } as const;
  const { icon, color } = map[status as keyof typeof map];
  return (
    <div className={`flex items-center gap-2 text-sm font-medium ${color} mt-3 p-3 rounded-lg bg-muted/50`}>
      {icon}
      <span>{message}</span>
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────

export default function Setup() {
  const [currentStep, setCurrentStep] = useState(1);

  // Step 2 – DB config
  const [dbConfig, setDbConfig] = useState<DbConfig>({
    url: import.meta.env.VITE_SUPABASE_URL || "",
    anonKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "",
    projectId: import.meta.env.VITE_SUPABASE_PROJECT_ID || "",
  });
  const [showKey, setShowKey] = useState(false);
  const [connStatus, setConnStatus] = useState<ConnectionStatus>("idle");
  const [connMessage, setConnMessage] = useState("");

  // Step 3 – Schema verification
  const [schemaStatus, setSchemaStatus] = useState<ConnectionStatus>("idle");
  const [schemaMessage, setSchemaMessage] = useState("");
  const [tableResults, setTableResults] = useState<{ name: string; exists: boolean }[]>([]);

  // Step 4 – Admin user
  const [adminConfig, setAdminConfig] = useState<AdminConfig>({
    email: "",
    password: "",
    confirmPassword: "",
    nombre: "",
    apellido: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [adminStatus, setAdminStatus] = useState<ConnectionStatus>("idle");
  const [adminMessage, setAdminMessage] = useState("");
  const [adminCreating, setAdminCreating] = useState(false);

  const progress = ((currentStep - 1) / (STEPS.length - 1)) * 100;

  // ── Step 2: Test connection ──────────────────────────────────────────────

  const testConnection = async () => {
    if (!dbConfig.url || !dbConfig.anonKey) {
      setConnStatus("error");
      setConnMessage("Completá todos los campos antes de probar la conexión.");
      return;
    }
    setConnStatus("testing");
    setConnMessage("Conectando con Supabase…");
    try {
      const client = createClient(dbConfig.url, dbConfig.anonKey);
      const { error } = await client.from("profiles").select("id").limit(1);
      if (error && error.code !== "PGRST116") {
        throw error;
      }
      setConnStatus("success");
      setConnMessage("¡Conexión exitosa! La base de datos responde correctamente.");
      localStorage.setItem(SETUP_CONFIG_KEY, JSON.stringify(dbConfig));
    } catch (e: unknown) {
      setConnStatus("error");
      const msg = e instanceof Error ? e.message : "Error desconocido";
      setConnMessage(`Error de conexión: ${msg}`);
    }
  };

  const handleNextFromDb = () => {
    if (connStatus !== "success") {
      setConnStatus("error");
      setConnMessage("Probá y verificá la conexión antes de continuar.");
      return;
    }
    setCurrentStep(3);
  };

  // ── Step 3: Verify schema ────────────────────────────────────────────────

  const verifySchema = async () => {
    setSchemaStatus("testing");
    setSchemaMessage("Verificando estructura de la base de datos…");
    setTableResults([]);

    try {
      const config = getSetupConfig() ?? dbConfig;
      const client = createClient(config.url, config.anonKey);
      const results: { name: string; exists: boolean }[] = [];

      for (const table of REQUIRED_TABLES) {
        try {
          const { error } = await client.from(table).select("id", { count: "exact", head: true });
          // If no error or PGRST116 (no rows) → table exists
          results.push({ name: table, exists: !error || error.code === "PGRST116" });
        } catch {
          results.push({ name: table, exists: false });
        }
      }

      setTableResults(results);
      const missing = results.filter((r) => !r.exists);

      if (missing.length === 0) {
        setSchemaStatus("success");
        setSchemaMessage(`¡Perfecto! Las ${REQUIRED_TABLES.length} tablas requeridas están presentes.`);
      } else {
        setSchemaStatus("error");
        setSchemaMessage(
          `Faltan ${missing.length} tabla(s). Necesitás aplicar el schema SQL antes de continuar. ` +
          `Descargá el backup desde una instalación existente (Administración → Configuración → Backup Completo) ` +
          `y ejecutalo en el SQL Editor de tu proyecto Supabase.`
        );
      }
    } catch (e: unknown) {
      setSchemaStatus("error");
      const msg = e instanceof Error ? e.message : "Error desconocido";
      setSchemaMessage(`Error al verificar: ${msg}`);
    }
  };

  // ── Step 4: Create admin ─────────────────────────────────────────────────

  const createAdmin = async () => {
    const { email, password, confirmPassword, nombre, apellido } = adminConfig;

    if (!email || !password || !nombre) {
      setAdminStatus("error");
      setAdminMessage("Completá al menos el email, nombre y contraseña.");
      return;
    }
    if (password !== confirmPassword) {
      setAdminStatus("error");
      setAdminMessage("Las contraseñas no coinciden.");
      return;
    }
    if (password.length < 8) {
      setAdminStatus("error");
      setAdminMessage("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    setAdminCreating(true);
    setAdminStatus("testing");
    setAdminMessage("Creando usuario administrador…");

    try {
      const config = getSetupConfig() ?? dbConfig;
      const client = createClient(config.url, config.anonKey);

      const { data, error } = await client.auth.signUp({
        email,
        password,
        options: {
          data: { nombre, apellido, role: "administrador" },
        },
      });

      if (error) throw error;
      if (!data.user) throw new Error("No se pudo crear el usuario.");

      // Try to set admin role via RPC if available
      try {
        await client.rpc("create_example_user", {
          user_email: email,
          user_password: password,
          user_role: "administrador",
          user_nombre: nombre,
          user_apellido: apellido,
        });
      } catch {
        // Non-critical — the trigger will assign a default role
      }

      setAdminStatus("success");
      setAdminMessage(
        `¡Usuario ${nombre} creado! Revisá tu email para confirmar la cuenta (si el envío de emails está habilitado).`
      );
    } catch (e: unknown) {
      setAdminStatus("error");
      const msg = e instanceof Error ? e.message : "Error desconocido";
      setAdminMessage(`Error: ${msg}`);
    } finally {
      setAdminCreating(false);
    }
  };

  const handleFinish = () => {
    saveSetupConfig(dbConfig);
    markSetupCompleted();
    window.location.href = "/auth";
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Logo + header */}
        <div className="text-center mb-8">
          <img src={logoImg} alt="Logo" className="h-14 mx-auto mb-3 object-contain" />
          <h1 className="text-2xl font-bold text-foreground">Configuración inicial</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Seguí los pasos para conectar y configurar tu instancia de la aplicación
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-2">
          <Progress value={progress} className="h-1.5 rounded-full" />
        </div>

        {/* Step indicators */}
        <div className="flex items-start mb-8 px-2">
          {STEPS.map((step, idx) => {
            const status: StepStatus =
              step.id < currentStep
                ? "done"
                : step.id === currentStep
                  ? "active"
                  : "pending";
            return (
              <StepIndicator
                key={step.id}
                step={step}
                status={status}
                isLast={idx === STEPS.length - 1}
              />
            );
          })}
        </div>

        {/* Card */}
        <div className="bg-card border rounded-2xl shadow-lg overflow-hidden">
          {/* ── STEP 1: Welcome ── */}
          {currentStep === 1 && (
            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Bienvenida al asistente de instalación</h2>
                  <p className="text-sm text-muted-foreground">Configuración automática del sistema</p>
                </div>
              </div>

              <p className="text-muted-foreground mb-6 leading-relaxed">
                Este asistente te guiará paso a paso para conectar la aplicación con tu base de datos,
                verificar que el schema esté instalado y crear el primer usuario administrador.
                El proceso toma menos de 5 minutos.
              </p>

              <div className="space-y-3 mb-8">
                {[
                  { icon: <Database className="w-4 h-4 text-primary" />, title: "Conexión a Supabase", desc: "Ingresás la URL y clave de tu proyecto" },
                  { icon: <Table2 className="w-4 h-4 text-primary" />, title: "Verificación del schema", desc: "Comprobamos que las tablas necesarias existan" },
                  { icon: <UserPlus className="w-4 h-4 text-primary" />, title: "Primer administrador", desc: "Creás el usuario con acceso total a la app" },
                  { icon: <ShieldCheck className="w-4 h-4 text-primary" />, title: "¡Lista para usar!", desc: "Ingresás y empezás a gestionar registros" },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-3 p-3 rounded-lg bg-muted/40">
                    <div className="w-7 h-7 rounded-full bg-background flex items-center justify-center border flex-shrink-0 mt-0.5">
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 mb-6">
                <p className="text-sm text-foreground">
                  <span className="font-semibold">¿Ya tenés un proyecto en Supabase?</span> Tené a mano la{" "}
                  <span className="font-medium text-primary">URL del proyecto</span>,{" "}
                  la <span className="font-medium text-primary">clave anon/pública</span> y el{" "}
                  <span className="font-medium text-primary">Reference ID</span>.<br />
                  Los encontrás en <strong>Settings → API</strong> de tu proyecto Supabase.
                </p>
              </div>

              <Button className="w-full" size="lg" onClick={() => setCurrentStep(2)}>
                Comenzar instalación
                <Sparkles className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}

          {/* ── STEP 2: Database ── */}
          {currentStep === 2 && (
            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Database className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Conexión a la base de datos</h2>
                  <p className="text-sm text-muted-foreground">Ingresá los datos de tu proyecto Supabase</p>
                </div>
              </div>

              <div className="space-y-5 mb-6">
                <div>
                  <Label htmlFor="db-url">URL del proyecto</Label>
                  <Input
                    id="db-url"
                    placeholder="https://xxxxxxxxxxxxxx.supabase.co"
                    value={dbConfig.url}
                    onChange={(e) => {
                      setDbConfig((p) => ({ ...p, url: e.target.value }));
                      setConnStatus("idle");
                    }}
                    className="mt-1 font-mono text-sm"
                  />
                  <FieldHint>
                    Supabase Dashboard → Settings → API → <strong>Project URL</strong>
                  </FieldHint>
                </div>

                <div>
                  <Label htmlFor="db-key">Clave pública (anon key)</Label>
                  <div className="relative mt-1">
                    <Input
                      id="db-key"
                      type={showKey ? "text" : "password"}
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9…"
                      value={dbConfig.anonKey}
                      onChange={(e) => {
                        setDbConfig((p) => ({ ...p, anonKey: e.target.value }));
                        setConnStatus("idle");
                      }}
                      className="font-mono text-sm pr-10"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowKey((v) => !v)}
                    >
                      {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <FieldHint>
                    Supabase Dashboard → Settings → API → <strong>anon / public key</strong>
                  </FieldHint>
                </div>

                <div>
                  <Label htmlFor="db-pid">Reference ID del proyecto</Label>
                  <Input
                    id="db-pid"
                    placeholder="xxxxxxxxxxxxxx"
                    value={dbConfig.projectId}
                    onChange={(e) => {
                      setDbConfig((p) => ({ ...p, projectId: e.target.value }));
                      setConnStatus("idle");
                    }}
                    className="mt-1 font-mono text-sm"
                  />
                  <FieldHint>
                    Supabase Dashboard → Settings → General → <strong>Reference ID</strong>
                  </FieldHint>
                </div>
              </div>

              <StatusBadge status={connStatus} message={connMessage} />

              <div className="mt-5 p-4 rounded-xl bg-muted/40 border text-sm space-y-1.5">
                <p className="font-medium flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" /> ¿Dónde encontrar estos datos?
                </p>
                <ol className="list-decimal list-inside text-muted-foreground space-y-1 pl-1">
                  <li>Abrí <strong>supabase.com</strong> y entrá a tu proyecto</li>
                  <li>Ir a <strong>Settings → API</strong></li>
                  <li>Copiá <em>Project URL</em> y <em>anon public</em></li>
                  <li>Para el Reference ID: <strong>Settings → General</strong></li>
                </ol>
              </div>

              <div className="flex gap-3 mt-6">
                <Button variant="outline" onClick={() => setCurrentStep(1)} className="flex-1">
                  Atrás
                </Button>
                <Button
                  variant="outline"
                  onClick={testConnection}
                  disabled={connStatus === "testing"}
                  className="flex-1"
                >
                  {connStatus === "testing" ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  Probar conexión
                </Button>
                <Button onClick={handleNextFromDb} disabled={connStatus !== "success"} className="flex-1">
                  Continuar
                </Button>
              </div>
            </div>
          )}

          {/* ── STEP 3: Schema verification ── */}
          {currentStep === 3 && (
            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Table2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Verificación del schema</h2>
                  <p className="text-sm text-muted-foreground">Comprobamos que las tablas necesarias existan en la base de datos</p>
                </div>
              </div>

              <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
                Vamos a verificar que tu base de datos tiene todas las tablas requeridas.
                Si faltan tablas, necesitarás importar el schema SQL desde una instalación existente.
              </p>

              {tableResults.length > 0 && (
                <div className="mb-4 max-h-60 overflow-y-auto border rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 sticky top-0">
                      <tr>
                        <th className="text-left p-2 pl-3 font-medium">Tabla</th>
                        <th className="text-center p-2 pr-3 font-medium w-24">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableResults.map((t) => (
                        <tr key={t.name} className="border-t">
                          <td className="p-2 pl-3 font-mono text-xs">{t.name}</td>
                          <td className="p-2 pr-3 text-center">
                            {t.exists ? (
                              <CheckCircle2 className="w-4 h-4 text-green-600 inline" />
                            ) : (
                              <XCircle className="w-4 h-4 text-destructive inline" />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <StatusBadge status={schemaStatus} message={schemaMessage} />

              {schemaStatus === "error" && (
                <div className="mt-4 p-4 rounded-xl bg-muted border text-sm">
                  <p className="font-medium text-foreground mb-2">📋 Cómo instalar el schema</p>
                  <ol className="list-decimal list-inside text-muted-foreground space-y-1.5 pl-1">
                    <li>Desde otra instalación: ir a <strong>Administración → Configuración</strong></li>
                    <li>Descargar el <strong>Backup Completo (.sql)</strong></li>
                    <li>En tu proyecto Supabase: abrir <strong>SQL Editor</strong></li>
                    <li>Pegar y ejecutar el contenido del archivo .sql</li>
                    <li>Volver aquí y presionar <strong>"Verificar de nuevo"</strong></li>
                  </ol>
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <Button variant="outline" onClick={() => setCurrentStep(2)} className="flex-1">
                  Atrás
                </Button>
                <Button
                  variant="outline"
                  onClick={verifySchema}
                  disabled={schemaStatus === "testing"}
                  className="flex-1"
                >
                  {schemaStatus === "testing" ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Server className="w-4 h-4 mr-2" />
                  )}
                  {schemaStatus === "error" ? "Verificar de nuevo" : "Verificar schema"}
                </Button>
                <Button
                  onClick={() => setCurrentStep(4)}
                  disabled={schemaStatus !== "success"}
                  className="flex-1"
                >
                  Continuar
                </Button>
              </div>
            </div>
          )}

          {/* ── STEP 4: Admin user ── */}
          {currentStep === 4 && (
            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Crear usuario administrador</h2>
                  <p className="text-sm text-muted-foreground">Este será el primer acceso con permisos totales</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <Label htmlFor="admin-nombre">Nombre *</Label>
                  <Input
                    id="admin-nombre"
                    placeholder="Paula"
                    value={adminConfig.nombre}
                    onChange={(e) => setAdminConfig((p) => ({ ...p, nombre: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="admin-apellido">Apellido</Label>
                  <Input
                    id="admin-apellido"
                    placeholder="García"
                    value={adminConfig.apellido}
                    onChange={(e) => setAdminConfig((p) => ({ ...p, apellido: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="space-y-4 mb-4">
                <div>
                  <Label htmlFor="admin-email">Email *</Label>
                  <Input
                    id="admin-email"
                    type="email"
                    placeholder="admin@organización.org"
                    value={adminConfig.email}
                    onChange={(e) => {
                      setAdminConfig((p) => ({ ...p, email: e.target.value }));
                      setAdminStatus("idle");
                    }}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="admin-pass">Contraseña * (mín. 8 caracteres)</Label>
                  <div className="relative mt-1">
                    <Input
                      id="admin-pass"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={adminConfig.password}
                      onChange={(e) => setAdminConfig((p) => ({ ...p, password: e.target.value }))}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPassword((v) => !v)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="admin-confirm">Confirmar contraseña *</Label>
                  <Input
                    id="admin-confirm"
                    type="password"
                    placeholder="••••••••"
                    value={adminConfig.confirmPassword}
                    onChange={(e) => setAdminConfig((p) => ({ ...p, confirmPassword: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              </div>

              <StatusBadge status={adminStatus} message={adminMessage} />

              <div className="mt-5 p-4 rounded-xl bg-muted border border-border text-sm">
                <p className="font-medium text-foreground mb-1">⚠️ Importante</p>
                <p className="text-muted-foreground">
                  Si Supabase tiene habilitada la confirmación por email, recibirás un link para activar la cuenta.
                  Podés desactivar este requisito en <strong>Authentication → Providers → Email → Confirm email</strong>.
                </p>
              </div>

              <div className="flex gap-3 mt-6">
                <Button variant="outline" onClick={() => setCurrentStep(3)} className="flex-1" disabled={adminCreating}>
                  Atrás
                </Button>
                {adminStatus !== "success" && (
                  <Button onClick={createAdmin} disabled={adminCreating} className="flex-1">
                    {adminCreating ? (
                      <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Creando…</>
                    ) : (
                      <><UserPlus className="w-4 h-4 mr-2" /> Crear administrador</>
                    )}
                  </Button>
                )}
                {adminStatus === "success" && (
                  <Button onClick={() => setCurrentStep(5)} className="flex-1">
                    Continuar <CheckCircle2 className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* ── STEP 5: Done ── */}
          {currentStep === 5 && (
            <div className="p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2">¡Instalación completa!</h2>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Tu aplicación está conectada y lista. Ahora podés ingresar con el usuario administrador que acabás de crear.
              </p>

              <div className="space-y-3 text-left max-w-sm mx-auto mb-8">
                {[
                  { icon: <CheckCircle2 className="w-4 h-4 text-primary" />, text: "Conexión a base de datos verificada" },
                  { icon: <CheckCircle2 className="w-4 h-4 text-primary" />, text: "Schema de la base de datos verificado" },
                  { icon: <CheckCircle2 className="w-4 h-4 text-primary" />, text: "Usuario administrador creado" },
                  { icon: <CheckCircle2 className="w-4 h-4 text-primary" />, text: "Configuración guardada" },
                  {
                    icon: <Circle className="w-4 h-4 text-muted-foreground" />,
                    text: "Actualizá las variables de entorno en tu servidor (.env)",
                  },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    {item.icon}
                    <span className="text-sm">{item.text}</span>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-xl bg-muted/40 border text-left text-sm mb-8">
                <p className="font-semibold mb-2">Archivo .env para tu servidor</p>
                <p className="text-muted-foreground mb-2">
                  Copiá estas variables al archivo <code className="bg-muted px-1 rounded">.env</code> de tu servidor:
                </p>
                <pre className="bg-card border rounded-lg p-3 text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all">
{`VITE_SUPABASE_URL=${dbConfig.url || "<tu-url>"}
VITE_SUPABASE_PUBLISHABLE_KEY=${dbConfig.anonKey ? dbConfig.anonKey.substring(0, 40) + "…" : "<tu-clave>"}
VITE_SUPABASE_PROJECT_ID=${dbConfig.projectId || "<tu-project-id>"}`}
                </pre>
              </div>

              <Button size="lg" className="w-full" onClick={handleFinish}>
                Ir al inicio de sesión
                <ShieldCheck className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Puerta Abierta Recreando — Sistema de Gestión Integral
        </p>
      </div>
    </div>
  );
}
