export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      archived_orders: {
        Row: {
          archived_at: string
          archived_by: string | null
          created_at: string
          hotel_id: string
          id: string
          items: string
          order_items_json: Json | null
          original_created_at: string
          original_order_id: string
          payment_method: string | null
          room_number: string
          special_instructions: string | null
          status: string
          total: number
        }
        Insert: {
          archived_at?: string
          archived_by?: string | null
          created_at?: string
          hotel_id: string
          id?: string
          items: string
          order_items_json?: Json | null
          original_created_at: string
          original_order_id: string
          payment_method?: string | null
          room_number: string
          special_instructions?: string | null
          status: string
          total: number
        }
        Update: {
          archived_at?: string
          archived_by?: string | null
          created_at?: string
          hotel_id?: string
          id?: string
          items?: string
          order_items_json?: Json | null
          original_created_at?: string
          original_order_id?: string
          payment_method?: string | null
          room_number?: string
          special_instructions?: string | null
          status?: string
          total?: number
        }
        Relationships: []
      }
      daily_closures: {
        Row: {
          cancelled_orders: number
          closure_date: string
          completed_orders: number
          created_at: string
          deleted_orders: number
          hotel_id: string
          id: string
          payment_methods_detail: Json
          total_orders: number
          total_revenue: number
          updated_at: string
        }
        Insert: {
          cancelled_orders?: number
          closure_date: string
          completed_orders?: number
          created_at?: string
          deleted_orders?: number
          hotel_id: string
          id?: string
          payment_methods_detail?: Json
          total_orders?: number
          total_revenue?: number
          updated_at?: string
        }
        Update: {
          cancelled_orders?: number
          closure_date?: string
          completed_orders?: number
          created_at?: string
          deleted_orders?: number
          hotel_id?: string
          id?: string
          payment_methods_detail?: Json
          total_orders?: number
          total_revenue?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_daily_closures_hotel_id"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotel_user_settings"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          content: string | null
          embedding: string | null
          id: number
          metadata: Json | null
        }
        Insert: {
          content?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
        }
        Update: {
          content?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
        }
        Relationships: []
      }
      hotel_user_settings: {
        Row: {
          agent_name: string | null
          auth_provider: string | null
          created_at: string
          email: string | null
          hotel_id: string | null
          hotel_name: string | null
          id: string
          is_active: boolean | null
          password_hash: string | null
          phone_roomservice: string | null
          updated_at: string
          user_role: Database["public"]["Enums"]["user_role"] | null
        }
        Insert: {
          agent_name?: string | null
          auth_provider?: string | null
          created_at?: string
          email?: string | null
          hotel_id?: string | null
          hotel_name?: string | null
          id?: string
          is_active?: boolean | null
          password_hash?: string | null
          phone_roomservice?: string | null
          updated_at?: string
          user_role?: Database["public"]["Enums"]["user_role"] | null
        }
        Update: {
          agent_name?: string | null
          auth_provider?: string | null
          created_at?: string
          email?: string | null
          hotel_id?: string | null
          hotel_name?: string | null
          id?: string
          is_active?: boolean | null
          password_hash?: string | null
          phone_roomservice?: string | null
          updated_at?: string
          user_role?: Database["public"]["Enums"]["user_role"] | null
        }
        Relationships: []
      }
      ingredient_supplier_mapping: {
        Row: {
          conversion_factor: number
          created_at: string
          hotel_id: string
          id: string
          ingredient_name: string
          supplier_product_id: string
        }
        Insert: {
          conversion_factor?: number
          created_at?: string
          hotel_id: string
          id?: string
          ingredient_name: string
          supplier_product_id: string
        }
        Update: {
          conversion_factor?: number
          created_at?: string
          hotel_id?: string
          id?: string
          ingredient_name?: string
          supplier_product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ingredient_supplier_mapping_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotel_user_settings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingredient_supplier_mapping_supplier_product_id_fkey"
            columns: ["supplier_product_id"]
            isOneToOne: false
            referencedRelation: "supplier_products"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_categories: {
        Row: {
          created_at: string
          description: string | null
          display_order: number | null
          hotel_id: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          hotel_id: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          hotel_id?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      menu_items: {
        Row: {
          allergens: string[] | null
          available: boolean | null
          category_id: string | null
          created_at: string
          description: string | null
          hotel_id: string
          id: string
          image_url: string | null
          ingredients: string | null
          name: string
          preparation_time: number | null
          price: number
          updated_at: string
        }
        Insert: {
          allergens?: string[] | null
          available?: boolean | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          hotel_id: string
          id?: string
          image_url?: string | null
          ingredients?: string | null
          name: string
          preparation_time?: number | null
          price: number
          updated_at?: string
        }
        Update: {
          allergens?: string[] | null
          available?: boolean | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          hotel_id?: string
          id?: string
          image_url?: string | null
          ingredients?: string | null
          name?: string
          preparation_time?: number | null
          price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "menu_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_items_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotel_user_settings"
            referencedColumns: ["id"]
          },
        ]
      }
      n8n_chat_histories: {
        Row: {
          id: number
          message: Json
          session_id: string
        }
        Insert: {
          id?: number
          message: Json
          session_id: string
        }
        Update: {
          id?: number
          message?: Json
          session_id?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          hotel_id: string
          id: string
          menu_item_id: string
          order_id: string | null
          quantity: number
          room_number: string | null
          special_instructions: string | null
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          hotel_id: string
          id?: string
          menu_item_id: string
          order_id?: string | null
          quantity?: number
          room_number?: string | null
          special_instructions?: string | null
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string
          hotel_id?: string
          id?: string
          menu_item_id?: string
          order_id?: string | null
          quantity?: number
          room_number?: string | null
          special_instructions?: string | null
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_order_items_hotel_id"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotel_user_settings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_order_items_menu_item_id"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_order_items_order_id"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_order_items_order_id"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders_with_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_order_items_order_id"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders_with_items_backup"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          hotel_id: string
          id: string
          notes: string | null
          order_id: string | null
          payment_method: string | null
          room_number: string
          special_instructions: string | null
          status: string | null
          total: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          hotel_id: string
          id?: string
          notes?: string | null
          order_id?: string | null
          payment_method?: string | null
          room_number: string
          special_instructions?: string | null
          status?: string | null
          total?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          hotel_id?: string
          id?: string
          notes?: string | null
          order_id?: string | null
          payment_method?: string | null
          room_number?: string
          special_instructions?: string | null
          status?: string | null
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotel_user_settings"
            referencedColumns: ["id"]
          },
        ]
      }
      printershotels: {
        Row: {
          created_at: string
          hotel_id: string
          id: string
          name_printer: string | null
          printer_id: string | null
          printnode_api_key: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          hotel_id: string
          id?: string
          name_printer?: string | null
          printer_id?: string | null
          printnode_api_key?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          hotel_id?: string
          id?: string
          name_printer?: string | null
          printer_id?: string | null
          printnode_api_key?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      recipe_ingredients: {
        Row: {
          created_at: string
          id: string
          ingredient_name: string
          package_quantity: number
          price_unit: string
          quantity: number
          recipe_id: string
          supplier_product_id: string | null
          total_cost: number | null
          unit: string
          unit_cost: number
        }
        Insert: {
          created_at?: string
          id?: string
          ingredient_name: string
          package_quantity?: number
          price_unit?: string
          quantity: number
          recipe_id: string
          supplier_product_id?: string | null
          total_cost?: number | null
          unit?: string
          unit_cost: number
        }
        Update: {
          created_at?: string
          id?: string
          ingredient_name?: string
          package_quantity?: number
          price_unit?: string
          quantity?: number
          recipe_id?: string
          supplier_product_id?: string | null
          total_cost?: number | null
          unit?: string
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "recipe_ingredients_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipe_scandallos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_ingredients_supplier_product_id_fkey"
            columns: ["supplier_product_id"]
            isOneToOne: false
            referencedRelation: "supplier_products"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_scandallos: {
        Row: {
          allergens: string[] | null
          created_at: string
          hotel_id: string
          id: string
          image_url: string | null
          menu_item_id: string | null
          name: string
          notes: string | null
          portions: number
          profit_margin: number | null
          selling_price: number | null
          total_cost: number | null
          updated_at: string
        }
        Insert: {
          allergens?: string[] | null
          created_at?: string
          hotel_id: string
          id?: string
          image_url?: string | null
          menu_item_id?: string | null
          name: string
          notes?: string | null
          portions?: number
          profit_margin?: number | null
          selling_price?: number | null
          total_cost?: number | null
          updated_at?: string
        }
        Update: {
          allergens?: string[] | null
          created_at?: string
          hotel_id?: string
          id?: string
          image_url?: string | null
          menu_item_id?: string | null
          name?: string
          notes?: string | null
          portions?: number
          profit_margin?: number | null
          selling_price?: number | null
          total_cost?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_scandallos_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotel_user_settings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_scandallos_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_steps: {
        Row: {
          created_at: string
          description: string
          id: string
          recipe_id: string
          step_number: number
          temperature: number | null
          time_minutes: number | null
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          recipe_id: string
          step_number: number
          temperature?: number | null
          time_minutes?: number | null
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          recipe_id?: string
          step_number?: number
          temperature?: number | null
          time_minutes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "recipe_steps_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipe_scandallos"
            referencedColumns: ["id"]
          },
        ]
      }
      security_audit_log: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          hotel_id: string | null
          id: string
          ip_address: unknown | null
          resource_id: string | null
          resource_type: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          hotel_id?: string | null
          id?: string
          ip_address?: unknown | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          hotel_id?: string | null
          id?: string
          ip_address?: unknown | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      supplier_products: {
        Row: {
          created_at: string
          id: string
          name: string
          package_size: number
          price: number
          reference: string | null
          supplier_id: string
          unit: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          package_size?: number
          price?: number
          reference?: string | null
          supplier_id: string
          unit?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          package_size?: number
          price?: number
          reference?: string | null
          supplier_id?: string
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_products_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          hotel_id: string
          id: string
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          hotel_id: string
          id?: string
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          hotel_id?: string
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotel_user_settings"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      orders_with_items: {
        Row: {
          created_at: string | null
          hotel_id: string | null
          id: string | null
          items: Json | null
          notes: string | null
          payment_method: string | null
          room_number: string | null
          special_instructions: string | null
          status: string | null
          total: number | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotel_user_settings"
            referencedColumns: ["id"]
          },
        ]
      }
      orders_with_items_backup: {
        Row: {
          created_at: string | null
          hotel_id: string | null
          id: string | null
          items: Json | null
          notes: string | null
          payment_method: string | null
          room_number: string | null
          special_instructions: string | null
          status: string | null
          total: number | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotel_user_settings"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      can_access_order: {
        Args: { order_hotel_id: string }
        Returns: boolean
      }
      check_rate_limit_with_audit: {
        Args: {
          action_name: string
          max_requests?: number
          window_minutes?: number
        }
        Returns: boolean
      }
      check_secure_rate_limit: {
        Args: {
          action_name: string
          max_requests?: number
          window_minutes?: number
        }
        Returns: boolean
      }
      cleanup_orphaned_order_items: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      delete_order_with_items: {
        Args: { order_id_param: string; hotel_id_param: string }
        Returns: undefined
      }
      encrypt_password: {
        Args: { password: string }
        Returns: string
      }
      get_current_user_email: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_user_hotel_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_hotel_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      is_hotel_manager: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: string
      }
      log_security_event: {
        Args: {
          p_action: string
          p_resource_type?: string
          p_resource_id?: string
          p_details?: Json
        }
        Returns: undefined
      }
      match_documents: {
        Args: { query_embedding: string; match_count?: number; filter?: Json }
        Returns: {
          id: number
          content: string
          metadata: Json
          similarity: number
        }[]
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      user_has_hotel_access: {
        Args: { target_hotel_id: string }
        Returns: boolean
      }
      validate_session_integrity: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      validate_user_session_integrity: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      verify_password: {
        Args: { password: string; hash: string }
        Returns: boolean
      }
    }
    Enums: {
      user_role: "super_admin" | "hotel_admin" | "hotel_manager"
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
      user_role: ["super_admin", "hotel_admin", "hotel_manager"],
    },
  },
} as const
