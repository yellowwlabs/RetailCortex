import { useOAuth } from '@clerk/expo';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

WebBrowser.maybeCompleteAuthSession();

type Strategy = 'oauth_google' | 'oauth_github';

function OAuthButton({
  strategy,
  label,
  onError,
}: {
  strategy: Strategy;
  label: string;
  onError: (msg: string) => void;
}) {
  const { startOAuthFlow } = useOAuth({ strategy });
  const router = useRouter();
  const theme = useTheme();
  const [loading, setLoading] = useState(false);

  async function handlePress() {
    setLoading(true);
    try {
      const { createdSessionId, setActive } = await startOAuthFlow();
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        router.replace('/');
      }
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : `${label} sign in failed`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Pressable
      style={[styles.button, { borderColor: theme.backgroundElement }]}
      onPress={handlePress}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator color={theme.text} />
      ) : (
        <ThemedText style={styles.buttonText}>{label}</ThemedText>
      )}
    </Pressable>
  );
}

export function OAuthButtons({ onError }: { onError: (msg: string) => void }) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.divider}>
        <View style={[styles.line, { backgroundColor: theme.backgroundElement }]} />
        <ThemedText type="small" themeColor="textSecondary">
          or
        </ThemedText>
        <View style={[styles.line, { backgroundColor: theme.backgroundElement }]} />
      </View>
      <OAuthButton strategy="oauth_google" label="Continue with Google" onError={onError} />
      <OAuthButton strategy="oauth_github" label="Continue with GitHub" onError={onError} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginVertical: Spacing.one,
  },
  line: {
    flex: 1,
    height: 1,
  },
  button: {
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingVertical: Spacing.two + Spacing.half,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
