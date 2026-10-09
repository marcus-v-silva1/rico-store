// Escrito à mão para o começo do projeto. Depois de subir o banco, gere o real com `npm run db:types`.
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          display_name: string | null;
          role: "admin" | "atendente" | "cliente";
          created_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          display_name?: string | null;
          role?: "admin" | "atendente" | "cliente";
          created_at?: string;
        };
        Update: {
          email?: string | null;
          display_name?: string | null;
          role?: "admin" | "atendente" | "cliente";
        };
        Relationships: [];
      };
      newsletter_subscribers: {
        Row: { id: string; email: string; created_at: string };
        Insert: { email: string; id?: string; created_at?: string };
        Update: { email?: string };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: { app_role: "admin" | "atendente" | "cliente" };
    CompositeTypes: Record<string, never>;
  };
};
