import { useAuth } from '@clerk/expo';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000';

export function useApi() {
  const { getToken, signOut } = useAuth();
  const router = useRouter();

  // Refs hold the latest values without making apiFetch change identity
  const getTokenRef = useRef(getToken);
  const signOutRef = useRef(signOut);
  const routerRef = useRef(router);

  useEffect(() => { getTokenRef.current = getToken; }, [getToken]);
  useEffect(() => { signOutRef.current = signOut; }, [signOut]);
  useEffect(() => { routerRef.current = router; }, [router]);

  const apiFetch = useCallback(async <T>(path: string, init?: RequestInit): Promise<T> => {
    const token = await getTokenRef.current();
    const res = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init?.headers ?? {}),
      },
    });

    if (res.status === 401) {
      try {
        await signOutRef.current();
      } catch {
        // Ignore sign-out failure and proceed to navigation
      }
      routerRef.current.replace('/(auth)/sign-in');
      throw new Error('Session expired. Redirecting to sign in...');
    }

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`API ${res.status}: ${body}`);
    }
    return res.json() as Promise<T>;
  }, []); // stable — never recreated

  return { apiFetch };
}
