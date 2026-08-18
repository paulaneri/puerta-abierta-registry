import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Eye, EyeOff, Copy, Check, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userEmail: string;
}

const generarPassword = () =>
  Math.random().toString(36).slice(-10) + 'A1!';

export function CambiarPasswordDialog({ open, onOpenChange, userId, userEmail }: Props) {
  const [password, setPassword] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [mostrar, setMostrar] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const reset = () => {
    setPassword('');
    setConfirmacion('');
    setMostrar(false);
    setCopiado(false);
  };

  const handleCopiar = async () => {
    if (!password) return;
    await navigator.clipboard.writeText(password);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const handleGuardar = async () => {
    if (password.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    if (password !== confirmacion) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    setGuardando(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-set-password', {
        body: { userId, password },
      });

      if (error || (data as any)?.error) {
        toast.error((data as any)?.error || error?.message || 'Error al cambiar la contraseña');
        return;
      }

      toast.success(`Contraseña actualizada para ${userEmail}`);
      reset();
      onOpenChange(false);
    } catch (e) {
      console.error(e);
      toast.error('Error al cambiar la contraseña');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-w-[95vw] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cambiar contraseña</DialogTitle>
          <DialogDescription>
            Definí una nueva contraseña para {userEmail}. La contraseña anterior dejará de funcionar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nueva-password">Nueva contraseña</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="nueva-password"
                  type={mostrar ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  autoComplete="new-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setMostrar((v) => !v)}
                >
                  {mostrar ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                title="Generar contraseña"
                onClick={() => {
                  const nueva = generarPassword();
                  setPassword(nueva);
                  setConfirmacion(nueva);
                  setMostrar(true);
                }}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                title="Copiar contraseña"
                onClick={handleCopiar}
                disabled={!password}
              >
                {copiado ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmar-password">Confirmar contraseña</Label>
            <Input
              id="confirmar-password"
              type={mostrar ? 'text' : 'password'}
              value={confirmacion}
              onChange={(e) => setConfirmacion(e.target.value)}
              autoComplete="new-password"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={guardando}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleGuardar} disabled={guardando}>
            {guardando ? 'Guardando...' : 'Guardar contraseña'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
