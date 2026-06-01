import { forwardRef } from "react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { MessageSquare, UserCheck, FileText, Ban, Calendar } from "lucide-react";
import { type ReunionConAsignaciones, type RolReunion } from "@/lib/reunionesStore";

interface Props {
  mesActual: Date;
  reuniones: ReunionConAsignaciones[];
  numeroActaMap: Map<string, number>;
  getNombreProfesional: (id: string) => string;
}

const ROLES: { value: RolReunion; label: string; icon: React.ReactNode; bg: string; text: string }[] = [
  { value: 'reflexion', label: 'Reflexión', icon: <MessageSquare className="h-4 w-4" />, bg: '#dbeafe', text: '#1d4ed8' },
  { value: 'coordinacion', label: 'Coordinación', icon: <UserCheck className="h-4 w-4" />, bg: '#dcfce7', text: '#15803d' },
  { value: 'acta', label: 'Acta', icon: <FileText className="h-4 w-4" />, bg: '#f3e8ff', text: '#7e22ce' },
];

export const ExportableMonth = forwardRef<HTMLDivElement, Props>(
  ({ mesActual, reuniones, numeroActaMap, getNombreProfesional }, ref) => {
    return (
      <div
        ref={ref}
        style={{
          width: 900,
          padding: 40,
          background: 'linear-gradient(135deg, #fef3f8 0%, #f3e8ff 50%, #e0e7ff 100%)',
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
          color: '#1f2937',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            background: 'rgba(255,255,255,0.7)', padding: '8px 18px', borderRadius: 999,
            fontSize: 13, fontWeight: 600, color: '#7c3aed', marginBottom: 10,
          }}>
            <Calendar className="h-4 w-4" />
            Roles de Reuniones · Equipo Coordinador
          </div>
          <h1 style={{
            fontSize: 38, fontWeight: 800, margin: 0,
            textTransform: 'capitalize',
            background: 'linear-gradient(90deg, #db2777, #7c3aed, #2563eb)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            {format(mesActual, "MMMM 'de' yyyy", { locale: es })}
          </h1>
        </div>

        {/* Lista de reuniones */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {reuniones.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: '#6b7280', background: 'white', borderRadius: 16 }}>
              No hay reuniones programadas este mes
            </div>
          )}
          {reuniones.map((reunion) => {
            const numeroActa = numeroActaMap.get(reunion.id);
            const cancelada = reunion.estado === 'cancelada';
            return (
              <div
                key={reunion.id}
                style={{
                  background: 'white',
                  borderRadius: 18,
                  padding: 20,
                  boxShadow: '0 4px 20px -8px rgba(124,58,237,0.25)',
                  border: '1px solid rgba(124,58,237,0.08)',
                  opacity: cancelada ? 0.6 : 1,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 12,
                      background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
                      color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: 18,
                    }}>
                      {format(parseISO(reunion.fecha), 'd')}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 16, textTransform: 'capitalize' }}>
                        {format(parseISO(reunion.fecha), "EEEE d 'de' MMMM", { locale: es })}
                      </div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>Semana {reunion.semana_numero}</div>
                    </div>
                  </div>
                  {!cancelada && numeroActa && (
                    <div style={{
                      background: '#f3e8ff', color: '#7e22ce', padding: '6px 14px',
                      borderRadius: 999, fontSize: 13, fontWeight: 600,
                    }}>
                      Acta N° {numeroActa}
                    </div>
                  )}
                  {cancelada && (
                    <div style={{
                      background: '#fee2e2', color: '#b91c1c', padding: '6px 14px',
                      borderRadius: 999, fontSize: 13, fontWeight: 600,
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                    }}>
                      <Ban className="h-3 w-3" /> Cancelada
                    </div>
                  )}
                </div>

                {!cancelada && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                    {ROLES.map(rol => {
                      const a = reunion.asignaciones.find(x => x.rol === rol.value);
                      return (
                        <div key={rol.value} style={{
                          background: rol.bg, borderRadius: 12, padding: 12,
                          display: 'flex', flexDirection: 'column', gap: 4,
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: rol.text, fontSize: 12, fontWeight: 600 }}>
                            {rol.icon}
                            <span>{rol.label}</span>
                          </div>
                          <div style={{ fontSize: 15, fontWeight: 700, color: '#1f2937' }}>
                            {a ? getNombreProfesional(a.profesional_id) : 'Sin asignar'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {reunion.motivo_cancelacion && (
                  <div style={{ marginTop: 10, fontSize: 13, color: '#b91c1c' }}>
                    <strong>Motivo:</strong> {reunion.motivo_cancelacion}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ marginTop: 24, textAlign: 'center', fontSize: 11, color: '#9ca3af' }}>
          Generado el {format(new Date(), "d 'de' MMMM 'de' yyyy", { locale: es })}
        </div>
      </div>
    );
  }
);

ExportableMonth.displayName = 'ExportableMonth';
