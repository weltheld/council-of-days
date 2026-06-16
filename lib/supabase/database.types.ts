// Hand-written type subset for the Council of Days schema.
// Matches supabase/migrations/0001_init.sql.
// Could later be replaced by `supabase gen types typescript --linked`.

export type CampaignPhaseDb = "draft" | "live";
export type MemberRoleDb = "creator" | "participant";
export type VoteValueDb = "yes" | "maybe" | "no";
export type InvitationStatusDb = "queued" | "sent" | "joined";
export type BackgroundSceneDb = "tavern" | "parchment" | "wine" | "forest";

export type ProfileRow = {
  id: string;
  email: string;
  character_name: string;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type CampaignRow = {
  id: string;
  slug: string;
  name: string;
  note: string | null;
  creator_id: string;
  phase: CampaignPhaseDb;
  viable_weekdays: number[];
  background: BackgroundSceneDb;
  banner_url: string | null;
  created_at: string;
};

export type CampaignMemberRow = {
  campaign_id: string;
  user_id: string;
  role: MemberRoleDb;
  is_dm: boolean;
  joined_at: string;
};

export type InvitationRow = {
  id: string;
  campaign_id: string;
  user_id: string | null;
  email: string | null;
  status: InvitationStatusDb;
  invited_at: string;
};

export type VoteRow = {
  campaign_id: string;
  user_id: string;
  date: string;
  value: VoteValueDb;
  updated_at: string;
};

// Canonical shape expected by @supabase/supabase-js generics.
// Each table needs Row / Insert / Update / Relationships.
// Public schema also needs Views / Functions / Enums / CompositeTypes.
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: {
          id: string;
          email: string;
          character_name?: string;
          display_name?: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          character_name?: string;
          display_name?: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      campaigns: {
        Row: CampaignRow;
        Insert: {
          id?: string;
          slug?: string;
          name: string;
          note?: string | null;
          creator_id: string;
          phase?: CampaignPhaseDb;
          viable_weekdays?: number[];
          background?: BackgroundSceneDb;
          banner_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          note?: string | null;
          creator_id?: string;
          phase?: CampaignPhaseDb;
          viable_weekdays?: number[];
          background?: BackgroundSceneDb;
          banner_url?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      campaign_members: {
        Row: CampaignMemberRow;
        Insert: {
          campaign_id: string;
          user_id: string;
          role?: MemberRoleDb;
          is_dm?: boolean;
          joined_at?: string;
        };
        Update: {
          campaign_id?: string;
          user_id?: string;
          role?: MemberRoleDb;
          is_dm?: boolean;
          joined_at?: string;
        };
        Relationships: [];
      };
      invitations: {
        Row: InvitationRow;
        Insert: {
          id?: string;
          campaign_id: string;
          user_id?: string | null;
          email?: string | null;
          status?: InvitationStatusDb;
          invited_at?: string;
        };
        Update: {
          id?: string;
          campaign_id?: string;
          user_id?: string | null;
          email?: string | null;
          status?: InvitationStatusDb;
          invited_at?: string;
        };
        Relationships: [];
      };
      votes: {
        Row: VoteRow;
        Insert: {
          campaign_id: string;
          user_id: string;
          date: string;
          value: VoteValueDb;
          updated_at?: string;
        };
        Update: {
          campaign_id?: string;
          user_id?: string;
          date?: string;
          value?: VoteValueDb;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      accept_invitation: {
        Args: { p_invitation: string };
        Returns: CampaignMemberRow;
      };
      is_campaign_member: {
        Args: { p_campaign: string };
        Returns: boolean;
      };
      is_campaign_creator: {
        Args: { p_campaign: string };
        Returns: boolean;
      };
      slugify: {
        Args: { input: string };
        Returns: string;
      };
    };
    Enums: {
      campaign_phase: CampaignPhaseDb;
      member_role: MemberRoleDb;
      vote_value: VoteValueDb;
      invitation_status: InvitationStatusDb;
      background_scene: BackgroundSceneDb;
    };
    CompositeTypes: Record<string, never>;
  };
};
