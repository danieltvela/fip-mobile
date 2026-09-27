import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import type { MediaItemDto } from '@fip/shared';
import { absoluteUrl, getMedia } from '../../../lib/api';
import { downloadToDevice, type DownloadProgress } from '../../../lib/download';

const PHASE_MESSAGE: Record<DownloadProgress['phase'], string> = {
  idle: '',
  downloading: 'Downloading…',
  saving: 'Saving to media library…',
  done: 'Saved to device',
  error: 'Download failed',
};

export default function MediaDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [item, setItem] = useState<MediaItemDto | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [progress, setProgress] = useState<DownloadProgress>({
    phase: 'idle',
    fraction: 0,
  });

  useEffect(() => {
    getMedia(id).then(setItem).catch((e) => setLoadError(String(e)));
  }, [id]);

  if (loadError) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>{loadError}</Text>
      </View>
    );
  }
  if (!item) {
    return (
      <View style={styles.container}>
        <ActivityIndicator style={styles.center} />
      </View>
    );
  }

  const busy = progress.phase === 'downloading' || progress.phase === 'saving';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: item.title }} />
      {item.type === 'image' ? (
        <Image
          source={{ uri: absoluteUrl(item.fullPreviewUrl) }}
          style={styles.preview}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.preview, styles.previewPlaceholder]}>
          <Text style={styles.placeholderText}>
            {item.type === 'video' ? 'Video' : 'Audio'} · no visual preview
          </Text>
        </View>
      )}

      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.meta}>
        {item.topic} · {new Date(item.publishedAt).toLocaleString()} ·{' '}
        {(item.sizeBytes / 1024).toFixed(0)} kB
      </Text>

      <TouchableOpacity
        style={[styles.button, busy || progress.phase === 'done' ? styles.buttonDisabled : null]}
        disabled={busy || progress.phase === 'done'}
        onPress={() => downloadToDevice(item, setProgress)}
      >
        <Text style={styles.buttonText}>
          {progress.phase === 'done' ? 'Downloaded' : 'Download to device'}
        </Text>
      </TouchableOpacity>

      {progress.phase !== 'idle' ? (
        <View style={styles.progressBlock}>
          <Text style={styles.progressLabel}>
            {PHASE_MESSAGE[progress.phase]}
            {progress.error ? ` — ${progress.error}` : ''}
          </Text>
          <View style={styles.track}>
            <View
              style={[
                styles.fill,
                progress.phase === 'error' && styles.fillError,
                { width: `${Math.round(progress.fraction * 100)}%` },
              ]}
            />
          </View>
          <Text style={styles.percent}>{Math.round(progress.fraction * 100)}%</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16, gap: 12 },
  preview: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 10,
    backgroundColor: '#eee',
  },
  previewPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  placeholderText: { color: '#888' },
  title: { fontSize: 20, fontWeight: '700' },
  meta: { fontSize: 13, color: '#666' },
  button: {
    backgroundColor: '#1a3c8f',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '600' },
  progressBlock: { gap: 6 },
  progressLabel: { fontSize: 12, color: '#444' },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#eee',
    overflow: 'hidden',
  },
  fill: { height: '100%', backgroundColor: '#1a3c8f' },
  fillError: { backgroundColor: '#c0392b' },
  percent: { fontSize: 11, color: '#888' },
  error: { color: '#c0392b', padding: 16 },
});
