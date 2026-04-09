import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AppSidebar } from "./components/AppSidebar";
import { SetupGuard } from "./components/SetupGuard";
import { useAuth } from "./hooks/useAuth";
import ProtectedRoute from "./components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Mujeres from "./pages/Mujeres";
import MujerNueva from "./pages/MujerNueva";
import DetalleMujer from "./pages/DetalleMujer";
import EquipoTrabajo from "./pages/EquipoTrabajo";
import Estadisticas from "./pages/Estadisticas";
import TrabajoCampo from "./pages/TrabajoCampo";
import TrabajoCampoNuevo from "./pages/TrabajoCampoNuevo";
import TrabajoCampoEditar from "./pages/TrabajoCampoEditar";
import Administracion from "./pages/Administracion";
import CentroDia from "./pages/CentroDia";
import CentroDiaNuevo from "./pages/CentroDiaNuevo";
import CentroDiaEditar from "./pages/CentroDiaEditar";
import Gastos from "./pages/Gastos";
import Contactos from "./pages/Contactos";
import Calendario from "./pages/Calendario";
import Duplas from "./pages/Duplas";
import Reuniones from "./pages/Reuniones";
import Galeria from "./pages/Galeria";
import Actividades from "./pages/Actividades";

import NotFound from "./pages/NotFound";
import Setup from "./pages/Setup";
import { LogOut } from "lucide-react";

const queryClient = new QueryClient();

const MainLayout = () => {
  const { user, signOut } = useAuth();
  
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full overflow-x-hidden">
        <AppSidebar />
        <main className="flex-1 w-full overflow-x-hidden">
          <header className="h-auto md:h-12 flex flex-col md:flex-row items-start md:items-center justify-between border-b bg-background px-2 sm:px-4 py-2 md:py-0 gap-2 md:gap-0">
            <div className="flex items-center w-full md:w-auto">
              <SidebarTrigger />
              <h1 className="ml-2 sm:ml-4 text-sm sm:text-base md:text-lg font-semibold text-primary truncate">Centro de Día - Gestión Integral</h1>
            </div>
            {user && (
              <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                <span className="text-xs sm:text-sm text-muted-foreground truncate max-w-[150px] sm:max-w-none">{user.email}</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" onClick={signOut}>
                      <LogOut className="h-4 w-4" />
                      <span className="ml-2 hidden sm:inline">Salir</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Cerrar sesión</TooltipContent>
                </Tooltip>
              </div>
            )}
          </header>
          <div className="flex-1">
            <Routes>
              <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
              <Route path="/mujeres" element={<ProtectedRoute><Mujeres /></ProtectedRoute>} />
              <Route path="/mujeres/nueva" element={<ProtectedRoute><MujerNueva /></ProtectedRoute>} />
              <Route path="/mujeres/:id" element={<ProtectedRoute><DetalleMujer /></ProtectedRoute>} />
              <Route path="/equipo-trabajo" element={<ProtectedRoute><EquipoTrabajo /></ProtectedRoute>} />
              <Route path="/estadisticas" element={<ProtectedRoute><Estadisticas /></ProtectedRoute>} />
              <Route path="/trabajo-campo" element={<ProtectedRoute><TrabajoCampo /></ProtectedRoute>} />
              <Route path="/trabajo-campo/nuevo" element={<ProtectedRoute><TrabajoCampoNuevo /></ProtectedRoute>} />
              <Route path="/trabajo-campo/editar/:id" element={<ProtectedRoute><TrabajoCampoEditar /></ProtectedRoute>} />
              <Route path="/centro-dia" element={<ProtectedRoute><CentroDia /></ProtectedRoute>} />
              <Route path="/centro-dia/nuevo" element={<ProtectedRoute><CentroDiaNuevo /></ProtectedRoute>} />
              <Route path="/centro-dia/editar/:id" element={<ProtectedRoute><CentroDiaEditar /></ProtectedRoute>} />
              <Route path="/gastos" element={<ProtectedRoute><Gastos /></ProtectedRoute>} />
              <Route path="/contactos" element={<ProtectedRoute><Contactos /></ProtectedRoute>} />
              <Route path="/calendario" element={<ProtectedRoute><Calendario /></ProtectedRoute>} />
              <Route path="/duplas" element={<ProtectedRoute><Duplas /></ProtectedRoute>} />
              <Route path="/reuniones" element={<ProtectedRoute><Reuniones /></ProtectedRoute>} />
              <Route path="/galeria" element={<ProtectedRoute><Galeria /></ProtectedRoute>} />
              <Route path="/actividades" element={<ProtectedRoute><Actividades /></ProtectedRoute>} />
              
              <Route path="/administracion" element={<ProtectedRoute><Administracion /></ProtectedRoute>} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SetupGuard>
          <Routes>
            <Route path="/setup" element={<Setup />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/*" element={<MainLayout />} />
          </Routes>
        </SetupGuard>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
