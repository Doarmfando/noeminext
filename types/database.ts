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
    PostgrestVersion: "13.0.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      categorias: {
        Row: {
          descripcion: string | null
          id: string
          nombre: string
          visible: boolean | null
        }
        Insert: {
          descripcion?: string | null
          id?: string
          nombre: string
          visible?: boolean | null
        }
        Update: {
          descripcion?: string | null
          id?: string
          nombre?: string
          visible?: boolean | null
        }
        Relationships: []
      }
      contenedores: {
        Row: {
          capacidad: number | null
          codigo: string | null
          created_at: string | null
          created_by: string | null
          descripcion: string | null
          id: string
          nombre: string
          tipo_contenedor_id: string | null
          updated_at: string | null
          updated_by: string | null
          visible: boolean | null
        }
        Insert: {
          capacidad?: number | null
          codigo?: string | null
          created_at?: string | null
          created_by?: string | null
          descripcion?: string | null
          id?: string
          nombre: string
          tipo_contenedor_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
          visible?: boolean | null
        }
        Update: {
          capacidad?: number | null
          codigo?: string | null
          created_at?: string | null
          created_by?: string | null
          descripcion?: string | null
          id?: string
          nombre?: string
          tipo_contenedor_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
          visible?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "contenedores_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contenedores_tipo_contenedor_id_fkey"
            columns: ["tipo_contenedor_id"]
            isOneToOne: false
            referencedRelation: "tipos_contenedor"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contenedores_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      detalle_contenedor: {
        Row: {
          cantidad: number | null
          contenedor_id: string | null
          created_at: string | null
          created_by: string | null
          empaquetado: string | null
          estado_producto_id: string | null
          fecha_vencimiento: string | null
          id: string
          precio_real_unidad: number | null
          producto_id: string | null
          updated_at: string | null
          updated_by: string | null
          visible: boolean | null
        }
        Insert: {
          cantidad?: number | null
          contenedor_id?: string | null
          created_at?: string | null
          created_by?: string | null
          empaquetado?: string | null
          estado_producto_id?: string | null
          fecha_vencimiento?: string | null
          id?: string
          precio_real_unidad?: number | null
          producto_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
          visible?: boolean | null
        }
        Update: {
          cantidad?: number | null
          contenedor_id?: string | null
          created_at?: string | null
          created_by?: string | null
          empaquetado?: string | null
          estado_producto_id?: string | null
          fecha_vencimiento?: string | null
          id?: string
          precio_real_unidad?: number | null
          producto_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
          visible?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "detalle_contenedor_contenedor_id_fkey"
            columns: ["contenedor_id"]
            isOneToOne: false
            referencedRelation: "contenedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "detalle_contenedor_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "detalle_contenedor_estado_producto_id_fkey"
            columns: ["estado_producto_id"]
            isOneToOne: false
            referencedRelation: "estados_producto"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "detalle_contenedor_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "detalle_contenedor_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      estados_inventario: {
        Row: {
          descripcion: string | null
          id: string
          nombre: string
          visible: boolean | null
        }
        Insert: {
          descripcion?: string | null
          id?: string
          nombre: string
          visible?: boolean | null
        }
        Update: {
          descripcion?: string | null
          id?: string
          nombre?: string
          visible?: boolean | null
        }
        Relationships: []
      }
      estados_producto: {
        Row: {
          descripcion: string | null
          id: string
          nombre: string
          visible: boolean | null
        }
        Insert: {
          descripcion?: string | null
          id?: string
          nombre: string
          visible?: boolean | null
        }
        Update: {
          descripcion?: string | null
          id?: string
          nombre?: string
          visible?: boolean | null
        }
        Relationships: []
      }
      log_eventos: {
        Row: {
          accion: string
          descripcion: string | null
          fecha_evento: string | null
          id: string
          registro_afectado_id: string | null
          registro_id: string | null
          tabla_afectada: string | null
          usuario_id: string | null
        }
        Insert: {
          accion: string
          descripcion?: string | null
          fecha_evento?: string | null
          id?: string
          registro_afectado_id?: string | null
          registro_id?: string | null
          tabla_afectada?: string | null
          usuario_id?: string | null
        }
        Update: {
          accion?: string
          descripcion?: string | null
          fecha_evento?: string | null
          id?: string
          registro_afectado_id?: string | null
          registro_id?: string | null
          tabla_afectada?: string | null
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "log_eventos_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      motivos_movimiento: {
        Row: {
          descripcion: string | null
          id: string
          nombre: string
          tipo_movimiento: Database["public"]["Enums"]["tipo_movimiento_enum"]
          visible: boolean | null
        }
        Insert: {
          descripcion?: string | null
          id?: string
          nombre: string
          tipo_movimiento: Database["public"]["Enums"]["tipo_movimiento_enum"]
          visible?: boolean | null
        }
        Update: {
          descripcion?: string | null
          id?: string
          nombre?: string
          tipo_movimiento?: Database["public"]["Enums"]["tipo_movimiento_enum"]
          visible?: boolean | null
        }
        Relationships: []
      }
      movimientos: {
        Row: {
          cantidad: number | null
          contenedor_id: string | null
          created_by: string | null
          fecha_movimiento: string | null
          id: string
          id_lote: string | null
          motivo_movimiento_id: string | null
          numero_documento: string | null
          observacion: string | null
          precio_real: number | null
          producto_id: string | null
          stock_anterior: number | null
          stock_nuevo: number | null
          updated_by: string | null
        }
        Insert: {
          cantidad?: number | null
          contenedor_id?: string | null
          created_by?: string | null
          fecha_movimiento?: string | null
          id?: string
          id_lote?: string | null
          motivo_movimiento_id?: string | null
          numero_documento?: string | null
          observacion?: string | null
          precio_real?: number | null
          producto_id?: string | null
          stock_anterior?: number | null
          stock_nuevo?: number | null
          updated_by?: string | null
        }
        Update: {
          cantidad?: number | null
          contenedor_id?: string | null
          created_by?: string | null
          fecha_movimiento?: string | null
          id?: string
          id_lote?: string | null
          motivo_movimiento_id?: string | null
          numero_documento?: string | null
          observacion?: string | null
          precio_real?: number | null
          producto_id?: string | null
          stock_anterior?: number | null
          stock_nuevo?: number | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "movimientos_contenedor_id_fkey"
            columns: ["contenedor_id"]
            isOneToOne: false
            referencedRelation: "contenedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimientos_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimientos_id_lote_fkey"
            columns: ["id_lote"]
            isOneToOne: false
            referencedRelation: "detalle_contenedor"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimientos_motivo_movimiento_id_fkey"
            columns: ["motivo_movimiento_id"]
            isOneToOne: false
            referencedRelation: "motivos_movimiento"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimientos_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimientos_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      permisos: {
        Row: {
          id: string
          codigo: string
          nombre: string
          descripcion: string | null
          categoria: string
          tipo: string
          created_at: string | null
          visible: boolean | null
        }
        Insert: {
          id?: string
          codigo: string
          nombre: string
          descripcion?: string | null
          categoria: string
          tipo: string
          created_at?: string | null
          visible?: boolean | null
        }
        Update: {
          id?: string
          codigo?: string
          nombre?: string
          descripcion?: string | null
          categoria?: string
          tipo?: string
          created_at?: string | null
          visible?: boolean | null
        }
        Relationships: []
      }
      producto_contenedor: {
        Row: {
          contenedor_id: string
          es_fijo: boolean | null
          producto_id: string
        }
        Insert: {
          contenedor_id: string
          es_fijo?: boolean | null
          producto_id: string
        }
        Update: {
          contenedor_id?: string
          es_fijo?: boolean | null
          producto_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "producto_contenedor_contenedor_id_fkey"
            columns: ["contenedor_id"]
            isOneToOne: false
            referencedRelation: "contenedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "producto_contenedor_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
        ]
      }
      productos: {
        Row: {
          categoria_id: string | null
          codigo: string | null
          created_at: string | null
          created_by: string | null
          descripcion: string | null
          es_perecedero: boolean | null
          estado_inventario_id: string | null
          id: string
          nombre: string
          precio_estimado: number | null
          stock_min: number | null
          unidad_medida_id: string | null
          unidades_por_caja: number | null
          updated_at: string | null
          updated_by: string | null
          visible: boolean | null
        }
        Insert: {
          categoria_id?: string | null
          codigo?: string | null
          created_at?: string | null
          created_by?: string | null
          descripcion?: string | null
          es_perecedero?: boolean | null
          estado_inventario_id?: string | null
          id?: string
          nombre: string
          precio_estimado?: number | null
          stock_min?: number | null
          unidad_medida_id?: string | null
          unidades_por_caja?: number | null
          updated_at?: string | null
          updated_by?: string | null
          visible?: boolean | null
        }
        Update: {
          categoria_id?: string | null
          codigo?: string | null
          created_at?: string | null
          created_by?: string | null
          descripcion?: string | null
          es_perecedero?: boolean | null
          estado_inventario_id?: string | null
          id?: string
          nombre?: string
          precio_estimado?: number | null
          stock_min?: number | null
          unidad_medida_id?: string | null
          unidades_por_caja?: number | null
          updated_at?: string | null
          updated_by?: string | null
          visible?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "productos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "productos_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "productos_estado_inventario_id_fkey"
            columns: ["estado_inventario_id"]
            isOneToOne: false
            referencedRelation: "estados_inventario"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "productos_unidad_medida_id_fkey"
            columns: ["unidad_medida_id"]
            isOneToOne: false
            referencedRelation: "unidades_medida"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "productos_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      rol_permisos: {
        Row: {
          id: string
          rol_id: string
          permiso_id: string
          created_at: string | null
        }
        Insert: {
          id?: string
          rol_id: string
          permiso_id: string
          created_at?: string | null
        }
        Update: {
          id?: string
          rol_id?: string
          permiso_id?: string
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rol_permisos_rol_id_fkey"
            columns: ["rol_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rol_permisos_permiso_id_fkey"
            columns: ["permiso_id"]
            isOneToOne: false
            referencedRelation: "permisos"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          descripcion: string | null
          id: string
          nombre: string
          visible: boolean | null
        }
        Insert: {
          descripcion?: string | null
          id?: string
          nombre: string
          visible?: boolean | null
        }
        Update: {
          descripcion?: string | null
          id?: string
          nombre?: string
          visible?: boolean | null
        }
        Relationships: []
      }
      tipos_contenedor: {
        Row: {
          descripcion: string | null
          id: string
          nombre: string
          visible: boolean | null
        }
        Insert: {
          descripcion?: string | null
          id?: string
          nombre: string
          visible?: boolean | null
        }
        Update: {
          descripcion?: string | null
          id?: string
          nombre?: string
          visible?: boolean | null
        }
        Relationships: []
      }
      unidades_medida: {
        Row: {
          abreviatura: string
          id: string
          nombre: string
          visible: boolean | null
        }
        Insert: {
          abreviatura: string
          id?: string
          nombre: string
          visible?: boolean | null
        }
        Update: {
          abreviatura?: string
          id?: string
          nombre?: string
          visible?: boolean | null
        }
        Relationships: []
      }
      usuarios: {
        Row: {
          auth_user_id: string | null
          clave: string | null
          created_at: string | null
          email: string | null
          id: string
          nombre: string | null
          nombre_usuario: string
          rol_id: string | null
          updated_at: string | null
          visible: boolean | null
        }
        Insert: {
          auth_user_id?: string | null
          clave?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          nombre?: string | null
          nombre_usuario: string
          rol_id?: string | null
          updated_at?: string | null
          visible?: boolean | null
        }
        Update: {
          auth_user_id?: string | null
          clave?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          nombre?: string | null
          nombre_usuario?: string
          rol_id?: string | null
          updated_at?: string | null
          visible?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_rol_id_fkey"
            columns: ["rol_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      tipo_movimiento_enum: "entrada" | "salida" | "ajuste"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      tipo_movimiento_enum: ["entrada", "salida", "ajuste"],
    },
  },
} as const
