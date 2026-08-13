// Genera un aviso por email para un evento usando el cliente de correo del
// dispositivo (mailto). No requiere configurar un dominio remitente.

interface ProfesionalMinimo {
  nombre?: string;
  apellido?: string;
  email?: string;
}

interface EventoAviso {
  titulo: string;
  descripcion?: string;
  fecha: string; // YYYY-MM-DD
  hora_inicio: string;
  hora_fin: string;
  lugar?: string;
  participantes: string[];
}

const normalizar = (valor: string) =>
  valor
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const formatearFecha = (fecha: string) => {
  const [year, month, day] = fecha.split('-').map(Number);
  if (!year || !month || !day) return fecha;
  return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
};

/** Devuelve los emails del equipo que coinciden con los participantes elegidos. */
export const obtenerEmailsParticipantes = (
  participantes: string[],
  profesionales: ProfesionalMinimo[],
): { emails: string[]; sinEmail: string[] } => {
  const emails: string[] = [];
  const sinEmail: string[] = [];

  participantes.forEach((participante) => {
    const objetivo = normalizar(participante);
    if (!objetivo) return;

    const match = profesionales.find((p) => {
      const completo = normalizar(`${p.nombre || ''} ${p.apellido || ''}`);
      return completo === objetivo || (!!p.email && normalizar(p.email) === objetivo);
    });

    if (match?.email) {
      if (!emails.includes(match.email)) emails.push(match.email);
    } else if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(participante.trim())) {
      if (!emails.includes(participante.trim())) emails.push(participante.trim());
    } else {
      sinEmail.push(participante.trim());
    }
  });

  return { emails, sinEmail };
};

/** Abre el cliente de correo con el aviso del evento prearmado. */
export const abrirAvisoEvento = (evento: EventoAviso, emails: string[]) => {
  const horario =
    evento.hora_inicio.substring(0, 5) === '00:00' && evento.hora_fin.substring(0, 5) === '23:59'
      ? 'Todo el día'
      : `${evento.hora_inicio.substring(0, 5)} a ${evento.hora_fin.substring(0, 5)}`;

  const cuerpo = [
    '¡Hola!',
    '',
    `Te avisamos del siguiente evento: ${evento.titulo}`,
    '',
    `Fecha: ${formatearFecha(evento.fecha)}`,
    `Horario: ${horario}`,
    evento.lugar ? `Lugar: ${evento.lugar}` : null,
    evento.descripcion ? `Detalle: ${evento.descripcion}` : null,
    '',
    'Puerta Abierta Recreando',
  ]
    .filter((linea) => linea !== null)
    .join('\n');

  const url =
    `mailto:?bcc=${encodeURIComponent(emails.join(','))}` +
    `&subject=${encodeURIComponent(`Evento: ${evento.titulo} - ${formatearFecha(evento.fecha)}`)}` +
    `&body=${encodeURIComponent(cuerpo)}`;

  window.location.href = url;
};
