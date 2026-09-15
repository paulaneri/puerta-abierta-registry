export interface UbicacionRecorrido {
  id: string;
  tipo: 'encuentro' | 'parada';
  encuentroId?: number | null;
  etiqueta: string;
  lat: number;
  lng: number;
  orden: number;
  nota?: string;
}

// Centro por defecto: Ciudad de Buenos Aires
export const CENTRO_DEFECTO: [number, number] = [-34.6037, -58.3816];

export const parseUbicaciones = (data: any): UbicacionRecorrido[] => {
  if (!data) return [];
  let valor = data;
  if (typeof valor === 'string') {
    try {
      valor = JSON.parse(valor);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(valor)) return [];
  return (valor as any[])
    .filter((u) => u && typeof u.lat === 'number' && typeof u.lng === 'number')
    .map((u, i) => ({
      id: String(u.id ?? `${Date.now()}-${i}`),
      tipo: (u.tipo === 'parada' ? 'parada' : 'encuentro') as UbicacionRecorrido['tipo'],
      encuentroId: u.encuentroId ?? null,
      etiqueta: String(u.etiqueta ?? ''),
      lat: Number(u.lat),
      lng: Number(u.lng),
      orden: typeof u.orden === 'number' ? u.orden : i,
      nota: u.nota ? String(u.nota) : '',
    }))
    .sort((a, b) => a.orden - b.orden);
};
