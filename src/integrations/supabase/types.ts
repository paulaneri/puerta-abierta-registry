export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      actividades: {
        Row: {
          creado_por: string
          created_at: string
          descripcion: string | null
          estado: string
          fecha_limite: string | null
          id: string
          orden: number
          prioridad: string | null
          responsable_id: string | null
          titulo: string
          updated_at: string
        }
        Insert: {
          creado_por: string
          created_at?: string
          descripcion?: string | null
          estado?: string
          fecha_limite?: string | null
          id?: string
          orden?: number
          prioridad?: string | null
          responsable_id?: string | null
          titulo: string
          updated_at?: string
        }
        Update: {
          creado_por?: string
          created_at?: string
          descripcion?: string | null
          estado?: string
          fecha_limite?: string | null
          id?: string
          orden?: number
          prioridad?: string | null
          responsable_id?: string | null
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "actividades_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "equipo"
            referencedColumns: ["id"]
          },
        ]
      }
      albumes: {
        Row: {
          created_at: string
          descripcion: string | null
          evento: string | null
          fecha: string
          foto_portada_url: string | null
          id: string
          nombre: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          descripcion?: string | null
          evento?: string | null
          fecha: string
          foto_portada_url?: string | null
          id?: string
          nombre: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          descripcion?: string | null
          evento?: string | null
          fecha?: string
          foto_portada_url?: string | null
          id?: string
          nombre?: string
          updated_at?: string
        }
        Relationships: []
      }
      asignaciones_roles: {
        Row: {
          created_at: string
          id: string
          presente: boolean
          profesional_id: string
          reunion_id: string
          rol: Database["public"]["Enums"]["rol_reunion"]
          suplente_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          presente?: boolean
          profesional_id: string
          reunion_id: string
          rol: Database["public"]["Enums"]["rol_reunion"]
          suplente_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          presente?: boolean
          profesional_id?: string
          reunion_id?: string
          rol?: Database["public"]["Enums"]["rol_reunion"]
          suplente_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "asignaciones_roles_profesional_id_fkey"
            columns: ["profesional_id"]
            isOneToOne: false
            referencedRelation: "equipo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asignaciones_roles_reunion_id_fkey"
            columns: ["reunion_id"]
            isOneToOne: false
            referencedRelation: "reuniones_semanales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asignaciones_roles_suplente_id_fkey"
            columns: ["suplente_id"]
            isOneToOne: false
            referencedRelation: "equipo"
            referencedColumns: ["id"]
          },
        ]
      }
      cargos_profesionales: {
        Row: {
          activo: boolean
          created_at: string
          descripcion: string | null
          id: string
          nombre: string
          updated_at: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre: string
          updated_at?: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre?: string
          updated_at?: string
        }
        Relationships: []
      }
      centro_dia: {
        Row: {
          archivado: boolean
          articulacion_instituciones: string | null
          created_at: string
          descripcion: string | null
          fecha: string
          id: string
          llamadas_hechas: Json | null
          llamadas_recibidas: Json | null
          mujer_id: string | null
          mujeres_asistieron: Json | null
          observaciones: string | null
          profesional: string | null
          proxima_cita: string | null
          tipo_actividad: string
          trabajo_campo_resumen: string | null
          tramites: Json | null
          updated_at: string
        }
        Insert: {
          archivado?: boolean
          articulacion_instituciones?: string | null
          created_at?: string
          descripcion?: string | null
          fecha: string
          id?: string
          llamadas_hechas?: Json | null
          llamadas_recibidas?: Json | null
          mujer_id?: string | null
          mujeres_asistieron?: Json | null
          observaciones?: string | null
          profesional?: string | null
          proxima_cita?: string | null
          tipo_actividad: string
          trabajo_campo_resumen?: string | null
          tramites?: Json | null
          updated_at?: string
        }
        Update: {
          archivado?: boolean
          articulacion_instituciones?: string | null
          created_at?: string
          descripcion?: string | null
          fecha?: string
          id?: string
          llamadas_hechas?: Json | null
          llamadas_recibidas?: Json | null
          mujer_id?: string | null
          mujeres_asistieron?: Json | null
          observaciones?: string | null
          profesional?: string | null
          proxima_cita?: string | null
          tipo_actividad?: string
          trabajo_campo_resumen?: string | null
          tramites?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      contactos: {
        Row: {
          apellido: string | null
          cargo: string | null
          ciudad: string | null
          created_at: string
          dia_atencion: string | null
          direccion: string | null
          email: string | null
          horario_atencion: string | null
          id: string
          nombre: string
          notas: string | null
          organizacion: string | null
          pagina_web: string | null
          pais: string | null
          provincia: string | null
          servicio: string | null
          tags: string[] | null
          telefono: string | null
          updated_at: string
        }
        Insert: {
          apellido?: string | null
          cargo?: string | null
          ciudad?: string | null
          created_at?: string
          dia_atencion?: string | null
          direccion?: string | null
          email?: string | null
          horario_atencion?: string | null
          id?: string
          nombre: string
          notas?: string | null
          organizacion?: string | null
          pagina_web?: string | null
          pais?: string | null
          provincia?: string | null
          servicio?: string | null
          tags?: string[] | null
          telefono?: string | null
          updated_at?: string
        }
        Update: {
          apellido?: string | null
          cargo?: string | null
          ciudad?: string | null
          created_at?: string
          dia_atencion?: string | null
          direccion?: string | null
          email?: string | null
          horario_atencion?: string | null
          id?: string
          nombre?: string
          notas?: string | null
          organizacion?: string | null
          pagina_web?: string | null
          pais?: string | null
          provincia?: string | null
          servicio?: string | null
          tags?: string[] | null
          telefono?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      disponibilidad_reuniones: {
        Row: {
          created_at: string
          disponible: boolean
          id: string
          profesional_id: string
          reunion_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          disponible?: boolean
          id?: string
          profesional_id: string
          reunion_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          disponible?: boolean
          id?: string
          profesional_id?: string
          reunion_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "disponibilidad_reuniones_profesional_id_fkey"
            columns: ["profesional_id"]
            isOneToOne: false
            referencedRelation: "equipo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disponibilidad_reuniones_reunion_id_fkey"
            columns: ["reunion_id"]
            isOneToOne: false
            referencedRelation: "reuniones_semanales"
            referencedColumns: ["id"]
          },
        ]
      }
      duplas_acompanamiento: {
        Row: {
          activa: boolean
          archivado: boolean
          created_at: string
          fecha_formacion: string
          id: string
          mujer_id: string | null
          observaciones: string | null
          profesional1_id: string
          profesional2_id: string
          updated_at: string
        }
        Insert: {
          activa?: boolean
          archivado?: boolean
          created_at?: string
          fecha_formacion: string
          id?: string
          mujer_id?: string | null
          observaciones?: string | null
          profesional1_id: string
          profesional2_id: string
          updated_at?: string
        }
        Update: {
          activa?: boolean
          archivado?: boolean
          created_at?: string
          fecha_formacion?: string
          id?: string
          mujer_id?: string | null
          observaciones?: string | null
          profesional1_id?: string
          profesional2_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "duplas_acompanamiento_mujer_id_fkey"
            columns: ["mujer_id"]
            isOneToOne: false
            referencedRelation: "mujeres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "duplas_acompanamiento_profesional1_id_fkey"
            columns: ["profesional1_id"]
            isOneToOne: false
            referencedRelation: "equipo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "duplas_acompanamiento_profesional2_id_fkey"
            columns: ["profesional2_id"]
            isOneToOne: false
            referencedRelation: "equipo"
            referencedColumns: ["id"]
          },
        ]
      }
      equipo: {
        Row: {
          activo: boolean | null
          apellido: string
          certificaciones: string[] | null
          created_at: string
          email: string | null
          equipo_ampliado: boolean
          especialidad: string | null
          experiencia: string | null
          fecha_ingreso: string | null
          fecha_nacimiento: string | null
          id: string
          nombre: string
          profesion: string | null
          telefono: string | null
          updated_at: string
        }
        Insert: {
          activo?: boolean | null
          apellido: string
          certificaciones?: string[] | null
          created_at?: string
          email?: string | null
          equipo_ampliado?: boolean
          especialidad?: string | null
          experiencia?: string | null
          fecha_ingreso?: string | null
          fecha_nacimiento?: string | null
          id?: string
          nombre: string
          profesion?: string | null
          telefono?: string | null
          updated_at?: string
        }
        Update: {
          activo?: boolean | null
          apellido?: string
          certificaciones?: string[] | null
          created_at?: string
          email?: string | null
          equipo_ampliado?: boolean
          especialidad?: string | null
          experiencia?: string | null
          fecha_ingreso?: string | null
          fecha_nacimiento?: string | null
          id?: string
          nombre?: string
          profesion?: string | null
          telefono?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      etiquetas_gastos: {
        Row: {
          color: string | null
          created_at: string
          id: string
          nombre: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          nombre: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          nombre?: string
          updated_at?: string
        }
        Relationships: []
      }
      eventos: {
        Row: {
          created_at: string
          descripcion: string | null
          fecha: string
          fecha_fin_repeticion: string | null
          hora_fin: string
          hora_inicio: string
          id: string
          lugar: string | null
          participantes: string[] | null
          recordatorio: boolean | null
          repeticion: string | null
          tipo: string
          titulo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          descripcion?: string | null
          fecha: string
          fecha_fin_repeticion?: string | null
          hora_fin: string
          hora_inicio: string
          id?: string
          lugar?: string | null
          participantes?: string[] | null
          recordatorio?: boolean | null
          repeticion?: string | null
          tipo: string
          titulo: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          descripcion?: string | null
          fecha?: string
          fecha_fin_repeticion?: string | null
          hora_fin?: string
          hora_inicio?: string
          id?: string
          lugar?: string | null
          participantes?: string[] | null
          recordatorio?: boolean | null
          repeticion?: string | null
          tipo?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      fotos_album: {
        Row: {
          album_id: string
          created_at: string
          descripcion: string | null
          id: string
          nombre_archivo: string | null
          orden: number | null
          url: string
        }
        Insert: {
          album_id: string
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre_archivo?: string | null
          orden?: number | null
          url: string
        }
        Update: {
          album_id?: string
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre_archivo?: string | null
          orden?: number | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "fotos_album_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "albumes"
            referencedColumns: ["id"]
          },
        ]
      }
      gastos: {
        Row: {
          archivado: boolean
          categoria: string
          comprobante_id: string | null
          concepto: string
          created_at: string
          descripcion: string | null
          documentos_adjuntos: Json | null
          fecha: string
          id: string
          metodo_pago: string | null
          monto: number
          updated_at: string
        }
        Insert: {
          archivado?: boolean
          categoria: string
          comprobante_id?: string | null
          concepto: string
          created_at?: string
          descripcion?: string | null
          documentos_adjuntos?: Json | null
          fecha: string
          id?: string
          metodo_pago?: string | null
          monto: number
          updated_at?: string
        }
        Update: {
          archivado?: boolean
          categoria?: string
          comprobante_id?: string | null
          concepto?: string
          created_at?: string
          descripcion?: string | null
          documentos_adjuntos?: Json | null
          fecha?: string
          id?: string
          metodo_pago?: string | null
          monto?: number
          updated_at?: string
        }
        Relationships: []
      }
      lugares: {
        Row: {
          activo: boolean
          created_at: string
          id: string
          nombre: string
          updated_at: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          id?: string
          nombre: string
          updated_at?: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          id?: string
          nombre?: string
          updated_at?: string
        }
        Relationships: []
      }
      mujeres: {
        Row: {
          acompanamientos: Json | null
          alfabetizada: boolean | null
          apellido: string | null
          apodo: string | null
          aporte_previsional: string | null
          ayuda_habitacional: string | null
          cobertura_salud: string | null
          created_at: string
          descripcion_rasgos: string | null
          direccion: string | null
          documentos: Json | null
          edad: number | null
          email: string | null
          fecha_nacimiento: string | null
          fecha_primer_contacto: string | null
          hijos: boolean | null
          id: string
          llamadas_realizadas: number | null
          llamadas_recibidas: number | null
          nacionalidad: string | null
          nombre: string | null
          numero_hijos: number | null
          observaciones: string | null
          observaciones_historia: string | null
          origen_registro: string | null
          parada_zona: string | null
          persona_contacto_referencia: string | null
          situacion_laboral: string | null
          telefono: string | null
          tiene_documentacion: boolean | null
          tipo_documentacion: string | null
          tipo_residencia: string | null
          tramites_realizados: string[] | null
          updated_at: string
          vivienda_contrato: string | null
          vivienda_tipo: string | null
        }
        Insert: {
          acompanamientos?: Json | null
          alfabetizada?: boolean | null
          apellido?: string | null
          apodo?: string | null
          aporte_previsional?: string | null
          ayuda_habitacional?: string | null
          cobertura_salud?: string | null
          created_at?: string
          descripcion_rasgos?: string | null
          direccion?: string | null
          documentos?: Json | null
          edad?: number | null
          email?: string | null
          fecha_nacimiento?: string | null
          fecha_primer_contacto?: string | null
          hijos?: boolean | null
          id?: string
          llamadas_realizadas?: number | null
          llamadas_recibidas?: number | null
          nacionalidad?: string | null
          nombre?: string | null
          numero_hijos?: number | null
          observaciones?: string | null
          observaciones_historia?: string | null
          origen_registro?: string | null
          parada_zona?: string | null
          persona_contacto_referencia?: string | null
          situacion_laboral?: string | null
          telefono?: string | null
          tiene_documentacion?: boolean | null
          tipo_documentacion?: string | null
          tipo_residencia?: string | null
          tramites_realizados?: string[] | null
          updated_at?: string
          vivienda_contrato?: string | null
          vivienda_tipo?: string | null
        }
        Update: {
          acompanamientos?: Json | null
          alfabetizada?: boolean | null
          apellido?: string | null
          apodo?: string | null
          aporte_previsional?: string | null
          ayuda_habitacional?: string | null
          cobertura_salud?: string | null
          created_at?: string
          descripcion_rasgos?: string | null
          direccion?: string | null
          documentos?: Json | null
          edad?: number | null
          email?: string | null
          fecha_nacimiento?: string | null
          fecha_primer_contacto?: string | null
          hijos?: boolean | null
          id?: string
          llamadas_realizadas?: number | null
          llamadas_recibidas?: number | null
          nacionalidad?: string | null
          nombre?: string | null
          numero_hijos?: number | null
          observaciones?: string | null
          observaciones_historia?: string | null
          origen_registro?: string | null
          parada_zona?: string | null
          persona_contacto_referencia?: string | null
          situacion_laboral?: string | null
          telefono?: string | null
          tiene_documentacion?: boolean | null
          tipo_documentacion?: string | null
          tipo_residencia?: string | null
          tramites_realizados?: string[] | null
          updated_at?: string
          vivienda_contrato?: string | null
          vivienda_tipo?: string | null
        }
        Relationships: []
      }
      nacionalidades: {
        Row: {
          activa: boolean
          created_at: string
          id: string
          nombre: string
          updated_at: string
        }
        Insert: {
          activa?: boolean
          created_at?: string
          id?: string
          nombre: string
          updated_at?: string
        }
        Update: {
          activa?: boolean
          created_at?: string
          id?: string
          nombre?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          apellido: string | null
          created_at: string
          email: string
          id: string
          nombre: string | null
          updated_at: string
        }
        Insert: {
          apellido?: string | null
          created_at?: string
          email: string
          id: string
          nombre?: string | null
          updated_at?: string
        }
        Update: {
          apellido?: string | null
          created_at?: string
          email?: string
          id?: string
          nombre?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      reuniones_semanales: {
        Row: {
          ano: number
          created_at: string
          estado: string
          fecha: string
          id: string
          motivo_cancelacion: string | null
          numero_acta: number | null
          observaciones: string | null
          semana_numero: number
          updated_at: string
        }
        Insert: {
          ano: number
          created_at?: string
          estado?: string
          fecha: string
          id?: string
          motivo_cancelacion?: string | null
          numero_acta?: number | null
          observaciones?: string | null
          semana_numero: number
          updated_at?: string
        }
        Update: {
          ano?: number
          created_at?: string
          estado?: string
          fecha?: string
          id?: string
          motivo_cancelacion?: string | null
          numero_acta?: number | null
          observaciones?: string | null
          semana_numero?: number
          updated_at?: string
        }
        Relationships: []
      }
      trabajo_campo: {
        Row: {
          actividad: string
          archivado: boolean
          created_at: string
          encuentros: Json | null
          fecha: string
          id: string
          lugar: string
          observaciones: string | null
          participantes: string[] | null
          profesional_responsable: string | null
          resultados: string | null
          updated_at: string
        }
        Insert: {
          actividad: string
          archivado?: boolean
          created_at?: string
          encuentros?: Json | null
          fecha: string
          id?: string
          lugar: string
          observaciones?: string | null
          participantes?: string[] | null
          profesional_responsable?: string | null
          resultados?: string | null
          updated_at?: string
        }
        Update: {
          actividad?: string
          archivado?: boolean
          created_at?: string
          encuentros?: Json | null
          fecha?: string
          id?: string
          lugar?: string
          observaciones?: string | null
          participantes?: string[] | null
          profesional_responsable?: string | null
          resultados?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_example_user: {
        Args: {
          user_apellido?: string
          user_email: string
          user_nombre?: string
          user_password: string
          user_role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_authorized_for_mujeres: { Args: { user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "administrador" | "coordinador" | "trabajador"
      rol_reunion: "reflexion" | "coordinacion" | "acta"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["administrador", "coordinador", "trabajador"],
      rol_reunion: ["reflexion", "coordinacion", "acta"],
    },
  },
} as const
