import * as React from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface DatePickerProps {
  date?: Date
  onSelect?: (date: Date | undefined) => void
  placeholder?: string
  className?: string
  disabled?: (date: Date) => boolean
  fromYear?: number
  toYear?: number
}

export function DatePicker({
  date,
  onSelect,
  placeholder = "Seleccionar fecha",
  className,
  disabled,
  fromYear = 1900,
  toYear = new Date().getFullYear() + 10
}: DatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [viewDate, setViewDate] = React.useState<Date>(date || new Date())

  // Sincronizar viewDate con date cuando cambia desde fuera
  React.useEffect(() => {
    if (date) {
      setViewDate(date)
    }
  }, [date])

  // Generar arrays de años y meses
  const years = React.useMemo(() => {
    const yearArray = []
    for (let year = toYear; year >= fromYear; year--) {
      yearArray.push(year)
    }
    return yearArray
  }, [fromYear, toYear])

  const months = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ]

  const handleYearChange = (year: string) => {
    const newYear = parseInt(year)
    
    // Actualizar viewDate
    const newViewDate = new Date(viewDate)
    newViewDate.setFullYear(newYear)
    setViewDate(newViewDate)
    
    // Si hay una fecha seleccionada, actualizarla preservando día y mes
    if (date) {
      const currentDay = date.getDate()
      const currentMonth = date.getMonth()
      
      // Crear nueva fecha con el año nuevo
      const updatedDate = new Date(newYear, currentMonth, currentDay)
      
      // Verificar si el día es válido (si setDate cambió el mes, el día no era válido)
      if (updatedDate.getMonth() !== currentMonth) {
        // Si el día no existe en ese mes, usar el último día del mes
        updatedDate.setDate(0) // Retrocede al último día del mes anterior
      }
      
      onSelect?.(updatedDate)
    }
  }

  const handleMonthChange = (month: string) => {
    const newMonth = parseInt(month)
    
    // Actualizar viewDate
    const newViewDate = new Date(viewDate)
    newViewDate.setMonth(newMonth)
    setViewDate(newViewDate)
    
    // Si hay una fecha seleccionada, actualizarla preservando día y año
    if (date) {
      const currentDay = date.getDate()
      const currentYear = date.getFullYear()
      
      // Crear nueva fecha con el mes nuevo
      const updatedDate = new Date(currentYear, newMonth, currentDay)
      
      // Verificar si el día es válido (si el mes cambió, el día no era válido)
      if (updatedDate.getMonth() !== newMonth) {
        // Si el día no existe en ese mes, usar el último día del mes
        updatedDate.setDate(0) // Retrocede al último día del mes anterior
      }
      
      onSelect?.(updatedDate)
    }
  }

  const handleDateSelect = (selectedDate: Date | undefined) => {
    onSelect?.(selectedDate)
    if (selectedDate) {
      setIsOpen(false)
    }
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(viewDate)
    if (direction === 'prev') {
      newDate.setMonth(viewDate.getMonth() - 1)
    } else {
      newDate.setMonth(viewDate.getMonth() + 1)
    }
    setViewDate(newDate)
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP", { locale: es }) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3 space-y-3">
          {/* Navegación rápida por año y mes */}
          <div className="flex items-center justify-between gap-2">
            <Select 
              value={viewDate.getMonth().toString()} 
              onValueChange={handleMonthChange}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map((month, index) => (
                  <SelectItem key={index} value={index.toString()}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => navigateMonth('prev')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <Select 
                value={viewDate.getFullYear().toString()} 
                onValueChange={handleYearChange}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-48 overflow-y-auto">
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => navigateMonth('next')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Calendario */}
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateSelect}
            month={viewDate}
            onMonthChange={setViewDate}
            disabled={disabled}
            className="p-0 pointer-events-auto"
            classNames={{
              nav: "hidden", // Ocultamos la navegación por defecto
            }}
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}