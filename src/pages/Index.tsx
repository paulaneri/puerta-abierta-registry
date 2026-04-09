import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, UserCheck, Heart, Plus, Calendar, TrendingUp, MapPin, Clock, Settings, Cake, Facebook, Instagram } from "lucide-react";
import { Link } from "react-router-dom";
import { format, parseISO, startOfDay, getMonth, getDate } from "date-fns";
import { es } from "date-fns/locale";
import { mujeresStore } from "@/lib/mujeresStore";
import { equipoStore } from "@/lib/equipoStore";
import { centroDiaStore } from "@/lib/centroDiaStore";
import { trabajoCampoStore } from "@/lib/trabajoCampoStore";
import { eventosStore, type Evento } from "@/lib/eventosStore";
import { PhotoCarousel } from "@/components/galeria/PhotoCarousel";

const tiposEvento = [
  { value: 'reunion', label: 'Reunión', color: 'bg-blue-500' },
  { value: 'taller', label: 'Taller', color: 'bg-green-500' },
  { value: 'actividad', label: 'Actividad', color: 'bg-purple-500' },
  { value: 'seguimiento', label: 'Seguimiento', color: 'bg-orange-500' },
  { value: 'celebracion', label: 'Celebración', color: 'bg-pink-500' },
  { value: 'cumpleaños', label: 'Cumpleaños', color: 'bg-pink-600' },
  { value: 'otro', label: 'Otro', color: 'bg-gray-500' }
];

const Index = () => {
  const [estadisticas, setEstadisticas] = useState({
    totalMujeres: 0,
    totalEquipo: 0,
    totalDuplas: 0,
    registrosCentroDia: 0,
    trabajosCampo: 0
  });

  const [proximosEventos, setProximosEventos] = useState<(Evento | { id: string; titulo: string; tipo: string; fecha: string; hora_inicio?: string; lugar?: string; descripcion?: string })[]>([]);

  useEffect(() => {
    const cargarDatos = async () => {
      const mujeres = await mujeresStore.getMujeres();
      const equipo = await equipoStore.getProfesionales();
      const registrosCentro = await centroDiaStore.getRegistros();
      const trabajosCampo = await trabajoCampoStore.getTrabajosCampo();
      
      const añoActual = new Date().getFullYear();
      
      // Filtrar registros del año actual
      const registrosCentroAnioActual = registrosCentro.filter(r => {
        const fecha = new Date(r.fecha);
        return fecha.getFullYear() === añoActual && !(r as any).archivado;
      });
      
      const trabajosCampoAnioActual = trabajosCampo.filter(t => {
        const fecha = new Date(t.fecha);
        return fecha.getFullYear() === añoActual && !(t as any).archivado;
      });
      
      // Obtener duplas de localStorage si existen
      const duplasStored = localStorage.getItem('duplas');
      const duplas = duplasStored ? JSON.parse(duplasStored) : [];
      const duplasActivas = duplas.filter((dupla: any) => dupla.estado === 'activa').length;
      
      // Obtener próximos eventos
      const cargarEventos = async () => {
        const eventos = await eventosStore.getEventos();
        const hoy = new Date();
        const proximaSemana = new Date();
        proximaSemana.setDate(hoy.getDate() + 7);
        
        // Expandir eventos recurrentes
        const eventosExpandidos: any[] = [];
        
        eventos.forEach(evento => {
          const fechaEvento = new Date(evento.fecha);
          
          // Agregar el evento original
          eventosExpandidos.push(evento);
          
          // Si es recurrente, generar todas las instancias hasta una fecha límite
          if (evento.repeticion && evento.repeticion !== 'ninguna' && evento.fecha_fin_repeticion) {
            const fechaFin = new Date(evento.fecha_fin_repeticion);
            let fechaActual = new Date(fechaEvento);
            
            while (fechaActual <= fechaFin) {
              if (evento.repeticion === 'semanal') {
                fechaActual = new Date(fechaActual.getTime() + 7 * 24 * 60 * 60 * 1000);
              } else if (evento.repeticion === 'mensual') {
                fechaActual = new Date(fechaActual.getFullYear(), fechaActual.getMonth() + 1, fechaActual.getDate());
              } else if (evento.repeticion === 'anualmente') {
                fechaActual = new Date(fechaActual.getFullYear() + 1, fechaActual.getMonth(), fechaActual.getDate());
              }
              
              if (fechaActual <= fechaFin) {
                eventosExpandidos.push({
                  ...evento,
                  fecha: fechaActual.toISOString().split('T')[0]
                });
              }
            }
          }
        });
        
        // Agregar cumpleaños de las mujeres
        mujeres.forEach(mujer => {
          if (mujer.fechaNacimiento) {
            const fechaNac = new Date(mujer.fechaNacimiento);
            const mesNac = getMonth(fechaNac);
            const diaNac = getDate(fechaNac);
            
            // Crear la fecha de cumpleaños para este año
            const cumpleañosEsteAño = new Date(hoy.getFullYear(), mesNac, diaNac);
            
            // Si el cumpleaños ya pasó este año, usar el del próximo año
            if (cumpleañosEsteAño < startOfDay(hoy)) {
              cumpleañosEsteAño.setFullYear(hoy.getFullYear() + 1);
            }
            
            // Si el cumpleaños está en la próxima semana
            if (cumpleañosEsteAño >= startOfDay(hoy) && cumpleañosEsteAño <= proximaSemana) {
              eventosExpandidos.push({
                id: `cumple-mujer-${mujer.id}`,
                titulo: `Cumpleaños de ${mujer.nombre} ${mujer.apellido}`,
                tipo: 'cumpleaños',
                fecha: cumpleañosEsteAño.toISOString().split('T')[0],
                hora_inicio: '00:00',
                descripcion: `Cumpleaños de ${mujer.nombre} ${mujer.apellido}${mujer.apodo ? ` (${mujer.apodo})` : ''}`
              });
            }
          }
        });
        
        // Agregar cumpleaños del equipo
        equipo.forEach(profesional => {
          if (profesional.fechaNacimiento) {
            const fechaNac = new Date(profesional.fechaNacimiento);
            const mesNac = getMonth(fechaNac);
            const diaNac = getDate(fechaNac);
            
            // Crear la fecha de cumpleaños para este año
            const cumpleañosEsteAño = new Date(hoy.getFullYear(), mesNac, diaNac);
            
            // Si el cumpleaños ya pasó este año, usar el del próximo año
            if (cumpleañosEsteAño < startOfDay(hoy)) {
              cumpleañosEsteAño.setFullYear(hoy.getFullYear() + 1);
            }
            
            // Si el cumpleaños está en la próxima semana
            if (cumpleañosEsteAño >= startOfDay(hoy) && cumpleañosEsteAño <= proximaSemana) {
              eventosExpandidos.push({
                id: `cumple-equipo-${profesional.id}`,
                titulo: `Cumpleaños de ${profesional.nombre} ${profesional.apellido}`,
                tipo: 'cumpleaños',
                fecha: cumpleañosEsteAño.toISOString().split('T')[0],
                hora_inicio: '00:00',
                descripcion: `Cumpleaños de ${profesional.nombre} ${profesional.apellido} (Equipo)`
              });
            }
          }
        });
        
        // Filtrar eventos próximos (siguiente semana)
        const eventosProximos = eventosExpandidos
          .filter(evento => {
            const fechaEvento = parseISO(evento.fecha);
            return fechaEvento >= startOfDay(hoy) && fechaEvento <= proximaSemana;
          })
          .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
          .slice(0, 5); // Aumentar a 5 para incluir más eventos con cumpleaños
        
        return eventosProximos;
      };
      
      const eventosProximos = await cargarEventos();
      
      setEstadisticas({
        totalMujeres: mujeres.length,
        totalEquipo: equipo.length,
        totalDuplas: duplasActivas,
        registrosCentroDia: registrosCentroAnioActual.length,
        trabajosCampo: trabajosCampoAnioActual.length
      });
      
      setProximosEventos(eventosProximos);
    };
    
    cargarDatos();
  }, []);

  const getTipoEvento = (tipo: string) => {
    return tiposEvento.find(t => t.value === tipo) || tiposEvento[0];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-8 sm:space-y-12">
        {/* Hero Section */}
        <div className="text-center py-6 sm:py-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4 sm:mb-6">
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Puerta Abierta Recreando
            </span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed px-4">
            Te damos la bienvenida a este espacio para conectar, crecer y avanzar en equipo.
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          <Card className="text-center bg-card hover:shadow-lg transition-all duration-300 border-primary/20">
            <CardHeader className="pb-3 sm:pb-4">
              <div className="mx-auto w-12 h-12 sm:w-14 sm:h-14 bg-primary rounded-full flex items-center justify-center mb-3 sm:mb-4">
                <Users className="h-6 w-6 sm:h-7 sm:w-7 text-primary-foreground" />
              </div>
              <CardTitle className="text-primary text-lg sm:text-xl">
                Participantes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div>
                <p className="text-3xl sm:text-4xl font-bold text-foreground mb-2">{estadisticas.totalMujeres}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Mujeres registradas</p>
              </div>
              <Link to="/mujeres" className="block">
                <Button size="sm" className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Ver 
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="text-center bg-card hover:shadow-lg transition-all duration-300 border-secondary/20">
            <CardHeader className="pb-3 sm:pb-4">
              <div className="mx-auto w-12 h-12 sm:w-14 sm:h-14 bg-secondary rounded-full flex items-center justify-center mb-3 sm:mb-4">
                <Heart className="h-6 w-6 sm:h-7 sm:w-7 text-secondary-foreground" />
              </div>
              <CardTitle className="text-secondary text-lg sm:text-xl">
                Centro de Día
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div>
                <p className="text-3xl sm:text-4xl font-bold text-foreground mb-2">{estadisticas.registrosCentroDia}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Registros del año en curso</p>
              </div>
              <Link to="/centro-dia" className="block">
                <Button size="sm" variant="secondary" className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Ver
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="text-center bg-card hover:shadow-lg transition-all duration-300 border-accent/20">
            <CardHeader className="pb-3 sm:pb-4">
              <div className="mx-auto w-12 h-12 sm:w-14 sm:h-14 bg-accent rounded-full flex items-center justify-center mb-3 sm:mb-4">
                <MapPin className="h-6 w-6 sm:h-7 sm:w-7 text-accent-foreground" />
              </div>
              <CardTitle className="text-accent text-lg sm:text-xl">
                Trabajo de Campo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div>
                <p className="text-3xl sm:text-4xl font-bold text-foreground mb-2">{estadisticas.trabajosCampo}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Registros del año en curso</p>
              </div>
              <Link to="/trabajo-campo" className="block">
                <Button size="sm" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                  <Plus className="mr-2 h-4 w-4" />
                  Ver 
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Próximos Eventos */}
        <div className="py-4 sm:py-8">
          <Card className="max-w-5xl mx-auto">
            <CardHeader className="text-center pb-4 sm:pb-6">
              <CardTitle className="text-2xl sm:text-3xl text-primary flex items-center justify-center gap-2 sm:gap-3">
                <Calendar className="h-6 w-6 sm:h-8 sm:w-8" />
                Próximos Eventos
              </CardTitle>
              <CardDescription className="text-base sm:text-lg mt-2">
                Actividades programadas para los próximos 7 días
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 lg:px-8 pb-6 sm:pb-8">
              {proximosEventos.length > 0 ? (
                <div className="space-y-4 sm:space-y-6">
                  {proximosEventos.map((evento) => {
                    const tipoEvento = getTipoEvento(evento.tipo);
                    const esCumpleaños = evento.tipo === 'cumpleaños';
                    return (
                      <div key={evento.id} className="flex items-start sm:items-center gap-3 sm:gap-6 p-4 sm:p-6 border rounded-xl hover:bg-muted/50 transition-colors bg-card">
                        <div className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full flex-shrink-0 ${tipoEvento.color} mt-1 sm:mt-0`}></div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                            <div className="flex items-center gap-2">
                              {esCumpleaños && <Cake className="h-4 w-4 sm:h-5 sm:w-5 text-secondary" />}
                              <h4 className="font-semibold text-foreground text-base sm:text-lg break-words">{evento.titulo}</h4>
                            </div>
                            <Badge variant="secondary" className="text-xs sm:text-sm px-2 sm:px-3 py-1 w-fit">{tipoEvento.label}</Badge>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span className="text-xs sm:text-sm">{format(parseISO(evento.fecha), "d 'de' MMMM", { locale: es })}</span>
                            </div>
                            {!esCumpleaños && evento.hora_inicio && (
                              <div className="flex items-center gap-2">
                                <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                                <span className="text-xs sm:text-sm">{evento.hora_inicio}</span>
                              </div>
                            )}
                            {evento.lugar && (
                              <div className="flex items-center gap-2">
                                <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                                <span className="text-xs sm:text-sm truncate">{evento.lugar}</span>
                              </div>
                            )}
                          </div>
                          {evento.descripcion && !esCumpleaños && (
                            <p className="text-muted-foreground mt-2 text-xs sm:text-sm leading-relaxed">{evento.descripcion}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <div className="text-center mt-6 sm:mt-8">
                    <Link to="/calendario">
                      <Button variant="outline" size="lg" className="px-6 sm:px-8">
                        <Calendar className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3" />
                        Ver todos los eventos
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 sm:py-12">
                  <Calendar className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 sm:mb-6 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground mb-4 sm:mb-6 text-base sm:text-lg">No hay eventos programados para los próximos días</p>
                  <Link to="/calendario">
                    <Button size="lg" className="px-6 sm:px-8">
                      <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3" />
                      Crear primer evento
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Photo Carousel */}
        <div className="py-4 sm:py-8">
          <PhotoCarousel />
        </div>

        {/* Social Media Feeds */}
        <div className="py-4 sm:py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 max-w-5xl mx-auto">
            {/* Facebook Feed */}
            <Card className="overflow-hidden h-fit">
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="text-lg sm:text-xl flex items-center gap-2 text-primary">
                  <Facebook className="h-5 w-5 sm:h-6 sm:w-6" />
                  Facebook
                </CardTitle>
                <CardDescription>
                  Seguinos en nuestra página de Facebook
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="w-full overflow-hidden flex justify-center bg-muted/30">
                  <iframe
                    src="https://www.facebook.com/plugins/page.php?href=https%3A%2F%2Fwww.facebook.com%2Fpuertaabiertarecreando&tabs=timeline&width=340&height=500&small_header=true&adapt_container_width=true&hide_cover=false&show_facepile=true&appId"
                    width="340"
                    height="500"
                    style={{ border: 'none', overflow: 'hidden', maxWidth: '100%' }}
                    scrolling="no"
                    frameBorder="0"
                    allowFullScreen={true}
                    allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                    title="Facebook Feed de Puerta Abierta Recreando"
                  ></iframe>
                </div>
                <div className="p-4 border-t">
                  <a 
                    href="https://www.facebook.com/puertaabiertarecreando" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <Button variant="outline" className="w-full">
                      <Facebook className="h-4 w-4 mr-2" />
                      Ver página de Facebook
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>

            {/* Instagram Feed */}
            <Card className="overflow-hidden h-fit">
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="text-lg sm:text-xl flex items-center gap-2 text-primary">
                  <Instagram className="h-5 w-5 sm:h-6 sm:w-6" />
                  Instagram
                </CardTitle>
                <CardDescription>
                  Seguinos en nuestro perfil de Instagram
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="w-full overflow-hidden flex justify-center bg-muted/30" style={{ minHeight: '500px' }}>
                  <iframe 
                    src="https://www.instagram.com/puertaabiertarecreando/embed" 
                    width="340" 
                    height="500" 
                    frameBorder="0" 
                    scrolling="no" 
                    allowTransparency={true}
                    style={{ border: 'none', maxWidth: '100%' }}
                    title="Instagram Feed de Puerta Abierta Recreando"
                  ></iframe>
                </div>
                <div className="p-4 border-t">
                  <a 
                    href="https://www.instagram.com/puertaabiertarecreando/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <Button variant="outline" className="w-full">
                      <Instagram className="h-4 w-4 mr-2" />
                      Ver perfil de Instagram
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Mission Statement */}
        <div className="py-4 sm:py-8">
          <Card className="max-w-5xl mx-auto bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
            <CardContent className="p-6 sm:p-8">
              <div className="space-y-4 sm:space-y-6 text-center">
                <p className="text-sm sm:text-base lg:text-lg text-muted-foreground leading-relaxed">
                  Somos una organización conformada por religiosas y laicos/as, donde trabajamos en Equipo brindando tiempo, conocimiento y experiencia para lograr un abordaje multidisciplinario que integre la totalidad de la persona, desde una perspectiva de género y visión ecuménica.
                </p>
                <p className="text-sm sm:text-base lg:text-lg text-muted-foreground leading-relaxed">
                  Sabemos que la construcción de una alternativa de vida y una verdadera inclusión en la sociedad, implica un proceso que fortalezca la autoestima, con espacios de formación, capacitación laboral y conocimiento de sus derechos, creando hábitos y actitudes que posibiliten la inserción en el ámbito laboral.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;