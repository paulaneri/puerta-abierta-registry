import { useEffect, useRef, useState } from "react";
import { Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  getNovedadesPendientes,
  marcarNovedadesVistas,
  type Novedad,
} from "@/lib/novedades";

/**
 * Muestra en la Home las novedades de la plataforma que la persona todavía
 * no vio. Al cerrarlas —o al navegar a otra sección— quedan marcadas como
 * vistas y no vuelven a aparecer.
 */
export const NovedadesBanner = () => {
  const [novedades, setNovedades] = useState<Novedad[]>([]);
  const pendientesRef = useRef<string[]>([]);

  useEffect(() => {
    let activo = true;
    (async () => {
      const pendientes = await getNovedadesPendientes();
      if (!activo) return;
      setNovedades(pendientes);
      pendientesRef.current = pendientes.map((n) => n.id);

      // Se marcan vistas apenas se muestran: solo aparecen una vez por usuario
      void marcarNovedadesVistas(pendientesRef.current);
    })();
    return () => {
      activo = false;
    };
  }, []);

  if (novedades.length === 0) return null;

  const cerrar = () => {
    void marcarNovedadesVistas(pendientesRef.current);
    pendientesRef.current = [];
    setNovedades([]);
  };

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 shrink-0 rounded-full bg-primary/15 p-2">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">
              Novedades de la plataforma
            </p>
            <ul className="mt-2 space-y-1.5">
              {novedades.map((n) => (
                <li
                  key={n.id}
                  className="text-sm text-muted-foreground leading-relaxed break-words"
                >
                  • {n.mensaje}
                </li>
              ))}
            </ul>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0"
                onClick={cerrar}
                aria-label="Cerrar novedades"
              >
                <X className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Cerrar novedades</TooltipContent>
          </Tooltip>
        </div>
      </CardContent>
    </Card>
  );
};
