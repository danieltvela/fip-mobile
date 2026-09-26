import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { isValidCredentialFormat, normalizeCredential } from '@fip/shared';
import { ApiError, apiLogin } from '../src/lib/api';
import { sessionFromLogin } from '../src/session/store';
import { useSession } from '../src/session/SessionContext';

/**
 * Login screen: journalists enter the credential number issued by the
 * press team. The number has a VISA/MasterCard credit-card format and is
 * validated locally (structure + Luhn) before it is submitted.
 */
export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useSession();
  const [cardInput, setCardInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const digits = normalizeCredential(cardInput);
  const formatValid = isValidCredentialFormat(cardInput);
  const submitDisabled = submitting || !formatValid;

  function onChangeText(value: string) {
    setCardInput(formatInput(value));
    setError(null);
  }

  async function onSubmit() {
    setError(null);
    setSubmitting(true);
    try {
      const response = await apiLogin(cardInput);
      await signIn(sessionFromLogin(response));
      router.replace('/profile');
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) {
        setError('This credential number is not recognized.');
      } else if (cause instanceof ApiError) {
        setError(cause.message);
      } else {
        setError('Could not reach the press office server.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.card}>
        <Text style={styles.title}>FIP Press</Text>
        <Text style={styles.subtitle}>Sign in with your press credential</Text>
        <TextInput
          style={styles.input}
          value={cardInput}
          onChangeText={onChangeText}
          placeholder="0000 0000 0000 0000"
          keyboardType="number-pad"
          maxLength={19}
          autoComplete="off"
          importantForAutofill="no"
          accessibilityLabel="Credential number"
        />
        {!isValidEntry(digits) ? (
          <Text style={styles.hint}>Enter the 16 digits of your press credential.</Text>
        ) : !formatValid ? (
          <Text style={styles.error}>This number is not a valid VISA or MasterCard credential.</Text>
        ) : null}
        {error === null ? null : <Text style={styles.error}>{error}</Text>}
        <Pressable
          style={({ pressed }) => [styles.button, (pressed || submitDisabled) && styles.buttonPressed]}
          onPress={onSubmit}
          disabled={submitDisabled}
          accessibilityRole="button"
          accessibilityState={{ disabled: submitDisabled }}
        >
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign in</Text>}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function formatInput(value: string): string {
  return normalizeCredential(value).slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ');
}

function isValidEntry(digits: string): boolean {
  return digits.length === 16 || digits.length === 0;
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', backgroundColor: '#10151c', padding: 24 },
  card: { gap: 12 },
  title: { fontSize: 28, fontWeight: '700', color: '#ffffff', textAlign: 'center' },
  subtitle: { fontSize: 15, color: '#9aa7b5', textAlign: 'center', marginBottom: 16 },
  input: {
    borderWidth: 1,
    borderColor: '#33404f',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 20,
    letterSpacing: 2,
    color: '#ffffff',
    backgroundColor: '#1a222c',
    textAlign: 'center',
  },
  hint: { color: '#9aa7b5', fontSize: 13 },
  error: { color: '#ff7a7a', fontSize: 13 },
  button: {
    marginTop: 12,
    backgroundColor: '#2f6fed',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonPressed: { opacity: 0.75 },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
});
