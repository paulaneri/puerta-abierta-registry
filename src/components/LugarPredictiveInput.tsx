import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { MapPin, Plus, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { lugaresStore, type Lugar } from '@/lib/lugaresStore';

interface LugarPredictiveInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}

const LugarPredictiveInput: React.FC<LugarPredictiveInputProps> = ({
  value,
  onChange,
  placeholder = "Escriba o seleccione un lugar...",
  required = false
}) => {
  const [open, setOpen] = useState(false);
  const [lugares, setLugares] = useState<Lugar[]>([]);
  const [filteredLugares, setFilteredLugares] = useState<Lugar[]>([]);
  const [inputValue, setInputValue] = useState(value);
  const [loading, setLoading] = useState(false);

  console.log('🏪 LugarPredictiveInput - Props received:', { value, required });
  console.log('🏪 LugarPredictiveInput - Current state:', { inputValue, lugares: lugares.length, open });

  useEffect(() => {
    console.log('🏪 Cargando lugares desde base de datos...');
    // Cargar lugares desde la base de datos
    const cargarLugares = async () => {
      setLoading(true);
      try {
        const lugaresData = await lugaresStore.getLugares();
        setLugares(lugaresData);
      } catch (error) {
        console.error('Error cargando lugares:', error);
      } finally {
        setLoading(false);
      }
    };

    cargarLugares();
  }, []);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    // Filtrar lugares basado en el input
    if (!inputValue.trim()) {
      setFilteredLugares(lugares.slice(0, 10)); // Mostrar solo los primeros 10
    } else {
      const filtered = lugares.filter(lugar =>
        lugar.nombre.toLowerCase().includes(inputValue.toLowerCase())
      ).slice(0, 10);
      setFilteredLugares(filtered);
    }
  }, [inputValue, lugares]);

  const handleInputChange = (newValue: string) => {
    console.log('🏪 Input change:', { from: inputValue, to: newValue });
    setInputValue(newValue);
    onChange(newValue);
  };

  const handleSelectLugar = (lugar: string) => {
    setInputValue(lugar);
    onChange(lugar);
    setOpen(false);
  };

  const handleAddNewLugar = async () => {
    if (inputValue.trim() && !lugares.some(lugar => lugar.nombre.toLowerCase() === inputValue.toLowerCase().trim())) {
      setLoading(true);
      try {
        const nuevoLugar = await lugaresStore.agregarLugar(inputValue.trim());
        if (nuevoLugar) {
          // Recargar la lista de lugares
          const lugaresActualizados = await lugaresStore.getLugares();
          setLugares(lugaresActualizados);
          
          onChange(inputValue.trim());
          setOpen(false);
        }
      } catch (error) {
        console.error('Error agregando lugar:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const shouldShowAddButton = inputValue.trim() && 
    !lugares.some(lugar => lugar.nombre.toLowerCase() === inputValue.toLowerCase().trim());

  return (
    <div className="relative">
      <Popover open={open} onOpenChange={(isOpen) => {
        console.log('🏪 Popover state change:', { open, newOpen: isOpen });
        setOpen(isOpen);
      }}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-10 px-3 text-left font-normal"
            onClick={() => setOpen(!open)}
          >
            <div className="flex items-center">
              <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
              <span className="truncate">
                {inputValue || placeholder}
              </span>
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0 z-50 bg-background border shadow-lg" align="start">
          <Command>
            <CommandInput
              placeholder="Buscar lugar..."
              value={inputValue}
              onValueChange={(value) => {
                console.log('🏪 CommandInput change:', { from: inputValue, to: value });
                setInputValue(value);
                onChange(value);
              }}
              className="h-9"
            />
            <CommandList>
              {loading ? (
                <CommandEmpty>Cargando lugares...</CommandEmpty>
              ) : filteredLugares.length > 0 ? (
                <CommandGroup>
                  {filteredLugares.map((lugar) => (
                    <CommandItem
                      key={lugar.id}
                      value={lugar.nombre}
                      onSelect={() => handleSelectLugar(lugar.nombre)}
                      className="flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center">
                        <MapPin className="mr-2 h-4 w-4" />
                        {lugar.nombre}
                      </div>
                      {inputValue === lugar.nombre && (
                        <Check className="h-4 w-4" />
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ) : (
                <CommandEmpty>No se encontraron lugares.</CommandEmpty>
              )}
              {shouldShowAddButton && !loading && (
                <CommandGroup>
                  <CommandItem
                    onSelect={handleAddNewLugar}
                    className="flex items-center text-primary cursor-pointer border-t"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar "{inputValue.trim()}"
                  </CommandItem>
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default LugarPredictiveInput;