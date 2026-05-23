export type ConversationStatus = 'active' | 'completed' | 'aborted';
export type MessageRole = 'user' | 'assistant';

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          display_name: string | null;
          native_language: string | null;
          target_language: string | null;
          interests: string[];
          level: string | null;
          explanation_language: string | null;
          onboarding_completed: boolean;
        };
        Insert: {
          id: string;
          created_at?: string;
          updated_at?: string;
          display_name?: string | null;
          native_language?: string | null;
          target_language?: string | null;
          interests?: string[];
          level?: string | null;
          explanation_language?: string | null;
          onboarding_completed?: boolean;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          display_name?: string | null;
          native_language?: string | null;
          target_language?: string | null;
          interests?: string[];
          level?: string | null;
          explanation_language?: string | null;
          onboarding_completed?: boolean;
        };
        Relationships: [];
      };
      user_progress: {
        Row: {
          user_id: string;
          total_xp: number;
          current_streak: number;
          last_activity_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          total_xp?: number;
          current_streak?: number;
          last_activity_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          total_xp?: number;
          current_streak?: number;
          last_activity_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      conversations: {
        Row: {
          id: string;
          user_id: string;
          scenario_id: string;
          scenario_title: string;
          learning_path: string;
          user_level: string;
          status: ConversationStatus;
          summary: string | null;
          started_at: string;
          ended_at: string | null;
          xp_awarded: number;
          ai_provider_used: string | null;
          ai_used_fallback: boolean | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          scenario_id: string;
          scenario_title: string;
          learning_path: string;
          user_level: string;
          status?: ConversationStatus;
          summary?: string | null;
          started_at?: string;
          ended_at?: string | null;
          xp_awarded?: number;
          ai_provider_used?: string | null;
          ai_used_fallback?: boolean | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          scenario_id?: string;
          scenario_title?: string;
          learning_path?: string;
          user_level?: string;
          status?: ConversationStatus;
          summary?: string | null;
          started_at?: string;
          ended_at?: string | null;
          xp_awarded?: number;
          ai_provider_used?: string | null;
          ai_used_fallback?: boolean | null;
        };
        Relationships: [];
      };
      conversation_messages: {
        Row: {
          id: string;
          conversation_id: string;
          user_id: string;
          role: MessageRole;
          body: string;
          client_message_id: string;
          is_final: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          user_id: string;
          role: MessageRole;
          body?: string;
          client_message_id: string;
          is_final?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          user_id?: string;
          role?: MessageRole;
          body?: string;
          client_message_id?: string;
          is_final?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      corrections: {
        Row: {
          id: string;
          conversation_id: string;
          user_id: string;
          body: string;
          original: string;
          improved: string;
          explanation: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          user_id: string;
          body: string;
          original?: string;
          improved?: string;
          explanation?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          user_id?: string;
          body?: string;
          original?: string;
          improved?: string;
          explanation?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      streak_events: {
        Row: {
          id: string;
          user_id: string;
          event_date: string;
          conversation_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          event_date: string;
          conversation_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          event_date?: string;
          conversation_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      increment_user_xp: {
        Args: { p_user_id: string; p_delta: number };
        Returns: undefined;
      };
    };
  };
};

export type ProfileRow = Database['public']['Tables']['profiles']['Row'];
export type UserProgressRow = Database['public']['Tables']['user_progress']['Row'];
export type ConversationRow = Database['public']['Tables']['conversations']['Row'];
export type ConversationMessageRow = Database['public']['Tables']['conversation_messages']['Row'];
export type CorrectionRow = Database['public']['Tables']['corrections']['Row'];
export type StreakEventRow = Database['public']['Tables']['streak_events']['Row'];
