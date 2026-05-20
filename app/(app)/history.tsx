import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PolishedEmptyState } from '@/components/marketing/PolishedEmptyState';
import { BetaDisclaimer } from '@/components/ui/BetaDisclaimer';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { VoxaButton } from '@/components/ui/VoxaButton';
import { VoxaText } from '@/components/ui/VoxaText';
import { spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth/AuthContext';
import type { ConversationHistoryItem } from '@/lib/db/conversations';
import { getConversationHistory } from '@/lib/db/conversations';
import { env } from '@/lib/env';
import { supabase } from '@/lib/supabase/client';

function formatSessionWhen(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  } catch {
    return iso;
  }
}

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const { user, initialized } = useAuth();
  const [items, setItems] = useState<ConversationHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSync = Boolean(env.supabaseConfigured && user?.id);

  const load = useCallback(async () => {
    if (!canSync || !user?.id) {
      setItems([]);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const rows = await getConversationHistory(supabase, user.id);
      setItems(rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load history');
    } finally {
      setLoading(false);
    }
  }, [canSync, user?.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    if (!canSync) return;
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [canSync, load]);

  if (!initialized) {
    return (
      <GradientBackground>
        <View style={[styles.container, { paddingTop: insets.top + spacing.xl }]}>
          <ActivityIndicator />
        </View>
      </GradientBackground>
    );
  }

  if (!user || !canSync) {
    return (
      <GradientBackground>
        <View style={[styles.container, { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.lg }]}>
          <VoxaText variant="title" style={styles.title}>
            Conversation history
          </VoxaText>
          {!user ? (
            <VoxaText variant="body">
              Sign in to sync transcripts and session notes to your account. Until then, progress stays on this device only.
            </VoxaText>
          ) : (
            <VoxaText variant="body">Connect Supabase in your build env to load cloud history on this device.</VoxaText>
          )}

          {!user ? (
            <PolishedEmptyState
              title="Sign in to sync your journal"
              body="Progress can stay on this device, or create an account to keep session history consistent across installs."
              footnote="Beta: sign in with email and password on the Profile tab."
              compact
            />
          ) : (
            <PolishedEmptyState
              title="Cloud history unavailable in this build"
              body="This install is missing Supabase environment keys. Session history sync is turned off until the app is configured."
              footnote="Builders: set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY."
              compact
            />
          )}

          <VoxaButton
            title={!user ? 'Go to profile' : 'Practice'}
            onPress={() => router.replace(!user ? '/(app)/(tabs)/profile' : '/(app)/(tabs)')}
          />
        </View>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <View style={[styles.container, { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.lg }]}>
        <VoxaText variant="caption" style={styles.betaTag}>
          TestFlight beta
        </VoxaText>
        <VoxaText variant="title" style={styles.title}>
          Conversation history
        </VoxaText>
        <VoxaText variant="body">Your recent voice sessions, newest first.</VoxaText>

        {error ? (
          <GlassPanel style={styles.empty}>
            <VoxaText variant="body">{error}</VoxaText>
            <VoxaButton title="Retry" onPress={() => void load()} containerStyle={styles.retry} />
          </GlassPanel>
        ) : null}

        {loading && !refreshing ? (
          <View style={styles.loader}>
            <ActivityIndicator />
          </View>
        ) : null}

        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />}
          contentContainerStyle={items.length === 0 ? styles.listEmpty : styles.list}
          ListEmptyComponent={
            !loading ? (
              <PolishedEmptyState
                title="Your practice journal starts here"
                body="After voice sessions, summaries and session notes appear in this list — newest first."
                footnote="Tip: finish one scenario on the Practice tab, then come back to see your first entry."
                compact
              />
            ) : null
          }
          renderItem={({ item }) => (
            <GlassPanel style={styles.card}>
              <VoxaText variant="caption" style={styles.cardMeta}>
                {formatSessionWhen(item.started_at)} · {item.status}
                {item.xp_awarded > 0 ? ` · +${item.xp_awarded} XP` : ''}
              </VoxaText>
              <VoxaText variant="lead" style={styles.cardTitle}>
                {item.scenario_title}
              </VoxaText>
              {item.summary ? <VoxaText variant="muted">{item.summary}</VoxaText> : null}
            </GlassPanel>
          )}
        />

        <BetaDisclaimer compact />

        <VoxaButton title="Practice" onPress={() => router.replace('/(app)/(tabs)')} />
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  title: {
    marginTop: spacing.sm,
  },
  betaTag: {
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    opacity: 0.85,
  },
  empty: {
    marginTop: spacing.md,
  },
  list: {
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  listEmpty: {
    flexGrow: 1,
    paddingBottom: spacing.md,
  },
  card: {
    marginBottom: spacing.sm,
  },
  cardMeta: {
    marginBottom: spacing.xs,
    opacity: 0.85,
  },
  cardTitle: {
    marginBottom: spacing.xs,
  },
  loader: {
    paddingVertical: spacing.lg,
  },
  retry: {
    marginTop: spacing.md,
  },
});
