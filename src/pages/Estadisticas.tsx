import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { TrendingUp, Users, Globe, Heart, Baby, Calendar, Phone, FileText, Building2, Download } from "lucide-react";
import { centroDiaStore } from "@/lib/centroDiaStore";
import { mujeresStore } from "@/lib/mujeresStore";
import { gastosStore } from "@/lib/gastosStore";
import { equipoStore } from "@/lib/equipoStore";
import { contactosStore } from "@/lib/contactosStore";
import { trabajoCampoStore } from "@/lib/trabajoCampoStore";
import { useRoles } from "@/hooks/useRoles";

const chartConfig = {
  cantidad: {
    label: "Cantidad",
    color: "hsl(var(--primary))",
  },
  acompanamientos: {
    label: "Acompañamientos",
    color: "hsl(var(--secondary))",
  },
  conHijos: {
    label: "Con Hijos",
    color: "hsl(var(--primary))",
  },
  sinHijos: {
    label: "Sin Hijos",
    color: "hsl(var(--accent))",
  },
  salidas: {
    label: "Salidas",
    color: "hsl(var(--primary))",
  },
  encuentros: {
    label: "Encuentros",
    color: "hsl(var(--secondary))",
  },
  mujeresNuevas: {
    label: "Mujeres Nuevas",
    color: "hsl(var(--accent))",
  },
  recibidas: {
    label: "Recibidas",
    color: "hsl(173, 80%, 40%)",
  },
  realizadas: {
    label: "Realizadas",
    color: "hsl(200, 80%, 40%)",
  },
  "18-25": {
    label: "18-25 años",
    color: "hsl(210, 100%, 75%)",
  },
  "26-35": {
    label: "26-35 años",
    color: "hsl(210, 100%, 60%)",
  },
  "36-45": {
    label: "36-45 años",
    color: "hsl(210, 100%, 45%)",
  },
  "46-55": {
    label: "46-55 años",
    color: "hsl(210, 100%, 30%)",
  },
  "56-65": {
    label: "56-65 años",
    color: "hsl(210, 100%, 20%)",
  },
  "66+": {
    label: "66+ años",
    color: "hsl(210, 100%, 10%)",
  },
  alfabetizadas: {
    label: "Alfabetizadas",
    color: "hsl(142, 76%, 36%)",
  },
  noAlfabetizadas: {
    label: "No Alfabetizadas",
    color: "hsl(0, 76%, 60%)",
  },
  conDocumentacion: {
    label: "Con Documentación",
    color: "hsl(142, 76%, 36%)",
  },
  sinDocumentacion: {
    label: "Sin Documentación",
    color: "hsl(0, 76%, 60%)",
  },
  viviendaTipo: {
    label: "Vivienda Tipo",
    color: "hsl(200, 70%, 50%)",
  },
  viviendaContrato: {
    label: "Vivienda Contrato",
    color: "hsl(220, 70%, 50%)",
  },
  ayudaHabitacional: {
    label: "Ayuda Habitacional",
    color: "hsl(30, 70%, 50%)",
  },
  coberturaSalud: {
    label: "Cobertura Salud",
    color: "hsl(160, 70%, 40%)",
  },
  aportePrevisional: {
    label: "Aporte Previsional",
    color: "hsl(270, 70%, 50%)",
  },
};

const Estadisticas = () => {
  const currentYear = new Date().getFullYear();
  const { userRole } = useRoles();
  const canViewGastos = userRole === 'administrador' || userRole === 'coordinador';

  const [estadisticasGenerales, setEstadisticasGenerales] = useState({
    // Current year stats
    totalMujeres: 0,
    totalContactos: 0,
    totalProfesionales: 0,
    totalGastos: 0,
    mujeresAnoActual: 0,
    trabajoCampoAnoActual: 0,
    mujeresConAcompanamiento: 0,
    contactosAnoActual: 0,
    mujeresAlfabetizadas: 0,
    tramitesRealizados: 0,
    llamadasRecibidas: 0,
    llamadasRealizadas: 0,
    entrevistasRealizadas: 0,

    // Year over year evolution data
    participantesPorAno: [] as any[],
    trabajoCampoPorAno: [] as any[],
    acompanamiento: [] as any[],
    contactosPorAno: [] as any[],
    salidasPorLugarPorAno: [] as any[],
    nacionalidadesPorAno: [] as any[],
    mujeresConHijosPorAno: [] as any[],
    rangoEdadPorAno: [] as any[],
    alfabetizacionPorAno: [] as any[],
    documentacionPorAno: [] as any[],
    tramitesPorAno: [] as any[],
    llamadasPorAno: [] as any[],
    gastosPorAno: [] as any[],
    gastosPorEtiqueta: [] as any[],
    gastosEtiquetas: [] as string[],
    entrevistasPorAno: [] as any[],
    viviendaTipoPorAno: [] as any[],
    viviendaContratoPorAno: [] as any[],
    ayudaHabitacionalPorAno: [] as any[],
    coberturaSaludPorAno: [] as any[],
    aportePrevisionalPorAno: [] as any[],
  });

  const [estadisticasCentroDia, setEstadisticasCentroDia] = useState({
    totalRegistros: 0,
    totalEntrevistas: 0,
    totalMujeresAsistieron: 0,
    totalLlamadasRecibidas: 0,
    totalLlamadasHechas: 0,
    registrosPorAno: [] as any[],
  });

  useEffect(() => {
    const loadStats = async () => {
      try {
        const mujeres = await mujeresStore.getMujeres();
        const contactos = await contactosStore.getContactos();
        const profesionales = await equipoStore.getProfesionales();
        const gastos = await gastosStore.getGastos();
        const trabajosCampo = await trabajoCampoStore.getTrabajosCampo();
        const registrosCentroDia = await centroDiaStore.getRegistros();

        // Current year statistics - all filtered by current year
        const mujeresAnoActual = mujeres.filter((m) => new Date(m.fechaRegistro).getFullYear() === currentYear);
        const registrosCentroDiaAnoActual = registrosCentroDia.filter((r) => new Date(r.fecha).getFullYear() === currentYear);
        const trabajosCampoAnoActual = trabajosCampo.filter((t) => new Date(t.fecha).getFullYear() === currentYear);
        const gastosAnoActual = gastos.filter((g) => new Date(g.fecha).getFullYear() === currentYear);
        const contactosAnoActualList = contactos.filter((c) => new Date(c.createdAt).getFullYear() === currentYear);

        // Acompañamientos del año actual (basado en fecha de acompañamiento)
        const mujeresConAcompanamiento = mujeres.filter(
          (m) => m.acompanamientos && m.acompanamientos.some((a) => new Date(a.fecha).getFullYear() === currentYear),
        ).length;

        // Mujeres alfabetizadas registradas en el año actual
        const mujeresAlfabetizadas = mujeresAnoActual.filter((m) => m.alfabetizada).length;

        // Trámites del año actual
        const tramitesRealizados =
          mujeresAnoActual.reduce((sum, m) => sum + (m.tramites_realizados?.length || 0), 0) +
          registrosCentroDiaAnoActual.reduce(
            (sum, registro) => sum + (registro.tramites?.reduce((total, t) => total + (t.cantidad || 0), 0) || 0),
            0,
          );

        // Llamadas del año actual (solo de centro de día que tiene fecha específica)
        const llamadasRecibidas = registrosCentroDiaAnoActual.reduce(
          (sum, registro) => sum + (registro.llamadasRecibidas?.length || 0), 0
        );
        const llamadasRealizadas = registrosCentroDiaAnoActual.reduce(
          (sum, registro) => sum + (registro.llamadasHechas?.length || 0), 0
        );

        // Entrevistas del año actual
        const entrevistasRealizadas = registrosCentroDiaAnoActual.reduce((sum, registro) => {
          return sum + (registro.mujeresAsistieron?.filter((m: any) => m.entrevistaRealizada)?.length || 0);
        }, 0);

        // Total gastos del año actual
        const totalGastosAnoActual = gastosAnoActual.reduce((sum, gasto) => sum + gasto.monto, 0);

        // Year over year evolution data
        const participantesPorAno = mujeres.reduce((acc: any, mujer) => {
          const ano = new Date(mujer.fechaRegistro).getFullYear().toString();
          if (!acc[ano]) acc[ano] = { ano, cantidad: 0 };
          acc[ano].cantidad += 1;
          return acc;
        }, {});

        const acompanamiento = mujeres.reduce((acc: any, mujer) => {
          (mujer.acompanamientos || []).forEach((acomp) => {
            const ano = new Date(acomp.fecha).getFullYear().toString();
            if (!acc[ano]) acc[ano] = { ano, cantidad: 0 };
            acc[ano].cantidad += 1;
          });
          return acc;
        }, {});

        const contactosPorAno = contactos.reduce((acc: any, contacto) => {
          const ano = new Date(contacto.createdAt).getFullYear().toString();
          if (!acc[ano]) acc[ano] = { ano, cantidad: 0 };
          acc[ano].cantidad += 1;
          return acc;
        }, {});

        // Primero recolectar todos los lugares únicos
        const lugaresUnicos = new Set<string>();
        trabajosCampo.forEach(trabajo => {
          lugaresUnicos.add(trabajo.lugar || "Sin especificar");
        });

        const salidasPorLugarPorAno = trabajosCampo.reduce((acc: any, trabajo) => {
          const ano = new Date(trabajo.fecha).getFullYear().toString();
          const lugar = trabajo.lugar || "Sin especificar";
          if (!acc[ano]) {
            acc[ano] = { ano };
            // Inicializar todos los lugares en 0 para cada año
            lugaresUnicos.forEach(l => acc[ano][l] = 0);
          }
          acc[ano][lugar] = (acc[ano][lugar] || 0) + 1;
          return acc;
        }, {});

        const trabajoCampoPorAno = trabajosCampo.reduce((acc: any, trabajo) => {
          const ano = new Date(trabajo.fecha).getFullYear().toString();
          if (!acc[ano]) acc[ano] = { ano, salidas: 0, encuentros: 0, mujeresNuevas: 0 };
          acc[ano].salidas += 1;
          acc[ano].encuentros += trabajo.encuentros?.length || 0;
          // Contar mujeres nuevas (no registradas)
          const encuentrosArray = Array.isArray(trabajo.encuentros) ? trabajo.encuentros : [];
          acc[ano].mujeresNuevas += encuentrosArray.filter((e: any) => e.esRegistrada === false).length;
          return acc;
        }, {});

        const nacionalidadesPorAno = mujeres.reduce((acc: any, mujer) => {
          const ano = new Date(mujer.fechaRegistro).getFullYear().toString();
          if (!acc[ano]) acc[ano] = { ano };
          const nacionalidad = mujer.nacionalidad || "Sin especificar";
          acc[ano][nacionalidad] = (acc[ano][nacionalidad] || 0) + 1;
          return acc;
        }, {});

        const mujeresConHijosPorAno = mujeres.reduce((acc: any, mujer) => {
          const ano = new Date(mujer.fechaRegistro).getFullYear().toString();
          if (!acc[ano]) acc[ano] = { ano, conHijos: 0, sinHijos: 0 };
          if (mujer.hijosACargo) acc[ano].conHijos += 1;
          else acc[ano].sinHijos += 1;
          return acc;
        }, {});

        const rangoEdadPorAno = mujeres.reduce((acc: any, mujer) => {
          const ano = new Date(mujer.fechaRegistro).getFullYear().toString();
          if (!acc[ano]) acc[ano] = { ano, "18-25": 0, "26-35": 0, "36-45": 0, "46-55": 0, "56-65": 0, "66+": 0 };

          const edad = mujer.fechaNacimiento
            ? new Date().getFullYear() - new Date(mujer.fechaNacimiento).getFullYear()
            : null;

          if (edad && edad >= 18 && edad <= 25) acc[ano]["18-25"] += 1;
          else if (edad && edad >= 26 && edad <= 35) acc[ano]["26-35"] += 1;
          else if (edad && edad >= 36 && edad <= 45) acc[ano]["36-45"] += 1;
          else if (edad && edad >= 46 && edad <= 55) acc[ano]["46-55"] += 1;
          else if (edad && edad >= 56 && edad <= 65) acc[ano]["56-65"] += 1;
          else if (edad && edad >= 66) acc[ano]["66+"] += 1;

          return acc;
        }, {});

        const alfabetizacionPorAno = mujeres.reduce((acc: any, mujer) => {
          const ano = new Date(mujer.fechaRegistro).getFullYear().toString();
          if (!acc[ano]) acc[ano] = { ano, alfabetizadas: 0, noAlfabetizadas: 0 };
          if (mujer.alfabetizada) acc[ano].alfabetizadas += 1;
          else acc[ano].noAlfabetizadas += 1;
          return acc;
        }, {});

        const documentacionPorAno = mujeres.reduce((acc: any, mujer) => {
          const ano = new Date(mujer.fechaRegistro).getFullYear().toString();
          if (!acc[ano]) acc[ano] = { ano, conDocumentacion: 0, sinDocumentacion: 0 };
          if (mujer.tieneDocumentacion) acc[ano].conDocumentacion += 1;
          else acc[ano].sinDocumentacion += 1;
          return acc;
        }, {});

        const tramitesPorAno = mujeres.reduce((acc: any, mujer) => {
          const ano = new Date(mujer.fechaRegistro).getFullYear().toString();
          if (!acc[ano]) acc[ano] = { ano, cantidad: 0 };
          acc[ano].cantidad += mujer.tramites_realizados?.length || 0;
          return acc;
        }, {});

        // Agregar trámites de centro de día por fecha real
        registrosCentroDia.forEach((registro) => {
          const ano = new Date(registro.fecha).getFullYear().toString();
          if (!tramitesPorAno[ano]) tramitesPorAno[ano] = { ano, cantidad: 0 };
          const tramitesCentroDia = registro.tramites?.reduce((total, t) => total + (t.cantidad || 0), 0) || 0;
          tramitesPorAno[ano].cantidad += tramitesCentroDia;
        });

        // Calcular llamadas solo de centro de día (tienen fecha específica)
        const llamadasPorAno = registrosCentroDia.reduce((acc: any, registro) => {
          const ano = new Date(registro.fecha).getFullYear().toString();
          if (!acc[ano]) acc[ano] = { ano, recibidas: 0, realizadas: 0 };
          acc[ano].recibidas += registro.llamadasRecibidas?.length || 0;
          acc[ano].realizadas += registro.llamadasHechas?.length || 0;
          return acc;
        }, {});

        // Recopilar todas las etiquetas únicas
        const todasEtiquetas = [...new Set(gastos.map((g: any) => g.etiqueta || 'Sin etiqueta'))];

        const gastosPorAno = gastos.reduce((acc: any, gasto) => {
          const ano = new Date(gasto.fecha).getFullYear().toString();
          const etiquetaKey = gasto.etiqueta || 'Sin etiqueta';
          if (!acc[ano]) { acc[ano] = { ano, monto: 0, cantidad: 0 }; todasEtiquetas.forEach(e => { acc[ano][e] = 0; }); }
          acc[ano].monto += gasto.monto;
          acc[ano].cantidad += 1;
          acc[ano][etiquetaKey] = (acc[ano][etiquetaKey] || 0) + gasto.monto;
          return acc;
        }, {});

        // Gastos del año actual por etiqueta (para gráfico de torta)
        const gastosPorEtiquetaMap = gastosAnoActual.reduce((acc: any, gasto) => {
          const etiqueta = gasto.etiqueta || 'Sin etiqueta';
          if (!acc[etiqueta]) acc[etiqueta] = { name: etiqueta, value: 0 };
          acc[etiqueta].value += gasto.monto;
          return acc;
        }, {});
        const gastosPorEtiqueta = Object.values(gastosPorEtiquetaMap).sort((a: any, b: any) => b.value - a.value);

        // Entrevistas por año
        const entrevistasPorAno = registrosCentroDia.reduce((acc: any, registro) => {
          const ano = new Date(registro.fecha).getFullYear().toString();
          if (!acc[ano]) acc[ano] = { ano, cantidad: 0 };
          acc[ano].cantidad += registro.mujeresAsistieron?.filter((m: any) => m.entrevistaRealizada)?.length || 0;
          return acc;
        }, {});

        // Evolución de nuevos campos sociales
        const buildCategoryByYear = (field: string, labelMap: Record<string, string>) => {
          return mujeres.reduce((acc: any, mujer) => {
            const ano = new Date(mujer.fechaRegistro).getFullYear().toString();
            if (!acc[ano]) {
              acc[ano] = { ano };
              Object.values(labelMap).forEach(label => acc[ano][label] = 0);
            }
            const val = (mujer as any)[field] || '';
            const label = labelMap[val] || 'Sin dato';
            acc[ano][label] = (acc[ano][label] || 0) + 1;
            return acc;
          }, {});
        };

        const viviendaTipoPorAno = buildCategoryByYear('viviendaTipo', {
          'casa': 'Casa', 'departamento': 'Departamento', 'hotel-familiar': 'Hotel Familiar', '': 'Sin dato', 'sin-dato': 'Sin dato'
        });
        const viviendaContratoPorAno = buildCategoryByYear('viviendaContrato', {
          'alquilado': 'Alquilado', 'hotel-tomado': 'Hotel tomado', 'propietaria': 'Propietaria', '': 'Sin dato', 'sin-dato': 'Sin dato'
        });
        const ayudaHabitacionalPorAno = buildCategoryByYear('ayudaHabitacional', {
          'no': 'No', 'amparo': 'Amparo', 'subsidio': 'Subsidio', 'sim': 'Sí', '': 'Sin dato', 'sin-dato': 'Sin dato'
        });
        const coberturaSaludPorAno = buildCategoryByYear('coberturaSalud', {
          'publico': 'Público', 'prepaga': 'Prepaga', 'obra-social': 'Obra Social', '': 'Sin dato', 'sin-dato': 'Sin dato'
        });
        const aportePrevisionalPorAno = buildCategoryByYear('aportePrevisional', {
          'monotributo': 'Monotributo', 'jubilacion': 'Jubilación', 'no': 'No', 'pensionada': 'Pensionada', '': 'Sin dato', 'sin-dato': 'Sin dato'
        });

        // Centro de día statistics - filtered by current year
        const totalEntrevistasCentroDia = registrosCentroDiaAnoActual.reduce((sum, registro) => {
          return sum + (registro.mujeresAsistieron?.filter((m) => m.entrevistaRealizada)?.length || 0);
        }, 0);

        const totalMujeresAsistieron = registrosCentroDiaAnoActual.reduce((sum, registro) => {
          return sum + (registro.mujeresAsistieron?.length || 0);
        }, 0);

        const totalLlamadasRecibidasCentroDia = registrosCentroDiaAnoActual.reduce(
          (sum, registro) => sum + (registro.llamadasRecibidas?.length || 0),
          0,
        );
        const totalLlamadasHechasCentroDia = registrosCentroDiaAnoActual.reduce(
          (sum, registro) => sum + (registro.llamadasHechas?.length || 0),
          0,
        );

        const registrosPorAno = registrosCentroDia.reduce((acc: any, registro) => {
          const ano = new Date(registro.fecha).getFullYear().toString();
          if (!acc[ano]) {
            acc[ano] = {
              ano,
              registros: 0,
              entrevistas: 0,
              mujeresAsistieron: 0,
              llamadasRecibidas: 0,
              llamadasHechas: 0,
            };
          }

          acc[ano].registros += 1;
          acc[ano].entrevistas += registro.mujeresAsistieron?.filter((m) => m.entrevistaRealizada)?.length || 0;
          acc[ano].mujeresAsistieron += registro.mujeresAsistieron?.length || 0;
          acc[ano].llamadasRecibidas += registro.llamadasRecibidas?.length || 0;
          acc[ano].llamadasHechas += registro.llamadasHechas?.length || 0;

          return acc;
        }, {});

        setEstadisticasCentroDia({
          totalRegistros: registrosCentroDiaAnoActual.length,
          totalEntrevistas: totalEntrevistasCentroDia,
          totalMujeresAsistieron,
          totalLlamadasRecibidas: totalLlamadasRecibidasCentroDia,
          totalLlamadasHechas: totalLlamadasHechasCentroDia,
          registrosPorAno: Object.values(registrosPorAno),
        });

        setEstadisticasGenerales({
          totalMujeres: mujeres.length,
          totalContactos: contactos.length,
          totalProfesionales: profesionales.filter((p) => p.estado === "activo").length,
          totalGastos: totalGastosAnoActual,
          mujeresAnoActual: mujeresAnoActual.length,
          trabajoCampoAnoActual: trabajosCampoAnoActual.length,
          mujeresConAcompanamiento,
          contactosAnoActual: contactosAnoActualList.length,
          mujeresAlfabetizadas,
          tramitesRealizados,
          llamadasRecibidas,
          llamadasRealizadas,
          entrevistasRealizadas,

          participantesPorAno: Object.values(participantesPorAno).sort((a: any, b: any) => a.ano.localeCompare(b.ano)),
          trabajoCampoPorAno: Object.values(trabajoCampoPorAno).sort((a: any, b: any) => a.ano.localeCompare(b.ano)),
          acompanamiento: Object.values(acompanamiento).sort((a: any, b: any) => a.ano.localeCompare(b.ano)),
          contactosPorAno: Object.values(contactosPorAno).sort((a: any, b: any) => a.ano.localeCompare(b.ano)),
          salidasPorLugarPorAno: Object.values(salidasPorLugarPorAno).sort((a: any, b: any) =>
            a.ano.localeCompare(b.ano),
          ),
          nacionalidadesPorAno: Object.values(nacionalidadesPorAno).sort((a: any, b: any) =>
            a.ano.localeCompare(b.ano),
          ),
          mujeresConHijosPorAno: Object.values(mujeresConHijosPorAno).sort((a: any, b: any) =>
            a.ano.localeCompare(b.ano),
          ),
          rangoEdadPorAno: Object.values(rangoEdadPorAno).sort((a: any, b: any) => a.ano.localeCompare(b.ano)),
          alfabetizacionPorAno: Object.values(alfabetizacionPorAno).sort((a: any, b: any) =>
            a.ano.localeCompare(b.ano),
          ),
          documentacionPorAno: Object.values(documentacionPorAno).sort((a: any, b: any) =>
            a.ano.localeCompare(b.ano),
          ),
          tramitesPorAno: Object.values(tramitesPorAno).sort((a: any, b: any) => a.ano.localeCompare(b.ano)),
          llamadasPorAno: Object.values(llamadasPorAno).sort((a: any, b: any) => a.ano.localeCompare(b.ano)),
          gastosPorAno: Object.values(gastosPorAno).sort((a: any, b: any) => a.ano.localeCompare(b.ano)),
          gastosPorEtiqueta,
          gastosEtiquetas: todasEtiquetas,
          entrevistasPorAno: Object.values(entrevistasPorAno).sort((a: any, b: any) => a.ano.localeCompare(b.ano)),
          viviendaTipoPorAno: Object.values(viviendaTipoPorAno).sort((a: any, b: any) => a.ano.localeCompare(b.ano)),
          viviendaContratoPorAno: Object.values(viviendaContratoPorAno).sort((a: any, b: any) => a.ano.localeCompare(b.ano)),
          ayudaHabitacionalPorAno: Object.values(ayudaHabitacionalPorAno).sort((a: any, b: any) => a.ano.localeCompare(b.ano)),
          coberturaSaludPorAno: Object.values(coberturaSaludPorAno).sort((a: any, b: any) => a.ano.localeCompare(b.ano)),
          aportePrevisionalPorAno: Object.values(aportePrevisionalPorAno).sort((a: any, b: any) => a.ano.localeCompare(b.ano)),
        });
      } catch (error) {
        console.error("Error loading statistics:", error);
      }
    };

    loadStats();
  }, [currentYear]);

  const exportarEvolucionExcel = () => {
    const { participantesPorAno, acompanamiento, contactosPorAno, trabajoCampoPorAno,
      llamadasPorAno, tramitesPorAno, entrevistasPorAno, gastosPorAno } = estadisticasGenerales;
    const { registrosPorAno } = estadisticasCentroDia;

    // Recolectar todos los años únicos
    const anosSet = new Set<string>();
    [...participantesPorAno, ...acompanamiento, ...contactosPorAno, ...trabajoCampoPorAno,
     ...llamadasPorAno, ...tramitesPorAno, ...entrevistasPorAno, ...gastosPorAno, ...registrosPorAno]
      .forEach((r: any) => anosSet.add(r.ano));
    const anos = Array.from(anosSet).sort();

    const toMap = (arr: any[], key: string) => Object.fromEntries(arr.map((r: any) => [r.ano, r[key] ?? 0]));
    const participantesMap = toMap(participantesPorAno, 'cantidad');
    const acompMap = toMap(acompanamiento, 'cantidad');
    const contactosMap = toMap(contactosPorAno, 'cantidad');
    const tcSalidasMap = toMap(trabajoCampoPorAno, 'salidas');
    const tcEncuentrosMap = toMap(trabajoCampoPorAno, 'encuentros');
    const llamRecibMap = toMap(llamadasPorAno, 'recibidas');
    const llamRealMap = toMap(llamadasPorAno, 'realizadas');
    const tramitesMap = toMap(tramitesPorAno, 'cantidad');
    const entrevistasMap = toMap(entrevistasPorAno, 'cantidad');
    const gastosMap = toMap(gastosPorAno, 'monto');
    const cdRegistrosMap = toMap(registrosPorAno, 'registros');
    const cdEntrevistasMap = toMap(registrosPorAno, 'entrevistas');
    const cdAsistieronMap = toMap(registrosPorAno, 'mujeresAsistieron');

    const headers = ['Año', 'Mujeres Nuevas', 'Acompañamientos', 'Contactos', 'Salidas Campo',
      'Encuentros Campo', 'Llamadas Recibidas', 'Llamadas Realizadas', 'Trámites',
      'Entrevistas', 'Gastos ($)', 'CD Registros', 'CD Entrevistas', 'CD Asistencias'];

    const rows = anos.map(ano => [
      ano,
      participantesMap[ano] ?? 0,
      acompMap[ano] ?? 0,
      contactosMap[ano] ?? 0,
      tcSalidasMap[ano] ?? 0,
      tcEncuentrosMap[ano] ?? 0,
      llamRecibMap[ano] ?? 0,
      llamRealMap[ano] ?? 0,
      tramitesMap[ano] ?? 0,
      entrevistasMap[ano] ?? 0,
      gastosMap[ano] ?? 0,
      cdRegistrosMap[ano] ?? 0,
      cdEntrevistasMap[ano] ?? 0,
      cdAsistieronMap[ano] ?? 0,
    ]);

    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `evolucion_anual.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 w-full overflow-x-hidden">
      {/* Header */}
      <header className="bg-card shadow-lg border-b">
        <div className="w-full px-2 sm:px-4 md:px-6 lg:px-8 py-4 md:py-6 max-w-7xl mx-auto">
          <div className="flex items-center gap-2 sm:gap-3">
            <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Estadísticas del Centro
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">Análisis de datos anuales</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full px-2 sm:px-4 md:px-6 lg:px-8 py-4 md:py-8 max-w-7xl mx-auto">
        {/* KPIs Summary - Current Year */}
        <div className="mb-4">
          <h2 className="text-xl font-bold text-foreground mb-4">Estadísticas del Año {currentYear}</h2>
        </div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-4 mb-8">
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 min-h-[140px] flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-primary">Mujeres {currentYear}</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{estadisticasGenerales.mujeresAnoActual}</div>
              <p className="text-xs text-muted-foreground">Nuevas participantes</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20 min-h-[140px] flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-accent">Acompañamientos</CardTitle>
              <Heart className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">{estadisticasGenerales.mujeresConAcompanamiento}</div>
              <p className="text-xs text-muted-foreground">Mujeres acompañadas</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 min-h-[140px] flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700">Alfabetizadas</CardTitle>
              <FileText className="h-4 w-4 text-blue-700" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700">{estadisticasGenerales.mujeresAlfabetizadas}</div>
              <p className="text-xs text-muted-foreground">Mujeres alfabetizadas</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-secondary/5 to-secondary/10 border-secondary/20 min-h-[140px] flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-secondary">Trabajo Campo</CardTitle>
              <Building2 className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-secondary">{estadisticasGenerales.trabajoCampoAnoActual}</div>
              <p className="text-xs text-muted-foreground">Salidas realizadas</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 min-h-[140px] flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-700">Contactos {currentYear}</CardTitle>
              <Building2 className="h-4 w-4 text-green-700" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700">{estadisticasGenerales.contactosAnoActual}</div>
              <p className="text-xs text-muted-foreground">Nuevos contactos</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 min-h-[140px] flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-700">Trámites</CardTitle>
              <FileText className="h-4 w-4 text-purple-700" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-700">{estadisticasGenerales.tramitesRealizados}</div>
              <p className="text-xs text-muted-foreground">Trámites realizados</p>
            </CardContent>
          </Card>

          {canViewGastos && (
            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 min-h-[140px] flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-orange-700">Total Gastos</CardTitle>
                <FileText className="h-4 w-4 text-orange-700" />
              </CardHeader>
              <CardContent>
                <div className={`font-bold text-orange-700 break-all leading-tight ${formatCurrency(estadisticasGenerales.totalGastos).length > 10 ? 'text-lg' : 'text-2xl'}`}>
                  ${formatCurrency(estadisticasGenerales.totalGastos)}
                </div>
                <p className="text-xs text-muted-foreground">Inversión total</p>
              </CardContent>
            </Card>
          )}

          <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200 min-h-[140px] flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-indigo-700">Total Profesionales</CardTitle>
              <Users className="h-4 w-4 text-indigo-700" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-indigo-700">{estadisticasGenerales.totalProfesionales}</div>
              <p className="text-xs text-muted-foreground">Equipo activo</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 min-h-[140px] flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700">Centro de Día - Registros</CardTitle>
              <Calendar className="h-4 w-4 text-blue-700" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700">{estadisticasCentroDia.totalRegistros}</div>
              <p className="text-xs text-muted-foreground">Total registros</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 min-h-[140px] flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-700">Entrevistas</CardTitle>
              <Users className="h-4 w-4 text-purple-700" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-700">{estadisticasCentroDia.totalEntrevistas}</div>
              <p className="text-xs text-muted-foreground">Entrevistas realizadas</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 min-h-[140px] flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-700">Asistencias</CardTitle>
              <Users className="h-4 w-4 text-orange-700" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-700">{estadisticasCentroDia.totalMujeresAsistieron}</div>
              <p className="text-xs text-muted-foreground">Mujeres asistieron</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200 min-h-[140px] flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-teal-700">Llamadas Recibidas</CardTitle>
              <Phone className="h-4 w-4 text-teal-700" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-teal-700">{estadisticasCentroDia.totalLlamadasRecibidas}</div>
              <p className="text-xs text-muted-foreground">Total recibidas</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200 min-h-[140px] flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-indigo-700">Llamadas Realizadas</CardTitle>
              <Phone className="h-4 w-4 text-indigo-700" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-indigo-700">{estadisticasCentroDia.totalLlamadasHechas}</div>
              <p className="text-xs text-muted-foreground">Total realizadas</p>
            </CardContent>
          </Card>
        </div>

        {/* Evolution Charts Section */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">Evolución Año a Año</h2>
          <Button variant="outline" size="sm" onClick={exportarEvolucionExcel} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Exportar a Excel
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
          {/* Participantes por Año */}
          {estadisticasGenerales.participantesPorAno.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Mujeres Participantes
                </CardTitle>
                <CardDescription>Evolución anual del número de mujeres participantes</CardDescription>
              </CardHeader>
              <CardContent className="px-2 sm:px-6">
                <ChartContainer config={chartConfig}>
                  <ResponsiveContainer width="100%" height={250} minWidth={0}>
                    <BarChart data={estadisticasGenerales.participantesPorAno}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="ano" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="cantidad" fill="var(--color-cantidad)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          )}

          {/* Acompañamientos por Año */}
          {estadisticasGenerales.acompanamiento.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-accent" />
                  Mujeres con Acompañamiento
                </CardTitle>
                <CardDescription>Evolución de acompañamientos realizados</CardDescription>
              </CardHeader>
              <CardContent className="px-2 sm:px-6">
                <ChartContainer config={chartConfig}>
                  <ResponsiveContainer width="100%" height={250} minWidth={0}>
                    <BarChart data={estadisticasGenerales.acompanamiento}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="ano" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="cantidad" fill="var(--color-acompanamientos)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          )}

          {/* Contactos por Año */}
          {estadisticasGenerales.contactosPorAno.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-green-600" />
                  Contactos por Año
                </CardTitle>
                <CardDescription>Nuevos contactos registrados anualmente</CardDescription>
              </CardHeader>
              <CardContent className="px-2 sm:px-6">
                <ChartContainer config={chartConfig}>
                  <ResponsiveContainer width="100%" height={250} minWidth={0}>
                    <BarChart data={estadisticasGenerales.contactosPorAno}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="ano" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="cantidad" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          )}
          {/* Trabajo de Campo por Año */}
          {estadisticasGenerales.trabajoCampoPorAno.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-secondary" />
                  Mujeres en Trabajo de Campo
                </CardTitle>
                <CardDescription>Salidas, encuentros y mujeres nuevas contactadas por año</CardDescription>
              </CardHeader>
              <CardContent className="px-2 sm:px-6">
                <ChartContainer config={chartConfig}>
                  <ResponsiveContainer width="100%" height={250} minWidth={0}>
                    <BarChart data={estadisticasGenerales.trabajoCampoPorAno}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="ano" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Bar dataKey="salidas" stackId="a" fill="var(--color-cantidad)" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="encuentros" stackId="a" fill="var(--color-acompanamientos)" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="mujeresNuevas" stackId="a" fill="var(--color-mujeresNuevas)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          )}
          {/* Salidas por Lugar */}
          {estadisticasGenerales.salidasPorLugarPorAno.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-blue-600" />
                  Salidas a Trabajo de Campo por Lugar
                </CardTitle>
                <CardDescription>Distribución geográfica de actividades</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={
                    estadisticasGenerales.salidasPorLugarPorAno.length > 0
                      ? (() => {
                          // Recolectar todos los lugares únicos de todos los años
                          const lugaresUnicos = new Set<string>();
                          estadisticasGenerales.salidasPorLugarPorAno.forEach((yearData: any) => {
                            Object.keys(yearData).forEach(key => {
                              if (key !== "ano") lugaresUnicos.add(key);
                            });
                          });
                          // Crear config para cada lugar
                          return Array.from(lugaresUnicos).reduce(
                            (acc, lugar, index) => ({
                              ...acc,
                              [lugar]: {
                                label: lugar,
                                color: `hsl(${210 + index * 30}, 70%, ${50 + index * 5}%)`,
                              },
                            }),
                            {},
                          );
                        })()
                      : {}
                  }
                >
                  <ResponsiveContainer width="100%" height={250} minWidth={0}>
                    <BarChart data={estadisticasGenerales.salidasPorLugarPorAno}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="ano" />
                      <YAxis />
                      <ChartTooltip
                        content={({ active, payload, label }) => {
                          if (!active || !payload) return null;
                          return (
                            <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                              <p className="font-medium">{`Año: ${label}`}</p>
                              {payload.map(
                                (entry, index) =>
                                  entry.dataKey !== "ano" &&
                                  typeof entry.value === "number" &&
                                  entry.value > 0 && (
                                    <p key={index} className="text-sm" style={{ color: entry.color }}>
                                      {`${entry.dataKey}: ${entry.value} salidas`}
                                    </p>
                                  ),
                              )}
                            </div>
                          );
                        }}
                      />
                      <ChartLegend content={<ChartLegendContent />} />
                      {estadisticasGenerales.salidasPorLugarPorAno.length > 0 &&
                        (() => {
                          // Recolectar todos los lugares únicos de todos los años
                          const lugaresUnicos = new Set<string>();
                          estadisticasGenerales.salidasPorLugarPorAno.forEach((yearData: any) => {
                            Object.keys(yearData).forEach(key => {
                              if (key !== "ano") lugaresUnicos.add(key);
                            });
                          });
                          const lugaresArray = Array.from(lugaresUnicos);
                          return lugaresArray.map((lugar, index) => (
                            <Bar
                              key={lugar}
                              dataKey={lugar}
                              stackId="salidas"
                              fill={`hsl(${210 + index * 30}, 70%, ${50 + index * 5}%)`}
                              name={lugar}
                              radius={
                                index === lugaresArray.length - 1
                                  ? [4, 4, 0, 0]
                                  : [0, 0, 0, 0]
                              }
                            />
                          ));
                        })()}
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          )}

          {/* Mujeres con Hijos por Año */}
          {estadisticasGenerales.mujeresConHijosPorAno.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Baby className="h-5 w-5 text-pink-600" />
                  Mujeres con Hijos a Cargo
                </CardTitle>
                <CardDescription>Evolución de mujeres con hijos registradas</CardDescription>
              </CardHeader>
              <CardContent className="px-2 sm:px-6">
                <ChartContainer config={chartConfig}>
                  <ResponsiveContainer width="100%" height={250} minWidth={0}>
                    <BarChart data={estadisticasGenerales.mujeresConHijosPorAno}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="ano" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Bar dataKey="conHijos" stackId="a" fill="var(--color-conHijos)" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="sinHijos" stackId="a" fill="var(--color-sinHijos)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          )}

          {/* Rangos de Edad */}
          {estadisticasGenerales.rangoEdadPorAno.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-600" />
                  Rangos de Edad de las Mujeres
                </CardTitle>
                <CardDescription>Distribución etaria por año</CardDescription>
              </CardHeader>
              <CardContent className="px-2 sm:px-6">
                <ChartContainer config={chartConfig}>
                  <ResponsiveContainer width="100%" height={250} minWidth={0}>
                    <BarChart data={estadisticasGenerales.rangoEdadPorAno}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="ano" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Bar dataKey="18-25" stackId="a" fill="hsl(210, 100%, 75%)" name="18-25 años" />
                      <Bar dataKey="26-35" stackId="a" fill="hsl(210, 100%, 60%)" name="26-35 años" />
                      <Bar dataKey="36-45" stackId="a" fill="hsl(210, 100%, 45%)" name="36-45 años" />
                      <Bar dataKey="46-55" stackId="a" fill="hsl(210, 100%, 30%)" name="46-55 años" />
                      <Bar dataKey="56-65" stackId="a" fill="hsl(210, 100%, 20%)" name="56-65 años" />
                      <Bar dataKey="66+" stackId="a" fill="hsl(210, 100%, 10%)" name="66+ años" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          )}

          {/* Mujeres Alfabetizadas */}
          {estadisticasGenerales.alfabetizacionPorAno.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-indigo-600" />
                  Mujeres Alfabetizadas
                </CardTitle>
                <CardDescription>Evolución de la alfabetización</CardDescription>
              </CardHeader>
              <CardContent className="px-2 sm:px-6">
                <ChartContainer config={chartConfig}>
                  <ResponsiveContainer width="100%" height={250} minWidth={0}>
                    <BarChart data={estadisticasGenerales.alfabetizacionPorAno}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="ano" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Bar dataKey="alfabetizadas" stackId="a" fill="hsl(142, 76%, 36%)" name="Alfabetizadas" />
                      <Bar dataKey="noAlfabetizadas" stackId="a" fill="hsl(0, 76%, 60%)" name="No Alfabetizadas" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          )}

          {/* Documentación */}
          {estadisticasGenerales.documentacionPorAno.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-teal-600" />
                  Documentación
                </CardTitle>
                <CardDescription>Participantes con y sin documentación por año</CardDescription>
              </CardHeader>
              <CardContent className="px-2 sm:px-6">
                <ChartContainer config={chartConfig}>
                  <ResponsiveContainer width="100%" height={250} minWidth={0}>
                    <BarChart data={estadisticasGenerales.documentacionPorAno}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="ano" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Bar dataKey="conDocumentacion" stackId="a" fill="hsl(142, 76%, 36%)" name="Sí" />
                      <Bar dataKey="sinDocumentacion" stackId="a" fill="hsl(0, 76%, 60%)" name="No" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          )}

          {estadisticasGenerales.tramitesPorAno.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-orange-600" />
                  Trámites Realizados
                </CardTitle>
                <CardDescription>Trámites gestionados por año</CardDescription>
              </CardHeader>
              <CardContent className="px-2 sm:px-6">
                <ChartContainer config={chartConfig}>
                  <ResponsiveContainer width="100%" height={250} minWidth={0}>
                    <BarChart data={estadisticasGenerales.tramitesPorAno}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="ano" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="cantidad" fill="hsl(25, 95%, 53%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          )}

          {/* Llamadas por Año */}
          {estadisticasGenerales.llamadasPorAno.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5 text-teal-600" />
                  Llamadas Recibidas y Realizadas
                </CardTitle>
                <CardDescription>Actividad telefónica por año</CardDescription>
              </CardHeader>
              <CardContent className="px-2 sm:px-6">
                <ChartContainer config={chartConfig}>
                  <ResponsiveContainer width="100%" height={250} minWidth={0}>
                    <BarChart data={estadisticasGenerales.llamadasPorAno}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="ano" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Bar dataKey="recibidas" stackId="a" fill="hsl(173, 80%, 40%)" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="realizadas" stackId="a" fill="hsl(200, 80%, 40%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          )}

          {/* Entrevistas por Año */}
          {estadisticasGenerales.entrevistasPorAno.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-pink-600" />
                  Entrevistas Realizadas
                </CardTitle>
                <CardDescription>Entrevistas realizadas por año</CardDescription>
              </CardHeader>
              <CardContent className="px-2 sm:px-6">
                <ChartContainer config={chartConfig}>
                  <ResponsiveContainer width="100%" height={250} minWidth={0}>
                    <BarChart data={estadisticasGenerales.entrevistasPorAno}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="ano" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="cantidad" fill="hsl(340, 82%, 52%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          )}

        {/* Gastos por Año - Barras apiladas por etiqueta */}
          {canViewGastos && estadisticasGenerales.gastosPorAno.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-secondary" />
                  Gastos por Año
                </CardTitle>
                <CardDescription>Evolución del presupuesto ejecutado anualmente por etiqueta</CardDescription>
              </CardHeader>
              <CardContent className="px-2 sm:px-6">
                <ChartContainer config={
                  estadisticasGenerales.gastosEtiquetas.reduce((acc: any, etq: string, index: number) => ({
                    ...acc,
                    [etq]: { label: etq, color: `hsl(${(index * 67 + 200) % 360}, 65%, 50%)` }
                  }), {})
                }>
                  <ResponsiveContainer width="100%" height={280} minWidth={0}>
                    <BarChart data={estadisticasGenerales.gastosPorAno}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="ano" />
                      <YAxis tickFormatter={(v) => `$${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} />
                      <ChartTooltip
                        formatter={(value: number, name: string) => [`$${formatCurrency(value)}`, name]}
                        content={<ChartTooltipContent />}
                      />
                      <ChartLegend content={<ChartLegendContent />} />
                      {estadisticasGenerales.gastosEtiquetas.map((etq: string, index: number) => (
                        <Bar key={etq} dataKey={etq} stackId="a" fill={`hsl(${(index * 67 + 200) % 360}, 65%, 50%)`} radius={index === estadisticasGenerales.gastosEtiquetas.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]} />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          )}
          {/* Gráfico de Nacionalidades por Año */}
          {estadisticasGenerales.nacionalidadesPorAno.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-emerald-600" />
                  Nacionalidades por Año
                </CardTitle>
                <CardDescription>Distribución de nacionalidades de participantes</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={
                    estadisticasGenerales.nacionalidadesPorAno.length > 0
                      ? Object.keys(estadisticasGenerales.nacionalidadesPorAno[0])
                          .filter((key) => key !== "ano")
                          .reduce(
                            (acc, nacionalidad, index) => ({
                              ...acc,
                              [nacionalidad]: {
                                label: nacionalidad,
                                color: `hsl(${120 + index * 40}, 70%, 50%)`,
                              },
                            }),
                            {},
                          )
                      : {}
                  }
                >
                  <ResponsiveContainer width="100%" height={250} minWidth={0}>
                    <BarChart
                      data={estadisticasGenerales.nacionalidadesPorAno}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="ano" />
                      <YAxis />
                      <ChartTooltip
                        content={({ active, payload, label }) => {
                          if (!active || !payload) return null;
                          return (
                            <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                              <p className="font-medium">{`Año: ${label}`}</p>
                              {payload.map(
                                (entry, index) =>
                                  entry.dataKey !== "ano" &&
                                  typeof entry.value === "number" &&
                                  entry.value > 0 && (
                                    <p key={index} className="text-sm" style={{ color: entry.color }}>
                                      {`${entry.dataKey}: ${entry.value}`}
                                    </p>
                                  ),
                              )}
                            </div>
                          );
                        }}
                      />
                      <ChartLegend content={<ChartLegendContent />} />
                      {estadisticasGenerales.nacionalidadesPorAno.length > 0 &&
                        Object.keys(estadisticasGenerales.nacionalidadesPorAno[0])
                          .filter((key) => key !== "ano")
                          .map((nacionalidad, index) => (
                            <Bar
                              key={nacionalidad}
                              dataKey={nacionalidad}
                              stackId="nacionalidades"
                              fill={`hsl(${120 + index * 40}, 70%, 50%)`}
                              name={nacionalidad}
                            />
                          ))}
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          )}

          {/* Vivienda - Tipo por Año */}
          {estadisticasGenerales.viviendaTipoPorAno.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  Vivienda - Tipo
                </CardTitle>
                <CardDescription>Distribución del tipo de vivienda por año</CardDescription>
              </CardHeader>
              <CardContent className="px-2 sm:px-6">
                <ChartContainer config={
                  estadisticasGenerales.viviendaTipoPorAno.length > 0
                    ? Object.keys(estadisticasGenerales.viviendaTipoPorAno[0]).filter(k => k !== 'ano').reduce((acc, key, i) => ({
                        ...acc, [key]: { label: key, color: `hsl(${200 + i * 40}, 70%, ${45 + i * 8}%)` }
                      }), {})
                    : {}
                }>
                  <ResponsiveContainer width="100%" height={250} minWidth={0}>
                    <BarChart data={estadisticasGenerales.viviendaTipoPorAno}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="ano" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <ChartLegend content={<ChartLegendContent />} />
                      {estadisticasGenerales.viviendaTipoPorAno.length > 0 &&
                        Object.keys(estadisticasGenerales.viviendaTipoPorAno[0]).filter(k => k !== 'ano').map((key, i) => (
                          <Bar key={key} dataKey={key} stackId="vt" fill={`hsl(${200 + i * 40}, 70%, ${45 + i * 8}%)`} />
                        ))}
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          )}

          {/* Vivienda - Contrato por Año */}
          {estadisticasGenerales.viviendaContratoPorAno.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-indigo-600" />
                  Vivienda - Contrato
                </CardTitle>
                <CardDescription>Distribución del tipo de contrato por año</CardDescription>
              </CardHeader>
              <CardContent className="px-2 sm:px-6">
                <ChartContainer config={
                  estadisticasGenerales.viviendaContratoPorAno.length > 0
                    ? Object.keys(estadisticasGenerales.viviendaContratoPorAno[0]).filter(k => k !== 'ano').reduce((acc, key, i) => ({
                        ...acc, [key]: { label: key, color: `hsl(${220 + i * 35}, 70%, ${45 + i * 8}%)` }
                      }), {})
                    : {}
                }>
                  <ResponsiveContainer width="100%" height={250} minWidth={0}>
                    <BarChart data={estadisticasGenerales.viviendaContratoPorAno}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="ano" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <ChartLegend content={<ChartLegendContent />} />
                      {estadisticasGenerales.viviendaContratoPorAno.length > 0 &&
                        Object.keys(estadisticasGenerales.viviendaContratoPorAno[0]).filter(k => k !== 'ano').map((key, i) => (
                          <Bar key={key} dataKey={key} stackId="vc" fill={`hsl(${220 + i * 35}, 70%, ${45 + i * 8}%)`} />
                        ))}
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          )}

          {/* Ayuda Habitacional por Año */}
          {estadisticasGenerales.ayudaHabitacionalPorAno.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-orange-600" />
                  Ayuda Habitacional
                </CardTitle>
                <CardDescription>Distribución de ayuda habitacional por año</CardDescription>
              </CardHeader>
              <CardContent className="px-2 sm:px-6">
                <ChartContainer config={
                  estadisticasGenerales.ayudaHabitacionalPorAno.length > 0
                    ? Object.keys(estadisticasGenerales.ayudaHabitacionalPorAno[0]).filter(k => k !== 'ano').reduce((acc, key, i) => ({
                        ...acc, [key]: { label: key, color: `hsl(${30 + i * 30}, 70%, ${45 + i * 8}%)` }
                      }), {})
                    : {}
                }>
                  <ResponsiveContainer width="100%" height={250} minWidth={0}>
                    <BarChart data={estadisticasGenerales.ayudaHabitacionalPorAno}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="ano" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <ChartLegend content={<ChartLegendContent />} />
                      {estadisticasGenerales.ayudaHabitacionalPorAno.length > 0 &&
                        Object.keys(estadisticasGenerales.ayudaHabitacionalPorAno[0]).filter(k => k !== 'ano').map((key, i) => (
                          <Bar key={key} dataKey={key} stackId="ah" fill={`hsl(${30 + i * 30}, 70%, ${45 + i * 8}%)`} />
                        ))}
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          )}

          {/* Cobertura de Salud por Año */}
          {estadisticasGenerales.coberturaSaludPorAno.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-teal-600" />
                  Cobertura de Salud
                </CardTitle>
                <CardDescription>Distribución de cobertura de salud por año</CardDescription>
              </CardHeader>
              <CardContent className="px-2 sm:px-6">
                <ChartContainer config={
                  estadisticasGenerales.coberturaSaludPorAno.length > 0
                    ? Object.keys(estadisticasGenerales.coberturaSaludPorAno[0]).filter(k => k !== 'ano').reduce((acc, key, i) => ({
                        ...acc, [key]: { label: key, color: `hsl(${160 + i * 35}, 70%, ${40 + i * 8}%)` }
                      }), {})
                    : {}
                }>
                  <ResponsiveContainer width="100%" height={250} minWidth={0}>
                    <BarChart data={estadisticasGenerales.coberturaSaludPorAno}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="ano" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <ChartLegend content={<ChartLegendContent />} />
                      {estadisticasGenerales.coberturaSaludPorAno.length > 0 &&
                        Object.keys(estadisticasGenerales.coberturaSaludPorAno[0]).filter(k => k !== 'ano').map((key, i) => (
                          <Bar key={key} dataKey={key} stackId="cs" fill={`hsl(${160 + i * 35}, 70%, ${40 + i * 8}%)`} />
                        ))}
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          )}

          {/* Aporte Previsional por Año */}
          {estadisticasGenerales.aportePrevisionalPorAno.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-purple-600" />
                  Aporte Previsional
                </CardTitle>
                <CardDescription>Distribución de aporte previsional por año</CardDescription>
              </CardHeader>
              <CardContent className="px-2 sm:px-6">
                <ChartContainer config={
                  estadisticasGenerales.aportePrevisionalPorAno.length > 0
                    ? Object.keys(estadisticasGenerales.aportePrevisionalPorAno[0]).filter(k => k !== 'ano').reduce((acc, key, i) => ({
                        ...acc, [key]: { label: key, color: `hsl(${270 + i * 30}, 70%, ${45 + i * 8}%)` }
                      }), {})
                    : {}
                }>
                  <ResponsiveContainer width="100%" height={250} minWidth={0}>
                    <BarChart data={estadisticasGenerales.aportePrevisionalPorAno}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="ano" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <ChartLegend content={<ChartLegendContent />} />
                      {estadisticasGenerales.aportePrevisionalPorAno.length > 0 &&
                        Object.keys(estadisticasGenerales.aportePrevisionalPorAno[0]).filter(k => k !== 'ano').map((key, i) => (
                          <Bar key={key} dataKey={key} stackId="ap" fill={`hsl(${270 + i * 30}, 70%, ${45 + i * 8}%)`} />
                        ))}
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default Estadisticas;
