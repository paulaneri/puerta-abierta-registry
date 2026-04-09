import { Button } from "@/components/ui/button";
import { Archive, Trash2, X, LucideIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface CustomAction {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  variant?: "default" | "destructive" | "secondary" | "ghost";
}

interface MultiSelectToolbarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
  showArchive?: boolean;
  showDelete?: boolean;
  customActions?: CustomAction[];
}

export function MultiSelectToolbar({
  selectedCount,
  onClearSelection,
  onArchive,
  onDelete,
  showArchive = true,
  showDelete = true,
  customActions = [],
}: MultiSelectToolbarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground rounded-lg shadow-lg px-4 py-3 flex items-center gap-4 z-50 animate-in slide-in-from-bottom-5">
      <span className="font-medium">{selectedCount} seleccionado{selectedCount > 1 ? 's' : ''}</span>
      
      <div className="flex gap-2">
        <TooltipProvider>
          {customActions.map((action, index) => (
            <Tooltip key={index}>
              <TooltipTrigger asChild>
                <Button
                  variant={action.variant || "secondary"}
                  size="sm"
                  onClick={action.onClick}
                >
                  <action.icon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{action.label}</TooltipContent>
            </Tooltip>
          ))}
          
          {showArchive && onArchive && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onArchive}
                >
                  <Archive className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Archivar seleccionados</TooltipContent>
            </Tooltip>
          )}
          
          {showDelete && onDelete && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={onDelete}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Eliminar seleccionados</TooltipContent>
            </Tooltip>
          )}
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearSelection}
                className="text-primary-foreground hover:text-primary-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Cancelar selección</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
