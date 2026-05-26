import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { calcularEdad, formatDate } from "@/lib/utils";
import type { HijoACargo } from "./HijosACargoEditor";

interface Props {
  hijos: HijoACargo[];
}

export const HijosACargoLista = ({ hijos }: Props) => {
  const lista = hijos || [];
  return (
    <div className="border rounded-lg p-4 bg-card">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold">Hijos/as a cargo</h4>
        <span className="text-xs text-muted-foreground">
          Total: {lista.length}
        </span>
      </div>
      {lista.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin detalle cargado.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Fecha nac.</TableHead>
              <TableHead>Edad</TableHead>
              <TableHead>CUIL</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lista.map((h) => {
              const edad = calcularEdad(h.fechaNacimiento);
              return (
                <TableRow key={h.id}>
                  <TableCell>{h.nombre || "—"}</TableCell>
                  <TableCell>{h.fechaNacimiento ? formatDate(h.fechaNacimiento) : "—"}</TableCell>
                  <TableCell>{edad !== null ? `${edad} años` : "—"}</TableCell>
                  <TableCell>{h.cuil || "—"}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
};
