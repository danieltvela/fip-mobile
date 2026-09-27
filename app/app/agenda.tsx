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
import { AGENDA_EVENTS, AgendaEvent } from '@fip/shared';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AGENDA_FILTERS,
  AgendaFilter,
  applyAgendaFilter,
} from '../lib/agenda';
import {
  loadFavorites,
  saveFavorites,
  toggleFavorite,
} from '../lib/favorites';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

const FILTER_LABEL: Record<AgendaFilter, string> = {
  all: 'All',
  forums: 'Forums',
  events: 'Events',
  favorites: 'Favorites ★',
};

const CATEGORY_LABEL: Record<AgendaEvent['category'], string> = {
  forum: 'Forum',
  event: 'Event',
};

async function fetchAgenda(): Promise<readonly AgendaEvent[]> {
  try {
    const response = await fetch(`${API_URL}/agenda`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = (await response.json()) as AgendaEvent[];
    return data;
  } catch {
    // Offline or server not running: use the bundled agenda.
    return AGENDA_EVENTS;
  }
}

export default function AgendaScreen() {
  const [events, setEvents] = useState<readonly AgendaEvent[]>([]);
  const [filter, setFilter] = useState<AgendaFilter>('all');
  const [favorites, setFavorites] = useState<ReadonlySet<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFavorites(AsyncStorage).then(setFavorites);
    fetchAgenda().then((data) => {
      setEvents(data);
      setLoading(false);
    });
  }, []);

  const onToggleFavorite = useCallback(
    (id: string) => {
      saveFavorites(AsyncStorage, toggleFavorite(favorites, id)).then(setFavorites);
    },
    [favorites],
  );

  const onRefresh = useCallback(() => {
    setLoading(true);
    fetchAgenda().then((data) => {
      setEvents(data);
      setLoading(false);
    });
  }, []);

  const visible = applyAgendaFilter(events, filter, favorites);

  return (
    <View style={styles.container}>
      <View style={styles.filterRow}>
        {AGENDA_FILTERS.map((option) => (
          <Pressable
            key={option}
            onPress={() => setFilter(option)}
            style={[styles.filterChip, filter === option && styles.filterChipActive]}
          >
            <Text
              style={[
                styles.filterLabel,
                filter === option && styles.filterLabelActive,
              ]}
            >
              {FILTER_LABEL[option]}
            </Text>
          </Pressable>
        ))}
      </View>
      {loading ? (
        <ActivityIndicator style={styles.spinner} />
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={onRefresh} />
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.category}>{CATEGORY_LABEL[item.category]}</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={
                    favorites.has(item.id)
                      ? `Unfavorite ${item.title}`
                      : `Favorite ${item.title}`
                  }
                  onPress={() => onToggleFavorite(item.id)}
                >
                  <Text style={styles.star}>{favorites.has(item.id) ? '★' : '☆'}</Text>
                </Pressable>
              </View>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.detail}>{item.date}</Text>
              <Text style={styles.detail}>
                {item.time} · {item.venue}
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#eee',
  },
  filterChipActive: { backgroundColor: '#1d4ed8' },
  filterLabel: { color: '#333' },
  filterLabelActive: { color: '#fff', fontWeight: '600' },
  spinner: { marginTop: 24 },
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f7f7f8',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  category: { color: '#1d4ed8', fontWeight: '600', fontSize: 12 },
  star: { fontSize: 22 },
  title: { marginTop: 6, fontSize: 16, fontWeight: '600' },
  detail: { marginTop: 4, color: '#555' },
});
