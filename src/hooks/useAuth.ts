// src/hooks/useAuth.ts


import {
  useCurrentUser,
  useLogin,
  useLogout,
  useRegister,
} from "@/services/authService";
import { useAuthStore } from "@/store/authStore";
import { UserRole } from "@/types";
import { useEffect } from "react";
import { toast } from "react-toastify";

export function useAuth() {
  const { user, setUser, clearUser } = useAuthStore();

  // React Query хуки
  const {
    data: currentUser,
    isLoading: isCheckingAuth,
    error: authError,
  } = useCurrentUser();
  const loginMutation = useLogin();
  const logoutMutation = useLogout();
  const registerMutation = useRegister();

  // Синхронизируем состояние Zustand с React Query
  useEffect(() => {
    if (currentUser && !("notActivated" in currentUser)) {
      setUser(currentUser);
    } else {
      clearUser();
    }
  }, [currentUser, setUser, clearUser]);

  // Функции для компонентов
  const login = async (email: string, password: string) => {
    try {
      const user = await loginMutation.mutateAsync({ email, password });
      setUser(user);
      return user;
    } catch (error) {
      clearUser();
      throw error;
    }
  };

  const logout = async () => {
    try {
      await logoutMutation.mutateAsync();
      clearUser();
      toast.info("👋 Вы успешно вышли из системы", {
        position: "top-right",
        autoClose: 3000,
      });
    } catch (error) {
      // Даже если запрос не удался, очищаем локальное состояние
      clearUser();
      toast.warning("⚠️ Произошла ошибка при выходе, но сессия очищена", {
        position: "top-right",
        autoClose: 4000,
      });
      throw error;
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    role?: UserRole,
    directionId?: string
  ) => {
    try {
      const result = await registerMutation.mutateAsync({
        name,
        email,
        password,
        role,
        directionId,
      });

      // Не показываем toast здесь, так как это делается в компоненте
      return result;
    } catch (error: any) {
      // Показываем детализированную ошибку регистрации
      const message = error?.message || "Неизвестная ошибка при регистрации";

      if (
        message.includes("уже существует") ||
        message.includes("already exists")
      ) {
        toast.error("📧 Пользователь с таким email уже зарегистрирован", {
          position: "top-center",
          autoClose: 5000,
        });
      } else if (message.includes("пароль") || message.includes("password")) {
        toast.error("🔒 Ошибка с паролем. Проверьте требования к паролю", {
          position: "top-center",
          autoClose: 5000,
        });
      } else if (message.includes("email") || message.includes("Email")) {
        toast.error("📧 Некорректный формат email адреса", {
          position: "top-center",
          autoClose: 5000,
        });
      } else {
        toast.error(`❌ Ошибка регистрации: ${message}`, {
          position: "top-center",
          autoClose: 5000,
        });
      }

      throw error;
    }
  };

  const clearError = () => {
    // Можно добавить логику очистки ошибок если нужно
  };

  // Показываем toast при ошибках аутентификации
  useEffect(() => {
    if (authError) {
      toast.error("🔐 Ошибка аутентификации. Пожалуйста, войдите заново", {
        position: "top-center",
        autoClose: 5000,
      });
    }
  }, [authError]);

  return {
    // Состояние
    user,
    loading:
      isCheckingAuth ||
      loginMutation.isPending ||
      logoutMutation.isPending ||
      registerMutation.isPending,
    error:
      authError?.message ||
      loginMutation.error?.message ||
      logoutMutation.error?.message ||
      registerMutation.error?.message ||
      null,

    // Действия
    login,
    logout,
    register,
    clearError,

    // Статусы мутаций
    isLoggingIn: loginMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    isRegistering: registerMutation.isPending,
  };
}
