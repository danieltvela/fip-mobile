import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Link, Stack } from 'expo-router';
import type { GalleryRefDto, MediaItemDto } from '@fip/shared';
import { absoluteUrl, listGalleries, listMedia } from '../../lib/api';

const TYPE_LABEL: Record<string, string> = {
  note: 'Note',
  dossier: 'Dossier',
  image: 'Image',
  video: 'Video',
  audio: 'Audio',
};

export default function GalleryScreen() {
  const [galleries, setGalleries] = useState<GalleryRefDto[]>([]);
  const [scope, setScope] = useState<{ editionId?: string; eventId?: string }>({});
  const [items, setItems] = useState<MediaItemDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listGalleries().then(setGalleries).catch((e) => setError(String(e)));
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    listMedia(scope)
      .then((rows) => {
        setItems(rows);
        setLoading(false);
      })
      .catch((e) => {
        setError(String(e));
        setLoading(false);
      });
  }, [scope]);

  const renderItem = useCallback(
    ({ item }: { item: MediaItemDto }) => (
      <Link href={`/gallery/${item.id}`} asChild>
        <TouchableOpacity style={styles.row}>
          <Image source={{ uri: absoluteUrl(item.previewUrl) }} style={styles.thumb} />
          <View style={styles.rowMeta}>
            <Text style={styles.rowTitle}>{item.title}</Text>
            <Text style={styles.rowSub}>
              {TYPE_LABEL[item.type] ?? item.type} · {item.topic}
            </Text>
            <Text style={styles.rowDate}>
              {new Date(item.publishedAt).toLocaleDateString()}
            </Text>
          </View>
        </TouchableOpacity>
      </Link>
    ),
    [],
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Media gallery' }} />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chips}
        contentContainerStyle={styles.chipsInner}
      >
        <Chip label="All" active={Object.keys(scope).length === 0} onPress={() => setScope({})} />
        {galleries.map((gallery) => (
          <Chip
            key={gallery.id}
            label={`${gallery.name} (${gallery.itemCount})`}
            active={
              (gallery.kind === 'edition' && scope.editionId === gallery.id) ||
              (gallery.kind === 'event' && scope.eventId === gallery.id)
            }
            onPress={() =>
              setScope(gallery.kind === 'edition' ? { editionId: gallery.id } : { eventId: gallery.id })
            }
          />
        ))}
      </ScrollView>
      {loading ? (
        <ActivityIndicator style={styles.center} />
      ) : error ? (
        <Text style={[styles.center, styles.error]}>{error}</Text>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListEmptyComponent={<Text style={styles.center}>No media in this gallery yet.</Text>}
        />
      )}
    </View>
  );
}

function Chip(props: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={props.onPress}
      style={[styles.chip, props.active ? styles.chipActive : null]}
    >
      <Text style={[styles.chipText, props.active ? styles.chipTextActive : null]}>
        {props.label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  chips: { maxHeight: 48 },
  chipsInner: { paddingHorizontal: 12, gap: 8, alignItems: 'center' },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#eee',
    marginVertical: 8,
  },
  chipActive: { backgroundColor: '#1a3c8f' },
  chipText: { fontSize: 13, color: '#333' },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  row: {
    flexDirection: 'row',
    padding: 12,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
  },
  thumb: { width: 88, height: 66, borderRadius: 6, backgroundColor: '#eee' },
  rowMeta: { flex: 1, justifyContent: 'center' },
  rowTitle: { fontSize: 15, fontWeight: '600' },
  rowSub: { fontSize: 12, color: '#666', marginTop: 2 },
  rowDate: { fontSize: 11, color: '#999', marginTop: 2 },
  center: { textAlign: 'center', marginTop: 24, color: '#666' },
  error: { color: '#c0392b' },
});
