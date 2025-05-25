// src/app/(auth)/login/page.tsx
"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { UserRole } from "@/types";
import Layout from "@/components/common/Layout";
import { toast } from "react-toastify";
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  Info,
  TestTube,
  GraduationCap,
  Eye,
  EyeOff,
  LogIn,
} from "lucide-react";

// Компонент для обработки URL параметров
function LoginNotifications() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const registered = searchParams.get("registered");
    const activated = searchParams.get("activated");
    const activation = searchParams.get("activation");

    if (registered === "true") {
      if (activated === "true") {
        // Администратор - автоактивирован
        toast.success(
          "🎉 Регистрация завершена! Аккаунт активирован, можете войти в систему.",
          {
            autoClose: 6000,
          }
        );
      } else if (activation === "pending") {
        // Обычный пользователь - ожидает активации
        toast.info(
          "⏳ Регистрация завершена! Ваш аккаунт ожидает активации администратором или куратором.",
          {
            autoClose: 8000,
          }
        );
      } else {
        // Общее сообщение о регистрации
        toast.success("✅ Регистрация завершена успешно!", {
          autoClose: 5000,
        });
      }
    }
  }, [searchParams]);

  return null;
}

// Основной компонент логина
function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const { login, error, clearError, loading, user } = useAuth();
  const router = useRouter();

  // Перенаправление после успешного входа
  useEffect(() => {
    if (user && user.isActive) {
      toast.success(`Добро пожаловать, ${user.name}!`, {
        position: "top-right",
        autoClose: 3000,
      });
      redirectByRole(user.role);
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    clearError();

    try {
      await login(email, password);
      // Перенаправление теперь будет происходить в useEffect
    } catch (error: any) {
      const message = error?.message || "Ошибка при входе";

      // Показываем специфичные сообщения в блоке ошибок формы
      if (
        message.includes("не активирован") ||
        message.includes("not activated")
      ) {
        setErrorMessage(
          "⚠️ Ваш аккаунт еще не активирован администратором или куратором. Попробуйте позже или обратитесь к администратору."
        );
      } else if (
        message.includes("заблокирован") ||
        message.includes("blocked")
      ) {
        setErrorMessage(
          "🚫 Ваш аккаунт заблокирован. Обратитесь к администратору системы."
        );
      } else if (message.includes("Неверный") || message.includes("Invalid")) {
        setErrorMessage(
          "❌ Неверный email или пароль. Проверьте правильность введенных данных."
        );
      } else if (
        message.includes("не найден") ||
        message.includes("not found")
      ) {
        setErrorMessage(
          "📧 Пользователь с таким email не найден. Проверьте email или зарегистрируйтесь."
        );
      } else {
        setErrorMessage(`Ошибка входа: ${message}`);
      }
    }
  };

  // Функция перенаправления на основе роли пользователя
  const redirectByRole = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        router.push("/admin/dashboard");
        break;
      case UserRole.CURATOR:
        router.push("/curator/dashboard");
        break;
      case UserRole.APPLICANT:
        router.push("/applicant/dashboard");
        break;
      default:
        router.push("/");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-2xl shadow-xl border border-gray-100">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-indigo-600 rounded-full">
              <TestTube className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900">
            Вход в систему
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Войдите в свой аккаунт для доступа к платформе тестирования
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {(error || errorMessage) && (
            <div
              className={`p-4 border rounded-lg ${
                (errorMessage || error)?.includes("не активирован") ||
                (errorMessage || error)?.includes("not activated")
                  ? "text-amber-700 bg-amber-50 border-amber-200"
                  : (errorMessage || error)?.includes("заблокирован") ||
                    (errorMessage || error)?.includes("blocked")
                  ? "text-red-700 bg-red-50 border-red-200"
                  : (errorMessage || error)?.includes("не найден") ||
                    (errorMessage || error)?.includes("not found")
                  ? "text-blue-700 bg-blue-50 border-blue-200"
                  : "text-red-700 bg-red-50 border-red-200"
              }`}
            >
              <div className="flex items-center gap-2">
                {(errorMessage || error)?.includes("не активирован") ||
                (errorMessage || error)?.includes("not activated") ? (
                  <Clock className="h-4 w-4 flex-shrink-0" />
                ) : (errorMessage || error)?.includes("заблокирован") ||
                  (errorMessage || error)?.includes("blocked") ? (
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                ) : (errorMessage || error)?.includes("не найден") ||
                  (errorMessage || error)?.includes("not found") ? (
                  <Info className="h-4 w-4 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                )}
                <span className="text-sm">{errorMessage || error}</span>
              </div>
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email адрес
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              placeholder="введите ваш email"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Пароль
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-3 pr-10 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                placeholder="введите ваш пароль"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Вход...
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  Войти
                </>
              )}
            </button>
          </div>

          <div className="text-center space-y-3">
            <p className="text-sm">
              Нет аккаунта?{" "}
              <Link
                href="/register"
                className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
              >
                Зарегистрироваться
              </Link>
            </p>
            <p className="text-xs text-gray-500">
              Если ваш аккаунт не активирован, обратитесь к администратору или
              куратору системы
            </p>
          </div>
        </form>

        {/* Информационный блок о системе */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="text-center">
            <h3 className="text-sm font-medium text-gray-900 mb-3">
              Система тестирования абитуриентов
            </h3>
            <div className="grid grid-cols-3 gap-4 text-xs text-gray-600">
              <div className="flex flex-col items-center">
                <GraduationCap className="h-6 w-6 text-indigo-600 mb-1" />
                <span>Для абитуриентов</span>
              </div>
              <div className="flex flex-col items-center">
                <TestTube className="h-6 w-6 text-indigo-600 mb-1" />
                <span>Тестирование</span>
              </div>
              <div className="flex flex-col items-center">
                <CheckCircle className="h-6 w-6 text-indigo-600 mb-1" />
                <span>Результаты</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Fallback компонент для загрузки
function LoginPageFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-2xl shadow-xl border border-gray-100">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-indigo-600 rounded-full">
              <TestTube className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900">
            Вход в систему
          </h1>
          <p className="mt-2 text-sm text-gray-600">Загрузка...</p>
        </div>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Layout title="Вход в систему тестирования">
      <Suspense fallback={<LoginPageFallback />}>
        <LoginNotifications />
        <LoginForm />
      </Suspense>
    </Layout>
  );
}
