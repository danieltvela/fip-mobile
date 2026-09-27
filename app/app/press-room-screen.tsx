import {
  MATERIAL_TOPICS,
  MATERIAL_TYPES,
  MaterialList,
  MaterialTopic,
  MaterialType,
  SearchMode,
  fetchMaterials,
} from '@fip/shared';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SearchState, selectFilter, searchStateToQuery, setMode } from '../src/search';

interface Props {
  apiBaseUrl: string;
}

export function PressRoomScreen({ apiBaseUrl }: Props) {
  const [search, setSearch] = useState<SearchState>({ mode: 'type' });
  const [list, setList] = useState<MaterialList | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setList(await fetchMaterials(apiBaseUrl, searchStateToQuery(search)));
    } catch {
      setError('Could not load the press room. Check your connection and try again.');
    }
  }, [apiBaseUrl, search]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Press room</Text>
      <SearchToggle mode={search.mode} onMode={(mode) => setSearch((s) => setMode(s, mode))} />
      <FacetRow search={search} onSelect={(mode, value) => setSearch((s) => selectFilter(s, mode, value))} />
      {error !== null ? <Text style={styles.error}>{error}</Text> : null}
      {list === null && error === null ? (
        <ActivityIndicator style={styles.loading} />
      ) : (
        <FlatList
          data={list?.items ?? []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.meta}>
                  {item.type} · {item.topic}
                </Text>
                {item.isNew ? <View style={styles.newBadge}><Text style={styles.newBadgeText}>NEW</Text></View> : null}
              </View>
              <Text style={styles.title}>{item.title}</Text>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No materials match the selected filter.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, paddingTop: 48, backgroundColor: '#fff' },
  heading: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
  toggleRow: { flexDirection: 'row', marginBottom: 12, gap: 8 },
  toggleButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
  },
  toggleButtonActive: { borderColor: '#1a4fa0', backgroundColor: '#1a4fa0' },
  toggleLabel: { color: '#333', fontWeight: '600' },
  toggleLabelActive: { color: '#fff' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: '#ccc' },
  chipActive: { borderColor: '#1a4fa0', backgroundColor: '#e8f0fe' },
  chipLabel: { color: '#333' },
  chipLabelActive: { color: '#1a4fa0', fontWeight: '600' },
  card: { padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#eee', marginBottom: 8 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  meta: { color: '#666', fontSize: 12, textTransform: 'capitalize' },
  newBadge: { backgroundColor: '#d93636', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  newBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  title: { fontSize: 16, fontWeight: '500', marginTop: 4 },
  error: { color: '#d93636', marginBottom: 8 },
  loading: { marginTop: 24 },
  empty: { color: '#666', marginTop: 8 },
});

function SearchToggle({ mode, onMode }: { mode: SearchMode; onMode: (mode: SearchMode) => void }) {
  return (
    <View style={styles.toggleRow}>
      {(['type', 'topic'] as const).map((option) => (
        <Pressable
          key={option}
          onPress={() => onMode(option)}
          style={[styles.toggleButton, mode === option && styles.toggleButtonActive]}
        >
          <Text style={[styles.toggleLabel, mode === option && styles.toggleLabelActive]}>
            {option === 'type' ? 'By type' : 'By topic'}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function FacetRow({
  search,
  onSelect,
}: {
  search: SearchState;
  onSelect: (mode: SearchMode, value: MaterialType | MaterialTopic) => void;
}) {
  const options: readonly (MaterialType | MaterialTopic)[] =
    search.mode === 'type' ? MATERIAL_TYPES : MATERIAL_TOPICS;
  const active = search.mode === 'type' ? search.type : search.topic;
  return (
    <View style={styles.chipRow}>
      {options.map((option) => (
        <Pressable
          key={option}
          onPress={() => onSelect(search.mode, option)}
          style={[styles.chip, active === option && styles.chipActive]}
        >
          <Text style={[styles.chipLabel, active === option && styles.chipLabelActive]}>{option}</Text>
        </Pressable>
      ))}
    </View>
  );
}
