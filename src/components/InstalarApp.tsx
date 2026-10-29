import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

type PromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

const yaInstalada = () =>
  window.matchMedia?.("(display-mode: standalone)").matches ||
  (navigator as unknown as { standalone?: boolean }).standalone === true;

export const InstalarApp = () => {
  const [prompt, setPrompt] = useState<PromptEvent | null>(null);
  const [instalada, setInstalada] = useState(yaInstalada());
  const [ayuda, setAyuda] = useState(false);

  useEffect(() => {
    const onPrompt = (e: Event) => { e.preventDefault(); setPrompt(e as PromptEvent); };
    const onInstalled = () => { setInstalada(true); setPrompt(null); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (instalada) return null;

  const instalar = async () => {
    if (prompt) {
      await prompt.prompt();
      await prompt.userChoice;
      setPrompt(null);
    } else {
      setAyuda(true);
    }
  };

  const esIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button type="button" variant="ghost" size="sm" onClick={instalar}>
            <Download className="h-4 w-4" />
            <span className="ml-2 hidden sm:inline">Instalar app</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>Instalar en este celular o computadora</TooltipContent>
      </Tooltip>
      <Dialog open={ayuda} onOpenChange={setAyuda}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Instalar Puerta Abierta</DialogTitle>
            <DialogDescription>Así queda el ícono en tu pantalla, como cualquier aplicación.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            {esIOS ? (
              <ol className="list-decimal pl-5 space-y-1">
                <li>Abrí esta página en <strong>Safari</strong>.</li>
                <li>Tocá el botón <strong>Compartir</strong> (cuadrado con flecha hacia arriba).</li>
                <li>Elegí <strong>"Agregar a pantalla de inicio"</strong> y tocá <strong>Agregar</strong>.</li>
              </ol>
            ) : (
              <>
                <p className="font-medium">En el celular (Android):</p>
                <ol className="list-decimal pl-5 space-y-1">
                  <li>Abrí esta página en <strong>Chrome</strong>.</li>
                  <li>Tocá el menú <strong>⋮</strong> arriba a la derecha.</li>
                  <li>Elegí <strong>"Instalar aplicación"</strong> o <strong>"Agregar a pantalla principal"</strong>.</li>
                </ol>
                <p className="font-medium">En la computadora:</p>
                <ol className="list-decimal pl-5 space-y-1">
                  <li>Abrí esta página en <strong>Chrome</strong> o <strong>Edge</strong>.</li>
                  <li>Hacé clic en el ícono de instalar en la barra de direcciones, o en el menú elegí <strong>"Instalar Puerta Abierta"</strong>.</li>
                </ol>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
