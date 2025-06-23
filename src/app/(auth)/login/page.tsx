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
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="w-full max-w-md p-8 space-y-8 bg-slate-800 border-2 border-slate-600">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-700 border-2 border-blue-500">
              <TestTube className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-mono font-bold text-white uppercase tracking-wide">
            ВХОД В СИСТЕМУ
          </h1>
          <p className="mt-2 text-sm text-slate-300 font-mono">
            ВОЙДИТЕ В СВОЙ АККАУНТ ДЛЯ ДОСТУПА К ПЛАТФОРМЕ ТЕСТИРОВАНИЯ
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {(error || errorMessage) && (
            <div
              className={`p-4 border-2 ${
                (errorMessage || error)?.includes("не активирован") ||
                (errorMessage || error)?.includes("not activated")
                  ? "text-yellow-200 bg-yellow-900 border-yellow-600"
                  : (errorMessage || error)?.includes("заблокирован") ||
                    (errorMessage || error)?.includes("blocked")
                  ? "text-red-200 bg-red-900 border-red-600"
                  : (errorMessage || error)?.includes("не найден") ||
                    (errorMessage || error)?.includes("not found")
                  ? "text-blue-200 bg-blue-900 border-blue-600"
                  : "text-red-200 bg-red-900 border-red-600"
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
                <span className="text-sm font-mono">{errorMessage || error}</span>
              </div>
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-mono font-bold text-white mb-2 uppercase tracking-wide"
            >
              EMAIL АДРЕС
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-3 border-2 border-slate-600 bg-slate-700 text-white font-mono focus:outline-none focus:border-blue-400"
              placeholder="ВВЕДИТЕ ВАШ EMAIL"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-mono font-bold text-white mb-2 uppercase tracking-wide"
            >
              ПАРОЛЬ
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-3 pr-10 border-2 border-slate-600 bg-slate-700 text-white font-mono focus:outline-none focus:border-blue-400"
                placeholder="ВВЕДИТЕ ВАШ ПАРОЛЬ"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400"
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
              className="w-full flex justify-center items-center gap-2 py-3 px-4 border-2 border-blue-600 text-sm font-mono font-bold text-white bg-blue-700 disabled:bg-blue-800 disabled:border-blue-700 disabled:cursor-not-allowed uppercase tracking-wide"
            >
              {loading ? (
                <>
                  <div className="border-2 border-white border-t-transparent w-4 h-4"></div>
                  ВХОД...
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  ВОЙТИ
                </>
              )}
            </button>
          </div>

          <div className="text-center space-y-3">
            <p className="text-sm font-mono text-slate-300">
              НЕТ АККАУНТА?{" "}
              <Link
                href="/register"
                className="font-mono font-bold text-blue-400 border-b border-blue-400"
              >
                ЗАРЕГИСТРИРОВАТЬСЯ
              </Link>
            </p>
            <p className="text-xs text-slate-400 font-mono">
              ЕСЛИ ВАШ АККАУНТ НЕ АКТИВИРОВАН, ОБРАТИТЕСЬ К АДМИНИСТРАТОРУ ИЛИ
              КУРАТОРУ СИСТЕМЫ
            </p>
          </div>
        </form>

        {/* Информационный блок о системе */}
        <div className="mt-8 pt-6 border-t-2 border-slate-600">
          <div className="text-center">
            <h3 className="text-sm font-mono font-bold text-white mb-3 uppercase tracking-wide">
              СИСТЕМА ТЕСТИРОВАНИЯ АБИТУРИЕНТОВ
            </h3>
            <div className="grid grid-cols-3 gap-4 text-xs text-slate-300 font-mono">
              <div className="flex flex-col items-center border border-slate-600 p-3">
                <GraduationCap className="h-6 w-6 text-blue-400 mb-1" />
                <span className="uppercase">АБИТУРИЕНТЫ</span>
              </div>
              <div className="flex flex-col items-center border border-slate-600 p-3">
                <TestTube className="h-6 w-6 text-blue-400 mb-1" />
                <span className="uppercase">ТЕСТИРОВАНИЕ</span>
              </div>
              <div className="flex flex-col items-center border border-slate-600 p-3">
                <CheckCircle className="h-6 w-6 text-blue-400 mb-1" />
                <span className="uppercase">РЕЗУЛЬТАТЫ</span>
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
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="w-full max-w-md p-8 space-y-8 bg-slate-800 border-2 border-slate-600">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-700 border-2 border-blue-500">
              <TestTube className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-mono font-bold text-white uppercase tracking-wide">
            ВХОД В СИСТЕМУ
          </h1>
          <p className="mt-2 text-sm text-slate-300 font-mono uppercase">
            ЗАГРУЗКА...
          </p>
        </div>
        <div className="flex justify-center">
          <div className="border-2 border-blue-400 border-t-transparent w-8 h-8"></div>
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