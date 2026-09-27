import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NotificationDto, NotificationPage } from '@fip/shared';
import { fetchNotifications, markNotificationRead } from '../lib/notifications';

const PAGE_SIZE = 20;

/** Typology signage: label plus a distinct color chip per typology. */
const TYPOLOGY_SIGNAGE: Record<NotificationDto['typology'], { label: string; color: string }> = {
  press_note: { label: 'Press note', color: '#1a3c8f' },
  agenda_change: { label: 'Agenda change', color: '#b7791f' },
  interview: { label: 'Interview', color: '#2f855a' },
  private_communication: { label: 'Private communication', color: '#6b46c1' },
  incident: { label: 'Incident', color: '#c53030' },
};

function TypologyChip({ typology }: { typology: NotificationDto['typology'] }) {
  const signage = TYPOLOGY_SIGNAGE[typology];
  return (
    <View style={[styles.chip, { backgroundColor: signage.color }]}>
      <Text style={styles.chipText}>{signage.label}</Text>
    </View>
  );
}

export function NotificationsScreen({ apiBaseUrl }: { apiBaseUrl: string }) {
  const [items, setItems] = useState<readonly NotificationDto[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPage = useCallback(
    async (nextPage: number, mode: 'initial' | 'more' | 'refresh') => {
      if (mode === 'more') setLoadingMore(true);
      if (mode === 'refresh') setRefreshing(true);
      try {
        const result: NotificationPage = await fetchNotifications(apiBaseUrl, {
          page: nextPage,
          pageSize: PAGE_SIZE,
        });
        setItems((current) => (nextPage === 1 ? result.items : [...current, ...result.items]));
        setPage(nextPage);
        setHasMore(result.hasMore);
        setUnreadCount(result.unreadCount);
        setError(null);
      } catch {
        setError('Could not load notifications. Pull to retry.');
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [apiBaseUrl],
  );

  useEffect(() => {
    loadPage(1, 'initial');
  }, [loadPage]);

  const loadMore = useCallback(() => {
    if (!hasMore || loadingMore || loading) return;
    loadPage(page + 1, 'more');
  }, [hasMore, loadingMore, loading, loadPage, page]);

  /** Marking as read on open: tapping an unread item clears it and the badge. */
  const openItem = useCallback(
    async (id: string) => {
      const target = items.find((item) => item.id === id);
      if (!target || target.readAt) return;
      try {
        const remaining = await markNotificationRead(apiBaseUrl, id);
        setItems((current) =>
          current.map((item) =>
            item.id === id ? { ...item, readAt: new Date().toISOString() } : item,
          ),
        );
        setUnreadCount(remaining);
      } catch {
        // Leave the item unread; the badge stays truthful to the server.
      }
    },
    [apiBaseUrl, items],
  );

  const renderItem = useCallback(
    ({ item }: { item: NotificationDto }) => {
      const unread = item.readAt === null;
      return (
        <Pressable
          style={[styles.card, unread && styles.cardUnread]}
          onPress={() => openItem(item.id)}
          accessibilityLabel={`${TYPOLOGY_SIGNAGE[item.typology].label}: ${item.title}`}
          accessibilityHint={unread ? 'Marks the notification as read' : undefined}
          testID={`notification-${item.id}`}
        >
          <View style={styles.cardHeader}>
            <TypologyChip typology={item.typology} />
            {unread ? <View style={styles.unreadDot} /> : null}
          </View>
          <Text style={[styles.title, unread && styles.titleUnread]}>{item.title}</Text>
          <Text style={styles.body}>{item.body}</Text>
          <Text style={styles.timestamp}>
            {new Date(item.receivedAt).toLocaleString()}
          </Text>
        </Pressable>
      );
    },
    [openItem],
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 ? (
          <View style={styles.badge} testID="unread-badge">
            <Text style={styles.badgeText}>{unreadCount}</Text>
          </View>
        ) : null}
      </View>
      {loading ? (
        <ActivityIndicator style={styles.loading} size="large" />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <FlatList
          testID="notifications-list"
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          onEndReached={loadMore}
          onEndReachedThreshold={0.25}
          ListFooterComponent={loadingMore ? <ActivityIndicator style={styles.footer} /> : null}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => loadPage(1, 'refresh')} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6fa' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 12,
    backgroundColor: '#fff',
  },
  headerTitle: { fontSize: 22, fontWeight: '700' },
  badge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#d92626',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  loading: { marginTop: 32 },
  footer: { marginVertical: 16 },
  error: { color: '#c53030', padding: 16 },
  list: { padding: 16, gap: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    gap: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  cardUnread: {
    borderColor: '#d92626',
    backgroundColor: '#fff5f5',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  chip: {
    alignSelf: 'flex-start',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  chipText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#d92626' },
  title: { fontSize: 16, fontWeight: '600' },
  titleUnread: { fontWeight: '800' },
  body: { color: '#333' },
  timestamp: { color: '#777', fontSize: 12 },
});
