import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { PressMaterial } from '@fip/shared';

const PAGE_SIZE = 10;

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

interface ListState {
  items: PressMaterial[];
  page: number;
  hasMore: boolean;
  total: number;
}

const initialState: ListState = { items: [], page: 0, hasMore: true, total: 0 };

async function fetchPage(page: number): Promise<ListState> {
  const response = await fetch(
    `${API_BASE_URL}/press/materials?page=${page}&pageSize=${PAGE_SIZE}`,
  );
  if (!response.ok) {
    throw new Error(`API responded with status ${response.status}`);
  }
  const data: { items: PressMaterial[]; page: number; hasMore: boolean; total: number } =
    await response.json();
  return { items: data.items, page: data.page, hasMore: data.hasMore, total: data.total };
}

export default function PressScreen() {
  const [state, setState] = useState<ListState>(initialState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadFirstPage = useCallback(async () => {
    setError(null);
    try {
      const first = await fetchPage(1);
      setState({ items: first.items, page: first.page, hasMore: first.hasMore, total: first.total });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load materials');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFirstPage();
  }, [loadFirstPage]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !state.hasMore) return;
    setLoadingMore(true);
    try {
      const next = await fetchPage(state.page + 1);
      setState((prev) => ({
        items: [...prev.items, ...next.items],
        page: next.page,
        hasMore: next.hasMore,
        total: next.total,
      }));
    } catch {
      // Keep the already-loaded page; retry on next scroll attempt.
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, state.hasMore, state.page]);

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator />
      </View>
    );
  }

  if (error !== null) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      data={state.items}
      keyExtractor={(material) => material.id}
      renderItem={({ item }) => <MaterialRow material={item} />}
      onEndReachedThreshold={0.5}
      onEndReached={() => void loadMore()}
      refreshControl={<RefreshControl refreshing={false} onRefresh={() => void loadFirstPage()} />}
      ListFooterComponent={
        loadingMore ? <ActivityIndicator style={styles.footer} /> : null
      }
      ListEmptyComponent={<Text style={styles.empty}>No materials published yet.</Text>}
    />
  );
}

function MaterialRow({ material }: { material: PressMaterial }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowHeader}>
        <View style={styles.badges}>
          {material.isNew ? <View style={styles.newDot} /> : null}
          <Text style={styles.typeBadge}>{material.type}</Text>
          <Text style={styles.topicBadge}>{material.topic}</Text>
        </View>
        <Text style={styles.date}>{formatDate(material.publishedAt)}</Text>
      </View>
      <Text style={styles.title}>{material.title}</Text>
      <Text style={styles.summary}>{material.summary}</Text>
    </View>
  );
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric' }).format(
    new Date(iso),
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { alignItems: 'center', justifyContent: 'center' },
  row: { padding: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#ddd' },
  rowHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  badges: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  newDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#e0342c' },
  typeBadge: { fontSize: 11, fontWeight: '600', color: '#1a4d8f', textTransform: 'uppercase' },
  topicBadge: { fontSize: 11, color: '#666' },
  date: { fontSize: 11, color: '#999' },
  title: { fontSize: 16, fontWeight: '600', marginTop: 6 },
  summary: { fontSize: 13, color: '#444', marginTop: 4 },
  footer: { padding: 16 },
  empty: { padding: 24, textAlign: 'center', color: '#666' },
  error: { color: '#e0342c', padding: 24 },
});
