import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { UbicacionRecorrido, CENTRO_DEFECTO } from "./tipos";

export interface RecorridoMapa {
  id: string;
  etiquetaGrupo?: string;
  color: string;
  ubicaciones: UbicacionRecorrido[];
}

interface MapaRecorridoProps {
  recorridos: RecorridoMapa[];
  editable?: boolean;
  onMapClick?: (lat: number, lng: number) => void;
  onMarkerMove?: (ubicacionId: string, lat: number, lng: number) => void;
  altura?: string;
  centrarEn?: [number, number] | null;
}

const crearIcono = (numero: number, color: string, tipo: 'encuentro' | 'parada') =>
  L.divIcon({
    className: "",
    html: `<div style="background:${color};width:28px;height:28px;border-radius:${
      tipo === 'parada' ? '6px' : '50%'
    };display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;font-weight:700;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)">${numero}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });

const ClickHandler = ({ onMapClick }: { onMapClick?: (lat: number, lng: number) => void }) => {
  useMapEvents({
    click(e) {
      onMapClick?.(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

const AjustarVista = ({
  puntos,
  centrarEn,
}: {
  puntos: [number, number][];
  centrarEn?: [number, number] | null;
}) => {
  const map = useMap();

  useEffect(() => {
    if (centrarEn) {
      map.setView(centrarEn, Math.max(map.getZoom(), 16));
    }
  }, [centrarEn, map]);

  useEffect(() => {
    if (puntos.length === 1) {
      map.setView(puntos[0], Math.max(map.getZoom(), 15));
    } else if (puntos.length > 1) {
      map.fitBounds(L.latLngBounds(puntos), { padding: [40, 40] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puntos.length]);

  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 200);
    return () => clearTimeout(t);
  }, [map]);

  return null;
};

const MapaRecorrido = ({
  recorridos,
  editable = false,
  onMapClick,
  onMarkerMove,
  altura,
  centrarEn,
}: MapaRecorridoProps) => {
  const todosLosPuntos = useMemo(
    () =>
      recorridos.flatMap((r) => r.ubicaciones.map((u) => [u.lat, u.lng] as [number, number])),
    [recorridos]
  );

  const centro = todosLosPuntos[0] || CENTRO_DEFECTO;

  return (
    <div
      className={`w-full overflow-hidden rounded-lg border ${altura || "h-[300px] sm:h-[450px]"}`}
    >
      <MapContainer
        center={centro}
        zoom={todosLosPuntos.length ? 15 : 12}
        scrollWheelZoom
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <AjustarVista puntos={todosLosPuntos} centrarEn={centrarEn} />
        {editable && <ClickHandler onMapClick={onMapClick} />}

        {recorridos.map((recorrido) => {
          const ordenadas = [...recorrido.ubicaciones].sort((a, b) => a.orden - b.orden);
          const linea = ordenadas.map((u) => [u.lat, u.lng] as [number, number]);
          return (
            <div key={recorrido.id}>
              {linea.length > 1 && (
                <Polyline positions={linea} pathOptions={{ color: recorrido.color, weight: 4, opacity: 0.8 }} />
              )}
              {ordenadas.map((u, index) => (
                <Marker
                  key={u.id}
                  position={[u.lat, u.lng]}
                  icon={crearIcono(index + 1, recorrido.color, u.tipo)}
                  draggable={editable}
                  eventHandlers={{
                    dragend: (e) => {
                      const { lat, lng } = (e.target as L.Marker).getLatLng();
                      onMarkerMove?.(u.id, lat, lng);
                    },
                  }}
                >
                  <Popup>
                    <div className="text-sm space-y-1">
                      {recorrido.etiquetaGrupo && (
                        <p className="font-semibold">{recorrido.etiquetaGrupo}</p>
                      )}
                      <p className="font-medium">
                        {index + 1}. {u.etiqueta || (u.tipo === "parada" ? "Parada" : "Encuentro")}
                      </p>
                      {u.nota && <p className="text-muted-foreground">{u.nota}</p>}
                    </div>
                  </Popup>
                </Marker>
              ))}
            </div>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default MapaRecorrido;
