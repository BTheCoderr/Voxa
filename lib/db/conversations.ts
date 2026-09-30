import type { SupabaseClient } from '@supabase/supabase-js';

import type { SessionCoachReview } from '@/lib/ai/providers/types';
import type { ApiLearningPath } from '@/lib/realtime/learningPath';
import type { UserLevel } from '@/lib/realtime/types';

import type { ConversationRow, CorrectionRow, Database, Json, MessageRole } from './database.types';
import { ensureUserProfileRows } from './progress';

export type ConversationHistoryItem = Pick<
  ConversationRow,
  | 'id'
  | 'scenario_id'
  | 'scenario_title'
  | 'learning_path'
  | 'status'
  | 'summary'
  | 'coach_review'
  | 'started_at'
  | 'ended_at'
  | 'xp_awarded'
>;

export type ConversationJournalEntry = Pick<
  ConversationRow,
  | 'id'
  | 'scenario_id'
  | 'scenario_title'
  | 'learning_path'
  | 'status'
  | 'summary'
  | 'coach_review'
  | 'started_at'
  | 'ended_at'
  | 'xp_awarded'
  | 'ai_provider_used'
  | 'ai_used_fallback'
> & {
  corrections: CorrectionRow[];
};

export type ReviewedConversationItem = Pick<
  ConversationRow,
  'id' | 'scenario_id' | 'scenario_title' | 'learning_path' | 'coach_review' | 'ended_at'
>;

export async function createConversation(
  client: SupabaseClient<Database>,
  args: {
    userId: string;
    scenarioId: string;
    scenarioTitle: string;
    learningPath: ApiLearningPath;
    userLevel: UserLevel;
  },
): Promise<ConversationRow> {
  await ensureUserProfileRows(client, args.userId);

  const { data, error } = await client
    .from('conversations')
    .insert({
      user_id: args.userId,
      scenario_id: args.scenarioId,
      scenario_title: args.scenarioTitle,
      learning_path: args.learningPath,
      user_level: args.userLevel,
      status: 'active',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function addConversationMessage(
  client: SupabaseClient<Database>,
  args: {
    conversationId: string;
    userId: string;
    role: MessageRole;
    body: string;
    clientMessageId: string;
    isFinal: boolean;
  },
): Promise<void> {
  const { error } = await client.from('conversation_messages').upsert(
    {
      conversation_id: args.conversationId,
      user_id: args.userId,
      role: args.role,
      body: args.body,
      client_message_id: args.clientMessageId,
      is_final: args.isFinal,
    },
    { onConflict: 'conversation_id,client_message_id' },
  );

  if (error) throw error;
}

export async function addCorrection(
  client: SupabaseClient<Database>,
  args: {
    conversationId: string;
    userId: string;
    body?: string;
    original?: string;
    improved?: string;
    explanation?: string;
  },
): Promise<void> {
  const original = args.original ?? '';
  const improved = args.improved ?? '';
  const explanation = args.explanation ?? '';
  const fallbackBody = [original, improved, explanation]
    .filter(Boolean)
    .join(' · ');

  const body = args.body?.trim() || fallbackBody || original || improved || 'Correction';

  const { error } = await client.from('corrections').upsert(
    {
      conversation_id: args.conversationId,
      user_id: args.userId,
      body,
      original,
      improved,
      explanation,
    },
    { onConflict: 'conversation_id,original,improved', ignoreDuplicates: true },
  );

  if (error) throw error;
}

export async function completeConversation(
  client: SupabaseClient<Database>,
  args: {
    conversationId: string;
    userId: string;
    summary: string;
    xpAwarded: number;
    status?: 'completed' | 'aborted';
    aiProviderUsed?: string | null;
    aiUsedFallback?: boolean | null;
    coachReview?: SessionCoachReview | null;
  },
): Promise<void> {
  const { error } = await client
    .from('conversations')
    .update({
      status: args.status ?? 'completed',
      summary: args.summary,
      ended_at: new Date().toISOString(),
      xp_awarded: args.xpAwarded,
      ...(args.aiProviderUsed !== undefined ? { ai_provider_used: args.aiProviderUsed } : {}),
      ...(args.aiUsedFallback !== undefined ? { ai_used_fallback: args.aiUsedFallback } : {}),
      ...(args.coachReview !== undefined
        ? { coach_review: args.coachReview as unknown as Json }
        : {}),
    })
    .eq('id', args.conversationId)
    .eq('user_id', args.userId);

  if (error) throw error;
}

export async function getConversationHistory(
  client: SupabaseClient<Database>,
  userId: string,
  limit = 40,
): Promise<ConversationHistoryItem[]> {
  await ensureUserProfileRows(client, userId);

  const { data, error } = await client
    .from('conversations')
    .select('id, scenario_id, scenario_title, learning_path, status, summary, coach_review, started_at, ended_at, xp_awarded')
    .eq('user_id', userId)
    .order('started_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}


export async function getRecentReviewedConversations(
  client: SupabaseClient<Database>,
  userId: string,
  learningPath: ApiLearningPath,
  limit = 10,
): Promise<ReviewedConversationItem[]> {
  const { data, error } = await client
    .from('conversations')
    .select('id, scenario_id, scenario_title, learning_path, coach_review, ended_at')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .eq('learning_path', learningPath)
    .not('coach_review', 'is', null)
    .order('ended_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}


export async function getConversationJournalEntry(
  client: SupabaseClient<Database>,
  userId: string,
  conversationId: string,
): Promise<ConversationJournalEntry> {
  const [{ data: conversation, error: conversationError }, { data: corrections, error: correctionsError }] =
    await Promise.all([
      client
        .from('conversations')
        .select(
          'id, scenario_id, scenario_title, learning_path, status, summary, coach_review, started_at, ended_at, xp_awarded, ai_provider_used, ai_used_fallback',
        )
        .eq('id', conversationId)
        .eq('user_id', userId)
        .single(),
      client
        .from('corrections')
        .select('id, conversation_id, user_id, body, original, improved, explanation, created_at')
        .eq('conversation_id', conversationId)
        .eq('user_id', userId)
        .order('created_at', { ascending: true }),
    ]);

  if (conversationError) throw conversationError;
  if (correctionsError) throw correctionsError;

  return {
    ...conversation,
    corrections: corrections ?? [],
  };
}
