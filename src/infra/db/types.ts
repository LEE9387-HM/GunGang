// 자동 생성 파일 — 수동 편집 금지.
// 재생성: Supabase MCP generate_typescript_types (project: pscnvtuorxjibjzkrlit)
// 스키마 변경 시 db/migrations 적용 후 이 파일을 함께 갱신한다.
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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_review: {
        Row: {
          decision: string
          id: string
          note: string | null
          product_id: string
          reviewed_at: string
          reviewer: string
        }
        Insert: {
          decision: string
          id?: string
          note?: string | null
          product_id: string
          reviewed_at?: string
          reviewer: string
        }
        Update: {
          decision?: string
          id?: string
          note?: string | null
          product_id?: string
          reviewed_at?: string
          reviewer?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_review_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product"
            referencedColumns: ["id"]
          },
        ]
      }
      analysis_result: {
        Row: {
          created_at: string
          duplications: Json
          id: string
          input_snapshot: Json
          rule_version_id: string | null
          user_id: string
          warnings: Json
        }
        Insert: {
          created_at?: string
          duplications?: Json
          id?: string
          input_snapshot: Json
          rule_version_id?: string | null
          user_id: string
          warnings?: Json
        }
        Update: {
          created_at?: string
          duplications?: Json
          id?: string
          input_snapshot?: Json
          rule_version_id?: string | null
          user_id?: string
          warnings?: Json
        }
        Relationships: [
          {
            foreignKeyName: "analysis_result_rule_version_id_fkey"
            columns: ["rule_version_id"]
            isOneToOne: false
            referencedRelation: "rule_version"
            referencedColumns: ["id"]
          },
        ]
      }
      app_admin: {
        Row: {
          created_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          user_id?: string
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          actor: string
          after: Json | null
          at: string
          before: Json | null
          entity: string
          entity_id: string | null
          id: number
        }
        Insert: {
          action: string
          actor: string
          after?: Json | null
          at?: string
          before?: Json | null
          entity: string
          entity_id?: string | null
          id?: never
        }
        Update: {
          action?: string
          actor?: string
          after?: Json | null
          at?: string
          before?: Json | null
          entity?: string
          entity_id?: string | null
          id?: never
        }
        Relationships: []
      }
      brand: {
        Row: {
          company_id: string | null
          id: string
          name: string
        }
        Insert: {
          company_id?: string | null
          id?: string
          name: string
        }
        Update: {
          company_id?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "brand_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company"
            referencedColumns: ["id"]
          },
        ]
      }
      category: {
        Row: {
          id: string
          name: string
          slug: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      company: {
        Row: {
          created_at: string
          id: string
          name: string
          role: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          role?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          role?: string | null
        }
        Relationships: []
      }
      company_alias: {
        Row: {
          alias: string
          alias_normalized: string
          company_id: string
          id: string
          source: string | null
        }
        Insert: {
          alias: string
          alias_normalized: string
          company_id: string
          id?: string
          source?: string | null
        }
        Update: {
          alias?: string
          alias_normalized?: string
          company_id?: string
          id?: string
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_alias_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company"
            referencedColumns: ["id"]
          },
        ]
      }
      evidence_source: {
        Row: {
          id: string
          license: string | null
          org: string
          title: string
          url: string | null
        }
        Insert: {
          id?: string
          license?: string | null
          org: string
          title: string
          url?: string | null
        }
        Update: {
          id?: string
          license?: string | null
          org?: string
          title?: string
          url?: string | null
        }
        Relationships: []
      }
      functional_claim: {
        Row: {
          claim_text: string
          id: string
          ingredient_id: string | null
          product_id: string
          source: string | null
        }
        Insert: {
          claim_text: string
          id?: string
          ingredient_id?: string | null
          product_id: string
          source?: string | null
        }
        Update: {
          claim_text?: string
          id?: string
          ingredient_id?: string | null
          product_id?: string
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "functional_claim_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredient"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "functional_claim_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product"
            referencedColumns: ["id"]
          },
        ]
      }
      import_job: {
        Row: {
          error: Json | null
          finished_at: string | null
          id: string
          params: Json | null
          source: string
          started_at: string
          success_count: number | null
          total_count: number | null
        }
        Insert: {
          error?: Json | null
          finished_at?: string | null
          id?: string
          params?: Json | null
          source: string
          started_at?: string
          success_count?: number | null
          total_count?: number | null
        }
        Update: {
          error?: Json | null
          finished_at?: string | null
          id?: string
          params?: Json | null
          source?: string
          started_at?: string
          success_count?: number | null
          total_count?: number | null
        }
        Relationships: []
      }
      ingredient: {
        Row: {
          created_at: string
          id: string
          is_functional: boolean
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_functional?: boolean
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          is_functional?: boolean
          name?: string
          slug?: string
        }
        Relationships: []
      }
      ingredient_alias: {
        Row: {
          alias: string
          alias_normalized: string
          id: string
          ingredient_id: string
          source: string | null
        }
        Insert: {
          alias: string
          alias_normalized: string
          id?: string
          ingredient_id: string
          source?: string | null
        }
        Update: {
          alias?: string
          alias_normalized?: string
          id?: string
          ingredient_id?: string
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ingredient_alias_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredient"
            referencedColumns: ["id"]
          },
        ]
      }
      precaution: {
        Row: {
          body: string
          id: string
          ingredient_id: string | null
          product_id: string | null
          source: string
        }
        Insert: {
          body: string
          id?: string
          ingredient_id?: string | null
          product_id?: string | null
          source: string
        }
        Update: {
          body?: string
          id?: string
          ingredient_id?: string | null
          product_id?: string | null
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "precaution_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredient"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "precaution_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product"
            referencedColumns: ["id"]
          },
        ]
      }
      price_entry: {
        Row: {
          collected_at: string
          id: string
          price_krw: number
          price_type: Database["public"]["Enums"]["price_type"]
          retailer_id: string
          shipping_krw: number
          url: string | null
          variant_id: string
        }
        Insert: {
          collected_at?: string
          id?: string
          price_krw: number
          price_type?: Database["public"]["Enums"]["price_type"]
          retailer_id: string
          shipping_krw?: number
          url?: string | null
          variant_id: string
        }
        Update: {
          collected_at?: string
          id?: string
          price_krw?: number
          price_type?: Database["public"]["Enums"]["price_type"]
          retailer_id?: string
          shipping_krw?: number
          url?: string | null
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_entry_retailer_id_fkey"
            columns: ["retailer_id"]
            isOneToOne: false
            referencedRelation: "retailer"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_entry_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variant"
            referencedColumns: ["id"]
          },
        ]
      }
      product: {
        Row: {
          brand_id: string | null
          category_id: string | null
          company_id: string | null
          created_at: string
          daily_serving_count: number | null
          data_status: Database["public"]["Enums"]["data_status"]
          dosage_form: string | null
          id: string
          intake_method: string | null
          name: string
          report_no: string | null
          source_registered_at: string | null
          supersedes_product_id: string | null
          units_per_serving: number | null
          updated_at: string
          verified_at: string | null
        }
        Insert: {
          brand_id?: string | null
          category_id?: string | null
          company_id?: string | null
          created_at?: string
          daily_serving_count?: number | null
          data_status?: Database["public"]["Enums"]["data_status"]
          dosage_form?: string | null
          id?: string
          intake_method?: string | null
          name: string
          report_no?: string | null
          source_registered_at?: string | null
          supersedes_product_id?: string | null
          units_per_serving?: number | null
          updated_at?: string
          verified_at?: string | null
        }
        Update: {
          brand_id?: string | null
          category_id?: string | null
          company_id?: string | null
          created_at?: string
          daily_serving_count?: number | null
          data_status?: Database["public"]["Enums"]["data_status"]
          dosage_form?: string | null
          id?: string
          intake_method?: string | null
          name?: string
          report_no?: string | null
          source_registered_at?: string | null
          supersedes_product_id?: string | null
          units_per_serving?: number | null
          updated_at?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brand"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "category"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_supersedes_product_id_fkey"
            columns: ["supersedes_product_id"]
            isOneToOne: false
            referencedRelation: "product"
            referencedColumns: ["id"]
          },
        ]
      }
      product_evaluation: {
        Row: {
          calculated_at: string
          dimension_grades: Json
          id: string
          missing_dimensions: Json
          product_id: string
          rule_version_id: string
        }
        Insert: {
          calculated_at?: string
          dimension_grades: Json
          id?: string
          missing_dimensions?: Json
          product_id: string
          rule_version_id: string
        }
        Update: {
          calculated_at?: string
          dimension_grades?: Json
          id?: string
          missing_dimensions?: Json
          product_id?: string
          rule_version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_evaluation_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_evaluation_rule_version_id_fkey"
            columns: ["rule_version_id"]
            isOneToOne: false
            referencedRelation: "rule_version"
            referencedColumns: ["id"]
          },
        ]
      }
      product_ingredient: {
        Row: {
          amount_normalized: number | null
          conversion_id: string | null
          form_labels: string[]
          id: string
          ingredient_id: string
          is_key_functional: boolean
          parse_confidence: string | null
          per_amount: number | null
          per_unit: string | null
          product_id: string
          qualifier: string | null
          raw_amount_text: string
          unit_normalized: string | null
        }
        Insert: {
          amount_normalized?: number | null
          conversion_id?: string | null
          form_labels?: string[]
          id?: string
          ingredient_id: string
          is_key_functional?: boolean
          parse_confidence?: string | null
          per_amount?: number | null
          per_unit?: string | null
          product_id: string
          qualifier?: string | null
          raw_amount_text: string
          unit_normalized?: string | null
        }
        Update: {
          amount_normalized?: number | null
          conversion_id?: string | null
          form_labels?: string[]
          id?: string
          ingredient_id?: string
          is_key_functional?: boolean
          parse_confidence?: string | null
          per_amount?: number | null
          per_unit?: string | null
          product_id?: string
          qualifier?: string | null
          raw_amount_text?: string
          unit_normalized?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_ingredient_conversion_id_fkey"
            columns: ["conversion_id"]
            isOneToOne: false
            referencedRelation: "unit_conversion"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_ingredient_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredient"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_ingredient_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variant: {
        Row: {
          created_at: string
          id: string
          label: string
          product_id: string
          total_units: number
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          product_id: string
          total_units: number
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          product_id?: string
          total_units?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_variant_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product"
            referencedColumns: ["id"]
          },
        ]
      }
      retailer: {
        Row: {
          id: string
          name: string
          url: string | null
        }
        Insert: {
          id?: string
          name: string
          url?: string | null
        }
        Update: {
          id?: string
          name?: string
          url?: string | null
        }
        Relationships: []
      }
      rule_version: {
        Row: {
          category_id: string | null
          definition: Json
          id: string
          kind: Database["public"]["Enums"]["rule_kind"]
          published_at: string | null
          published_by: string | null
          status: Database["public"]["Enums"]["rule_status"]
        }
        Insert: {
          category_id?: string | null
          definition: Json
          id: string
          kind: Database["public"]["Enums"]["rule_kind"]
          published_at?: string | null
          published_by?: string | null
          status?: Database["public"]["Enums"]["rule_status"]
        }
        Update: {
          category_id?: string | null
          definition?: Json
          id?: string
          kind?: Database["public"]["Enums"]["rule_kind"]
          published_at?: string | null
          published_by?: string | null
          status?: Database["public"]["Enums"]["rule_status"]
        }
        Relationships: [
          {
            foreignKeyName: "rule_version_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "category"
            referencedColumns: ["id"]
          },
        ]
      }
      source_snapshot: {
        Row: {
          collected_at: string
          evidence_source_id: string | null
          id: string
          import_job_id: string | null
          product_id: string | null
          raw: Json
        }
        Insert: {
          collected_at?: string
          evidence_source_id?: string | null
          id?: string
          import_job_id?: string | null
          product_id?: string | null
          raw: Json
        }
        Update: {
          collected_at?: string
          evidence_source_id?: string | null
          id?: string
          import_job_id?: string | null
          product_id?: string | null
          raw?: Json
        }
        Relationships: [
          {
            foreignKeyName: "source_snapshot_evidence_source_id_fkey"
            columns: ["evidence_source_id"]
            isOneToOne: false
            referencedRelation: "evidence_source"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "source_snapshot_import_job_id_fkey"
            columns: ["import_job_id"]
            isOneToOne: false
            referencedRelation: "import_job"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "source_snapshot_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product"
            referencedColumns: ["id"]
          },
        ]
      }
      unit_conversion: {
        Row: {
          effective_from: string | null
          factor: number
          from_unit: string
          id: string
          ingredient_id: string
          source: string
          to_unit: string
        }
        Insert: {
          effective_from?: string | null
          factor: number
          from_unit: string
          id: string
          ingredient_id: string
          source: string
          to_unit: string
        }
        Update: {
          effective_from?: string | null
          factor?: number
          from_unit?: string
          id?: string
          ingredient_id?: string
          source?: string
          to_unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "unit_conversion_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredient"
            referencedColumns: ["id"]
          },
        ]
      }
      user_consent: {
        Row: {
          agreed_at: string
          id: string
          kind: string
          user_id: string
        }
        Insert: {
          agreed_at?: string
          id?: string
          kind: string
          user_id: string
        }
        Update: {
          agreed_at?: string
          id?: string
          kind?: string
          user_id?: string
        }
        Relationships: []
      }
      user_supplement: {
        Row: {
          created_at: string
          daily_servings: number
          id: string
          product_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          daily_servings?: number
          id?: string
          product_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          daily_servings?: number
          id?: string
          product_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_supplement_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_own_account: { Args: never; Returns: undefined }
      is_admin: { Args: never; Returns: boolean }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      data_status:
        | "imported"
        | "normalized"
        | "staging"
        | "verified"
        | "conflict"
        | "stale"
        | "discontinued"
      price_type: "normal" | "sale" | "subscription"
      rule_kind: "evaluation" | "duplication" | "upper_limit"
      rule_status: "draft" | "active" | "retired"
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
      data_status: [
        "imported",
        "normalized",
        "staging",
        "verified",
        "conflict",
        "stale",
        "discontinued",
      ],
      price_type: ["normal", "sale", "subscription"],
      rule_kind: ["evaluation", "duplication", "upper_limit"],
      rule_status: ["draft", "active", "retired"],
    },
  },
} as const
