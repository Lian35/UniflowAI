
'use client';

import { useEffect } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

/**
 * Componente que observa las preferencias de usuario en Firestore 
 * y aplica el tema (claro/oscuro) globalmente a la aplicación.
 */
export function ThemeWatcher() {
  const { user } = useUser();
  const db = useFirestore();

  const settingsRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(db, "users", user.uid, "settings", "user_settings");
  }, [user, db]);

  const { data: settings } = useDoc(settingsRef);

  useEffect(() => {
    // Si no hay configuración o el usuario no está autenticado, no hacemos nada.
    // Opcional: Podríamos verificar preferencias del sistema aquí.
    if (!settings) return;

    const isDark = settings.darkModeEnabled;
    const root = window.document.documentElement;

    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [settings?.darkModeEnabled]);

  return null;
}
