export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      entries: {
        Row: {
          body: string | null;
          canonical_url: string | null;
          content_type: Database["public"]["Enums"]["content_type"];
          created_at: string;
          creator: string | null;
          discipline: string | null;
          embedding: string | null;
          id: string;
          is_public: boolean;
          media_storage_url: string | null;
          media_type: Database["public"]["Enums"]["media_type"];
          ownership: Database["public"]["Enums"]["ownership"];
          portfolio_featured: boolean;
          saved_version: string | null;
          source: string | null;
          source_id: string | null;
          source_platform: string | null;
          summary: string | null;
          summary_created_by: Database["public"]["Enums"]["summary_created_by"] | null;
          title: string | null;
          updated_at: string;
          url: string | null;
          url_normalized: string | null;
          why_saved: string | null;
        };
        Insert: {
          body?: string | null;
          canonical_url?: string | null;
          content_type: Database["public"]["Enums"]["content_type"];
          created_at?: string;
          creator?: string | null;
          discipline?: string | null;
          embedding?: string | null;
          id?: string;
          is_public?: boolean;
          media_storage_url?: string | null;
          media_type: Database["public"]["Enums"]["media_type"];
          ownership: Database["public"]["Enums"]["ownership"];
          portfolio_featured?: boolean;
          saved_version?: string | null;
          source?: string | null;
          source_id?: string | null;
          source_platform?: string | null;
          summary?: string | null;
          summary_created_by?: Database["public"]["Enums"]["summary_created_by"] | null;
          title?: string | null;
          updated_at?: string;
          url?: string | null;
          url_normalized?: string | null;
          why_saved?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["entries"]["Insert"]>;
        Relationships: [];
      };
      entry_tags: {
        Row: {
          created_at: string;
          created_by: Database["public"]["Enums"]["created_by"];
          entry_id: string;
          id: string;
          status: Database["public"]["Enums"]["entry_status"];
          tag_id: string;
        };
        Insert: {
          created_at?: string;
          created_by?: Database["public"]["Enums"]["created_by"];
          entry_id: string;
          id?: string;
          status?: Database["public"]["Enums"]["entry_status"];
          tag_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["entry_tags"]["Insert"]>;
        Relationships: [];
      };
      highlights: {
        Row: {
          body: string;
          created_at: string;
          embedding: string | null;
          entry_id: string;
          id: string;
          locator: Json | null;
          note: string | null;
          page: number | null;
          timestamp: string | null;
        };
        Insert: {
          body: string;
          created_at?: string;
          embedding?: string | null;
          entry_id: string;
          id?: string;
          locator?: Json | null;
          note?: string | null;
          page?: number | null;
          timestamp?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["highlights"]["Insert"]>;
        Relationships: [];
      };
      relations: {
        Row: {
          created_at: string;
          created_by: Database["public"]["Enums"]["created_by"];
          from_entry_id: string;
          id: string;
          note: string | null;
          relation_type: Database["public"]["Enums"]["relation_type"];
          status: Database["public"]["Enums"]["entry_status"];
          to_entry_id: string;
        };
        Insert: {
          created_at?: string;
          created_by?: Database["public"]["Enums"]["created_by"];
          from_entry_id: string;
          id?: string;
          note?: string | null;
          relation_type: Database["public"]["Enums"]["relation_type"];
          status?: Database["public"]["Enums"]["entry_status"];
          to_entry_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["relations"]["Insert"]>;
        Relationships: [];
      };
      tags: {
        Row: {
          created_at: string;
          created_by: Database["public"]["Enums"]["created_by"];
          id: string;
          name: string;
        };
        Insert: {
          created_at?: string;
          created_by?: Database["public"]["Enums"]["created_by"];
          id?: string;
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["tags"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_commonplace_owner: {
        Args: never;
        Returns: boolean;
      };
    };
    Enums: {
      content_type: "work" | "writing" | "thought" | "reference" | "principle";
      created_by: "user" | "ai";
      entry_status: "accepted" | "pending" | "rejected";
      media_type: "image" | "video" | "audio" | "document" | "link" | "text";
      ownership: "mine" | "theirs";
      relation_type: "inspired_by" | "used_in" | "contrasts_with" | "related";
      summary_created_by: "user" | "ai";
    };
    CompositeTypes: Record<string, never>;
  };
};

export type Entry = Database["public"]["Tables"]["entries"]["Row"];
export type EntryInsert = Database["public"]["Tables"]["entries"]["Insert"];
