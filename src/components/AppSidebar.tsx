import { Users, UserCheck, TrendingUp, MapPin, Calendar, Home, DollarSign, Contact, Heart, FileText, BarChart3, Shield, Settings, ClipboardList, Image, LayoutGrid } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useRoles } from "@/hooks/useRoles";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

// Items de navegación completos
const allItems = [
  { title: "Inicio", url: "/", icon: Home, section: "inicio" },
  { title: "Participantes", url: "/mujeres", icon: Users, section: "mujeres" },
  { title: "Centro de Día", url: "/centro-dia", icon: Heart, section: "centro-dia" },
  { title: "Trabajo de Campo", url: "/trabajo-campo", icon: MapPin, section: "trabajo-campo" },
  { title: "Equipo de Trabajo", url: "/equipo-trabajo", icon: UserCheck, section: "equipo" },
  { title: "Roles de Reuniones", url: "/reuniones", icon: ClipboardList, section: "equipo" },
  { title: "Contactos", url: "/contactos", icon: Contact, section: "contactos" },
  { title: "Calendario", url: "/calendario", icon: Calendar, section: "calendario" },
  { title: "Galería", url: "/galeria", icon: Image, section: "galeria" },
  { title: "Actividades", url: "/actividades", icon: LayoutGrid, section: "actividades" },
  { title: "Gastos", url: "/gastos", icon: DollarSign, section: "gastos" },
  { title: "Duplas de Acompañamiento", url: "/duplas", icon: FileText, section: "duplas" },
  
  { title: "Estadísticas", url: "/estadisticas", icon: BarChart3, section: "estadisticas" },
  { title: "Administración", url: "/administracion", icon: Shield, section: "administracion", adminOnly: true },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const { canAccessSection, hasPermission, loading } = useRoles();

  // Filtrar items según permisos del usuario
  const items = allItems.filter(item => {
    if (item.adminOnly) {
      return hasPermission('administrador');
    }
    if (item.section === "inicio") {
      return true; // Todos pueden ver inicio
    }
    return canAccessSection(item.section);
  });

  if (loading) {
    return (
      <Sidebar className={state === "collapsed" ? "w-14" : "w-64"} collapsible="icon">
        <SidebarContent>
          <div className="p-4 text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
          </div>
        </SidebarContent>
      </Sidebar>
    );
  }

  return (
    <Sidebar className={`${state === "collapsed" ? "w-14" : "w-64"} transition-all duration-200`} collapsible="icon">
      <SidebarContent className="overflow-y-auto py-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-primary font-semibold text-xs sm:text-sm px-3 mb-2">
            {state !== "collapsed" && "Puerta Abierta"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1 px-2">
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end 
                      className={({ isActive }) => 
                        `flex items-center gap-3 rounded-lg px-3 py-2 transition-all duration-150 ${
                          isActive 
                            ? "bg-primary/10 text-primary font-medium" 
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`
                      }
                      title={item.title}
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      {state !== "collapsed" && <span className="text-sm truncate">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}