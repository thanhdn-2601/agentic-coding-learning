// =============================================================================
// SAA 2025 — Database Types
// Auto-generate with: supabase gen types typescript --local > src/types/database.ts
// =============================================================================

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Locale = 'vi' | 'en';
export type UserRole = 'user' | 'admin';
export type KudosStarTier = 1 | 2 | 3;

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          avatar_url: string | null;
          locale: Locale;
          department_id: string | null;
          kudos_star_tier: KudosStarTier | null;
          role: UserRole;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string;
          avatar_url?: string | null;
          locale?: Locale;
          department_id?: string | null;
          kudos_star_tier?: KudosStarTier | null;
          role?: UserRole;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          full_name?: string;
          avatar_url?: string | null;
          locale?: Locale;
          department_id?: string | null;
          kudos_star_tier?: KudosStarTier | null;
          role?: UserRole;
          updated_at?: string;
        };
      };
      departments: {
        Row: {
          id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
        };
        Update: {
          name?: string;
        };
      };
      hashtags: {
        Row: {
          id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
        };
        Update: {
          name?: string;
        };
      };
      kudos: {
        Row: {
          id: string;
          sender_id: string;
          receiver_id: string;
          message: string;
          hashtags: string[];
          heart_count: number;
          department_id: string | null;
          danh_hieu: string;
          is_anonymous: boolean;
          anonymous_name: string | null;
          image_urls: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          sender_id: string;
          receiver_id: string;
          message: string;
          hashtags?: string[];
          heart_count?: number;
          department_id?: string | null;
          danh_hieu?: string;
          is_anonymous?: boolean;
          anonymous_name?: string | null;
          image_urls?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          message?: string;
          hashtags?: string[];
          heart_count?: number;
          department_id?: string | null;
          danh_hieu?: string;
          is_anonymous?: boolean;
          anonymous_name?: string | null;
          image_urls?: string[];
          updated_at?: string;
        };
      };
      kudos_likes: {
        Row: {
          kudos_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          kudos_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: never;
      };
      secret_boxes: {
        Row: {
          id: string;
          user_id: string;
          is_opened: boolean;
          gift_title: string | null;
          gift_value: string | null;
          gift_image_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          is_opened?: boolean;
          gift_title?: string | null;
          gift_value?: string | null;
          gift_image_url?: string | null;
          created_at?: string;
        };
        Update: {
          is_opened?: boolean;
          gift_title?: string | null;
          gift_value?: string | null;
          gift_image_url?: string | null;
        };
      };
      award_categories: {
        Row: {
          id: string;
          slug: string;
          name_vi: string;
          name_en: string;
          description_vi: string | null;
          description_en: string | null;
          cover_image_url: string | null;
          icon_url: string | null;
          display_order: number;
          voting_start_at: string | null;
          voting_end_at: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name_vi: string;
          name_en: string;
          description_vi?: string | null;
          description_en?: string | null;
          cover_image_url?: string | null;
          icon_url?: string | null;
          display_order?: number;
          voting_start_at?: string | null;
          voting_end_at?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          slug?: string;
          name_vi?: string;
          name_en?: string;
          description_vi?: string | null;
          description_en?: string | null;
          cover_image_url?: string | null;
          icon_url?: string | null;
          display_order?: number;
          voting_start_at?: string | null;
          voting_end_at?: string | null;
          is_active?: boolean;
          updated_at?: string;
        };
      };
      nominees: {
        Row: {
          id: string;
          category_id: string;
          name: string;
          email: string | null;
          department: string | null;
          position: string | null;
          bio_vi: string | null;
          bio_en: string | null;
          photo_url: string | null;
          display_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category_id: string;
          name: string;
          email?: string | null;
          department?: string | null;
          position?: string | null;
          bio_vi?: string | null;
          bio_en?: string | null;
          photo_url?: string | null;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          category_id?: string;
          name?: string;
          email?: string | null;
          department?: string | null;
          position?: string | null;
          bio_vi?: string | null;
          bio_en?: string | null;
          photo_url?: string | null;
          display_order?: number;
          is_active?: boolean;
          updated_at?: string;
        };
      };
      votes: {
        Row: {
          id: string;
          user_id: string;
          nominee_id: string;
          category_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          nominee_id: string;
          category_id: string;
          created_at?: string;
        };
        Update: never;
      };
      event_config: {
        Row: {
          key: string;
          value: string;
          updated_at: string;
        };
        Insert: {
          key: string;
          value: string;
          updated_at?: string;
        };
        Update: {
          value?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      create_kudos: {
        Args: {
          p_receiver_id: string;
          p_danh_hieu: string;
          p_message: string;
          p_hashtags?: string[];
          p_image_urls?: string[];
          p_is_anonymous?: boolean;
          p_anonymous_name?: string | null;
        };
        Returns: Database['public']['Tables']['kudos']['Row'];
      };
    };
    Enums: {
      locale: 'vi' | 'en';
    };
  };
}

// ---------------------------------------------------------------------------
// Convenience row types
// ---------------------------------------------------------------------------
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Department = Database['public']['Tables']['departments']['Row'];
export type Hashtag = Database['public']['Tables']['hashtags']['Row'];
export type Kudos = Database['public']['Tables']['kudos']['Row'];
export type KudosLike = Database['public']['Tables']['kudos_likes']['Row'];
export type SecretBox = Database['public']['Tables']['secret_boxes']['Row'];
export type AwardCategory = Database['public']['Tables']['award_categories']['Row'];
export type Nominee = Database['public']['Tables']['nominees']['Row'];
export type Vote = Database['public']['Tables']['votes']['Row'];
export type EventConfig = Database['public']['Tables']['event_config']['Row'];

// ---------------------------------------------------------------------------
// Domain types (for business logic layer)
// ---------------------------------------------------------------------------

/** Kudos with sender + receiver profiles expanded */
export interface KudosWithProfiles extends Kudos {
  sender: Pick<Profile, 'id' | 'full_name' | 'avatar_url'>;
  receiver: Pick<Profile, 'id' | 'full_name' | 'avatar_url' | 'department_id' | 'kudos_star_tier'> & { department_name: string | null };
}

/** Kudos feed item — includes like state for current user.
 * Note: sender.id may be null when is_anonymous = true (server masks the sender).
 */
export interface KudosFeedItem extends Omit<KudosWithProfiles, 'sender'> {
  liked_by_me: boolean;
  sender:
    | (Pick<Profile, 'id' | 'full_name' | 'avatar_url' | 'kudos_star_tier'> & { department_name: string | null })
    | { id: null; full_name: string; avatar_url: null };
}

/** Nominee with its parent category (for detail view) */
export interface NomineeWithCategory extends Nominee {
  award_categories: AwardCategory;
}

/** Category with its nominees list (for category listing) */
export interface AwardCategoryWithNominees extends AwardCategory {
  nominees: Nominee[];
}

/** Category with vote counts (for results view) */
export interface AwardCategoryResult extends AwardCategory {
  nominees: Array<Nominee & { vote_count: number }>;
  total_votes: number;
}

/** User's vote keyed by category_id (for quick lookup on client) */
export type UserVotesMap = Record<string, Vote>;
