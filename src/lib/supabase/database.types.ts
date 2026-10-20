export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: { Args: { extensions?: Json; operationName?: string; query?: string; variables?: Json }; Returns: Json };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      categories: {
        Row: {
          active: boolean;
          created_at: string;
          description: string;
          garment: Database["public"]["Enums"]["garment_kind"];
          id: string;
          kicker: string;
          name: string;
          show_on_home: boolean;
          slug: string;
          sort_order: number;
        };
        ComputedFields: never;
        Insert: {
          active?: boolean;
          created_at?: string;
          description?: string;
          garment: Database["public"]["Enums"]["garment_kind"];
          id?: string;
          kicker?: string;
          name: string;
          show_on_home?: boolean;
          slug: string;
          sort_order?: number;
        };
        Update: {
          active?: boolean;
          created_at?: string;
          description?: string;
          garment?: Database["public"]["Enums"]["garment_kind"];
          id?: string;
          kicker?: string;
          name?: string;
          show_on_home?: boolean;
          slug?: string;
          sort_order?: number;
        };
        Relationships: [];
      };
      collections: {
        Row: {
          active: boolean;
          created_at: string;
          description: string;
          id: string;
          kicker: string;
          show_in_nav: boolean;
          slug: string;
          sort_order: number;
          title: string;
        };
        ComputedFields: never;
        Insert: {
          active?: boolean;
          created_at?: string;
          description?: string;
          id?: string;
          kicker?: string;
          show_in_nav?: boolean;
          slug: string;
          sort_order?: number;
          title: string;
        };
        Update: {
          active?: boolean;
          created_at?: string;
          description?: string;
          id?: string;
          kicker?: string;
          show_in_nav?: boolean;
          slug?: string;
          sort_order?: number;
          title?: string;
        };
        Relationships: [];
      };
      colors: {
        Row: {
          active: boolean;
          hex: string;
          id: string;
          label: string;
          slug: string;
          sort_order: number;
        };
        ComputedFields: never;
        Insert: {
          active?: boolean;
          hex: string;
          id?: string;
          label: string;
          slug: string;
          sort_order?: number;
        };
        Update: {
          active?: boolean;
          hex?: string;
          id?: string;
          label?: string;
          slug?: string;
          sort_order?: number;
        };
        Relationships: [];
      };
      newsletter_subscribers: {
        Row: {
          created_at: string;
          email: string;
          id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          email: string;
          id?: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          id?: string;
        };
        Relationships: [];
      };
      product_collections: {
        Row: {
          collection_id: string;
          product_id: string;
        };
        ComputedFields: never;
        Insert: {
          collection_id: string;
          product_id: string;
        };
        Update: {
          collection_id?: string;
          product_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_collections_collection_id_fkey";
            columns: ["collection_id"];
            isOneToOne: false;
            referencedRelation: "collections";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_collections_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      product_images: {
        Row: {
          alt: string;
          color_id: string | null;
          created_at: string;
          id: string;
          path: string;
          product_id: string;
          sort_order: number;
        };
        ComputedFields: never;
        Insert: {
          alt?: string;
          color_id?: string | null;
          created_at?: string;
          id?: string;
          path: string;
          product_id: string;
          sort_order?: number;
        };
        Update: {
          alt?: string;
          color_id?: string | null;
          created_at?: string;
          id?: string;
          path?: string;
          product_id?: string;
          sort_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: "product_images_color_id_fkey";
            columns: ["color_id"];
            isOneToOne: false;
            referencedRelation: "colors";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_images_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      product_variants: {
        Row: {
          active: boolean;
          color_id: string;
          id: string;
          product_id: string;
          size: string;
          sku: string;
          stock: number;
        };
        ComputedFields: never;
        Insert: {
          active?: boolean;
          color_id: string;
          id?: string;
          product_id: string;
          size: string;
          sku: string;
          stock?: number;
        };
        Update: {
          active?: boolean;
          color_id?: string;
          id?: string;
          product_id?: string;
          size?: string;
          sku?: string;
          stock?: number;
        };
        Relationships: [
          {
            foreignKeyName: "product_variants_color_id_fkey";
            columns: ["color_id"];
            isOneToOne: false;
            referencedRelation: "colors";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_variants_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      products: {
        Row: {
          category_id: string;
          created_at: string;
          default_color_id: string | null;
          description: string;
          detail: string;
          garment: Database["public"]["Enums"]["garment_kind"];
          id: string;
          is_new: boolean;
          name: string;
          price_cents: number;
          slug: string;
          status: Database["public"]["Enums"]["product_status"];
          updated_at: string;
          weight_grams: number;
        };
        ComputedFields: never;
        Insert: {
          category_id: string;
          created_at?: string;
          default_color_id?: string | null;
          description?: string;
          detail?: string;
          garment: Database["public"]["Enums"]["garment_kind"];
          id?: string;
          is_new?: boolean;
          name: string;
          price_cents: number;
          slug: string;
          status?: Database["public"]["Enums"]["product_status"];
          updated_at?: string;
          weight_grams?: number;
        };
        Update: {
          category_id?: string;
          created_at?: string;
          default_color_id?: string | null;
          description?: string;
          detail?: string;
          garment?: Database["public"]["Enums"]["garment_kind"];
          id?: string;
          is_new?: boolean;
          name?: string;
          price_cents?: number;
          slug?: string;
          status?: Database["public"]["Enums"]["product_status"];
          updated_at?: string;
          weight_grams?: number;
        };
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "products_default_color_id_fkey";
            columns: ["default_color_id"];
            isOneToOne: false;
            referencedRelation: "colors";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          display_name: string | null;
          email: string | null;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          display_name?: string | null;
          email?: string | null;
          id: string;
          role?: Database["public"]["Enums"]["app_role"];
        };
        Update: {
          created_at?: string;
          display_name?: string | null;
          email?: string | null;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      admin_save_product: { Args: { p: Json }; Returns: string };
      current_app_role: { Args: Record<PropertyKey, never>; Returns: Database["public"]["Enums"]["app_role"] };
    };
    Enums: {
      app_role: "admin" | "atendente" | "cliente";
      garment_kind: "jacket" | "hoodie" | "tee" | "pants" | "shorts" | "cap" | "sneaker" | "bag";
      product_status: "rascunho" | "ativo" | "arquivado";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    keyof (DefaultSchema["Tables"] & DefaultSchema["Views"]) | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_role: ["admin", "atendente", "cliente"],
      garment_kind: ["jacket", "hoodie", "tee", "pants", "shorts", "cap", "sneaker", "bag"],
      product_status: ["rascunho", "ativo", "arquivado"],
    },
  },
} as const;
