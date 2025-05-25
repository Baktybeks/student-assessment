// src/hooks/useSyncAuthCookie.ts

import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";

/**
 * Хук для синхронизации состояния аутентификации с cookies
 * Необходим для работы middleware, который читает состояние из cookies
 */
export function useSyncAuthCookie() {
  const { user } = useAuthStore();

  useEffect(() => {
    // Функция для обновления cookie
    const updateAuthCookie = () => {
      const authData = {
        state: {
          user: user,
        },
      };

      // Устанавливаем cookie с тем же именем, что используется в Zustand persist
      document.cookie = `auth-storage=${encodeURIComponent(
        JSON.stringify(authData)
      )}; path=/; max-age=86400; SameSite=Lax`;
    };

    // Обновляем cookie при изменении пользователя
    updateAuthCookie();
  }, [user]);

  // Очистка cookie при размонтировании (опционально)
  useEffect(() => {
    return () => {
      // При необходимости можно добавить логику очистки
    };
  }, []);
}
