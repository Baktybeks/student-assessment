// src/app/(auth)/register/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useActiveDirections } from "@/services/instituteService";
import { UserRole } from "@/types";
import Layout from "@/components/common/Layout";
import { toast } from "react-toastify";
import {
  CheckCircle,
  Clock,
  AlertCircle,
  TestTube,
  GraduationCap,
  Users,
  Eye,
  EyeOff,
  UserPlus,
  Building,
} from "lucide-react";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<UserRole>(UserRole.APPLICANT);
  const [directionId, setDirectionId] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isFirstUser, setIsFirstUser] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [registeredRole, setRegisteredRole] = useState<UserRole | null>(null);

  const { register, error, clearError, loading } = useAuth();
  const { data: directions = [], isLoading: directionsLoading } =
    useActiveDirections();
  const router = useRouter();

  // Проверяем, есть ли администраторы в системе
  useEffect(() => {
    const checkFirstUser = async () => {
      try {
        const response = await fetch("/api/check-admins");
        const data = await response.json();
        setIsFirstUser(data.isFirstUser);

        // Если первый пользователь, сразу устанавливаем роль ADMIN
        if (data.isFirstUser) {
          setRole(UserRole.ADMIN);
        }
      } catch (error) {
        console.error("Ошибка при проверке администраторов:", error);
      }
    };

    checkFirstUser();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    clearError();

    // Валидация
    if (password !== confirmPassword) {
      setErrorMessage("Пароли не совпадают");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("Пароль должен содержать минимум 8 символов");
      return;
    }

    if (role === UserRole.APPLICANT && !directionId) {
      setErrorMessage("Выберите направление подготовки");
      return;
    }

    try {
      // Регистрируем пользователя с выбранной ролью
      await register(
        name,
        email,
        password,
        role,
        role === UserRole.APPLICANT ? directionId : undefined
      );

      // Устанавливаем состояние успешной регистрации
      setRegistrationSuccess(true);
      setRegisteredRole(role);

      // Показываем соответствующее уведомление
      if (isFirstUser || role === UserRole.ADMIN) {
        toast.success("🎉 Регистрация завершена! Вы можете войти в систему.", {
          autoClose: 5000,
        });

        // Перенаправляем на страницу входа через 3 секунды
        setTimeout(() => {
          router.push("/login?registered=true&activated=true");
        }, 3000);
      } else {
        toast.info("✅ Регистрация завершена! Ожидайте активации аккаунта.", {
          autoClose: 7000,
        });

        // Перенаправляем на страницу входа через 5 секунд
        setTimeout(() => {
          router.push("/login?registered=true&activation=pending");
        }, 5000);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Ошибка при регистрации";
      setErrorMessage(message);
      toast.error(`Ошибка регистрации: ${message}`);
    }
  };

  // Если регистрация прошла успешно, показываем сообщение
  if (registrationSuccess) {
    return (
      <Layout title="Регистрация завершена">
        <div className="min-h-screen flex items-center justify-center bg-slate-900">
          <div className="w-full max-w-md p-8 space-y-6 bg-slate-800 border-2 border-slate-600 text-center">
            {isFirstUser || registeredRole === UserRole.ADMIN ? (
              // Сообщение для администратора (автоактивация)
              <>
                <div className="flex justify-center">
                  <div className="p-3 bg-green-800 border-2 border-green-600">
                    <CheckCircle className="h-8 w-8 text-green-400" />
                  </div>
                </div>
                <h1 className="text-2xl font-mono font-bold text-white uppercase tracking-wide">
                  ДОБРО ПОЖАЛОВАТЬ!
                </h1>
                <div className="space-y-3">
                  <p className="text-slate-300 font-mono">
                    Ваш аккаунт администратора успешно создан и автоматически
                    активирован.
                  </p>
                  <div className="bg-green-900 border-2 border-green-600 p-4">
                    <p className="text-sm text-green-200 font-mono text-left">
                      <strong>ИМЯ:</strong> {name}
                      <br />
                      <strong>EMAIL:</strong> {email}
                      <br />
                      <strong>РОЛЬ:</strong> АДМИНИСТРАТОР
                    </p>
                  </div>
                  <p className="text-xs text-slate-400 font-mono uppercase">
                    ПЕРЕНАПРАВЛЕНИЕ НА СТРАНИЦУ ВХОДА...
                  </p>
                </div>
              </>
            ) : (
              // Сообщение для обычных пользователей (нужна активация)
              <>
                <div className="flex justify-center">
                  <div className="p-3 bg-yellow-800 border-2 border-yellow-600">
                    <Clock className="h-8 w-8 text-yellow-400" />
                  </div>
                </div>
                <h1 className="text-2xl font-mono font-bold text-white uppercase tracking-wide">
                  РЕГИСТРАЦИЯ ЗАВЕРШЕНА!
                </h1>
                <div className="space-y-3">
                  <p className="text-slate-300 font-mono">
                    Ваш аккаунт успешно создан, но требует активации
                    {role === UserRole.CURATOR
                      ? " администратором"
                      : " куратором или администратором"}
                    .
                  </p>
                  <div className="bg-yellow-900 border-2 border-yellow-600 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="h-4 w-4 text-yellow-400" />
                      <span className="text-sm font-mono font-bold text-yellow-200 uppercase">
                        ЧТО ДАЛЬШЕ?
                      </span>
                    </div>
                    <ul className="text-sm text-yellow-300 font-mono space-y-1 text-left">
                      <li>
                        • АДМИНИСТРАТОР ПОЛУЧИТ УВЕДОМЛЕНИЕ О ВАШЕЙ РЕГИСТРАЦИИ
                      </li>
                      <li>• ПОСЛЕ АКТИВАЦИИ ВЫ ПОЛУЧИТЕ ДОСТУП К СИСТЕМЕ</li>
                      <li>• ПОПРОБУЙТЕ ВОЙТИ ЧЕРЕЗ НЕСКОЛЬКО МИНУТ</li>
                      {role === UserRole.APPLICANT && (
                        <li>
                          • ПОСЛЕ АКТИВАЦИИ ЗАПОЛНИТЕ АНКЕТУ ДЛЯ ДОСТУПА К
                          ТЕСТАМ
                        </li>
                      )}
                    </ul>
                  </div>
                  <div className="bg-slate-700 border-2 border-slate-600 p-4">
                    <p className="text-sm text-slate-300 font-mono text-left">
                      <strong>ИМЯ:</strong> {name}
                      <br />
                      <strong>EMAIL:</strong> {email}
                      <br />
                      <strong>РОЛЬ:</strong>{" "}
                      {registeredRole === UserRole.CURATOR
                        ? "КУРАТОР"
                        : "АБИТУРИЕНТ"}
                      {registeredRole === UserRole.APPLICANT && directionId && (
                        <>
                          <br />
                          <strong>НАПРАВЛЕНИЕ:</strong>{" "}
                          {directions.find((d) => d.$id === directionId)
                            ?.name || "ВЫБРАННОЕ НАПРАВЛЕНИЕ"}
                        </>
                      )}
                    </p>
                  </div>
                  <p className="text-xs text-slate-400 font-mono uppercase">
                    ПЕРЕНАПРАВЛЕНИЕ НА СТРАНИЦУ ВХОДА...
                  </p>
                </div>
              </>
            )}

            <div className="pt-4">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-800 border-2 border-blue-600 text-blue-200 font-mono font-bold uppercase"
              >
                ПЕРЕЙТИ КО ВХОДУ
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Регистрация в системе тестирования">
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="w-full max-w-md p-8 space-y-8 bg-slate-800 border-2 border-slate-600">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-blue-800 border-2 border-blue-600">
                <UserPlus className="h-8 w-8 text-blue-400" />
              </div>
            </div>
            <h1 className="text-3xl font-mono font-bold text-white uppercase tracking-wide">
              РЕГИСТРАЦИЯ
            </h1>
            <p className="mt-2 text-sm text-slate-300 font-mono">
              СОЗДАЙТЕ АККАУНТ ДЛЯ ДОСТУПА К СИСТЕМЕ ТЕСТИРОВАНИЯ
            </p>
          </div>

          {!isFirstUser && role !== UserRole.ADMIN && (
            <div className="bg-yellow-900 border-2 border-yellow-600 p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-400 flex-shrink-0" />
                <p className="text-sm text-yellow-200 font-mono">
                  <strong>ВАЖНО:</strong> ПОСЛЕ РЕГИСТРАЦИИ ВАШ АККАУНТ ДОЛЖЕН
                  БЫТЬ АКТИВИРОВАН{" "}
                  {role === UserRole.CURATOR
                    ? "АДМИНИСТРАТОРОМ"
                    : "КУРАТОРОМ ИЛИ АДМИНИСТРАТОРОМ"}{" "}
                  ПЕРЕД ПЕРВЫМ ВХОДОМ В СИСТЕМУ.
                </p>
              </div>
            </div>
          )}

          <form
            className="mt-8 space-y-6"
            onSubmit={handleSubmit}
            autoComplete="off"
          >
            {(error || errorMessage) && (
              <div className="p-4 text-red-200 bg-red-900 border-2 border-red-600">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span className="text-sm font-mono">{errorMessage || error}</span>
                </div>
              </div>
            )}

            <div>
              <label
                htmlFor="name"
                className="block text-sm font-mono font-bold text-slate-300 mb-1 uppercase"
              >
                ПОЛНОЕ ИМЯ
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-3 border-2 border-slate-600 bg-slate-700 text-white font-mono focus:outline-none focus:border-blue-500"
                placeholder="ВВЕДИТЕ ВАШЕ ПОЛНОЕ ИМЯ"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-mono font-bold text-slate-300 mb-1 uppercase"
              >
                EMAIL АДРЕС
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="off"
                className="w-full px-3 py-3 border-2 border-slate-600 bg-slate-700 text-white font-mono focus:outline-none focus:border-blue-500"
                placeholder="ВВЕДИТЕ ВАШ EMAIL"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-mono font-bold text-slate-300 mb-1 uppercase"
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
                  autoComplete="off"
                  className="w-full px-3 py-3 pr-10 border-2 border-slate-600 bg-slate-700 text-white font-mono focus:outline-none focus:border-blue-500"
                  placeholder="МИНИМУМ 8 СИМВОЛОВ"
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
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-mono font-bold text-slate-300 mb-1 uppercase"
              >
                ПОДТВЕРЖДЕНИЕ ПАРОЛЯ
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-3 py-3 pr-10 border-2 border-slate-600 bg-slate-700 text-white font-mono focus:outline-none focus:border-blue-500"
                  placeholder="ПОВТОРИТЕ ПАРОЛЬ"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {!isFirstUser ? (
              <div>
                <label
                  htmlFor="role"
                  className="block text-sm font-mono font-bold text-slate-300 mb-1 uppercase"
                >
                  РОЛЬ В СИСТЕМЕ
                </label>
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full px-3 py-3 border-2 border-slate-600 bg-slate-700 text-white font-mono focus:outline-none focus:border-blue-500"
                >
                  <option value={UserRole.APPLICANT}>АБИТУРИЕНТ</option>
                  <option value={UserRole.CURATOR}>КУРАТОР</option>
                </select>
                <p className="mt-1 text-xs text-slate-400 font-mono">
                  {role === UserRole.APPLICANT
                    ? "ВЫ СМОЖЕТЕ ПРОХОДИТЬ ТЕСТЫ ПОСЛЕ АКТИВАЦИИ АККАУНТА"
                    : "ВЫ СМОЖЕТЕ СОЗДАВАТЬ ТЕСТЫ ПОСЛЕ АКТИВАЦИИ АДМИНИСТРАТОРОМ"}
                </p>
              </div>
            ) : (
              <div className="bg-blue-900 border-2 border-blue-600 p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-blue-400" />
                  <p className="text-sm text-blue-200 font-mono">
                    ВЫ БУДЕТЕ ЗАРЕГИСТРИРОВАНЫ КАК{" "}
                    <strong>АДМИНИСТРАТОР</strong> И АВТОМАТИЧЕСКИ АКТИВИРОВАНЫ
                    (ПЕРВЫЙ ПОЛЬЗОВАТЕЛЬ СИСТЕМЫ).
                  </p>
                </div>
              </div>
            )}

            {role === UserRole.APPLICANT && (
              <div>
                <label
                  htmlFor="direction"
                  className="block text-sm font-mono font-bold text-slate-300 mb-1 uppercase"
                >
                  НАПРАВЛЕНИЕ ПОДГОТОВКИ
                </label>
                {directionsLoading ? (
                  <div className="w-full px-3 py-3 border-2 border-slate-600 bg-slate-700 flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent"></div>
                    <span className="text-slate-400 font-mono">
                      ЗАГРУЗКА НАПРАВЛЕНИЙ...
                    </span>
                  </div>
                ) : directions.length > 0 ? (
                  <select
                    id="direction"
                    value={directionId}
                    onChange={(e) => setDirectionId(e.target.value)}
                    required
                    className="w-full px-3 py-3 border-2 border-slate-600 bg-slate-700 text-white font-mono focus:outline-none focus:border-blue-500"
                  >
                    <option value="">ВЫБЕРИТЕ НАПРАВЛЕНИЕ</option>
                    {directions.map((direction) => (
                      <option key={direction.$id} value={direction.$id}>
                        {direction.name} ({direction.institute?.name})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="w-full px-3 py-3 border-2 border-slate-600 bg-slate-700">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Building className="h-4 w-4" />
                      <span className="font-mono">НАПРАВЛЕНИЯ ПОКА НЕ СОЗДАНЫ</span>
                    </div>
                  </div>
                )}
                <p className="mt-1 text-xs text-slate-400 font-mono">
                  ВЫБЕРИТЕ НАПРАВЛЕНИЕ, ПО КОТОРОМУ ПЛАНИРУЕТЕ ПОСТУПАТЬ
                </p>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={
                  loading ||
                  (role === UserRole.APPLICANT && directions.length === 0)
                }
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border-2 border-blue-600 text-sm font-mono font-bold text-blue-200 bg-blue-800 disabled:bg-slate-700 disabled:border-slate-600 disabled:text-slate-500 disabled:cursor-not-allowed uppercase"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-blue-200 border-t-transparent"></div>
                    РЕГИСТРАЦИЯ...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    ЗАРЕГИСТРИРОВАТЬСЯ
                  </>
                )}
              </button>

              {role === UserRole.APPLICANT && directions.length === 0 && (
                <p className="mt-2 text-xs text-red-400 text-center font-mono">
                  РЕГИСТРАЦИЯ НЕДОСТУПНА: НЕ СОЗДАНЫ НАПРАВЛЕНИЯ ПОДГОТОВКИ
                </p>
              )}
            </div>

            <div className="text-center text-sm">
              <p className="text-slate-300 font-mono">
                УЖЕ ЕСТЬ АККАУНТ?{" "}
                <Link
                  href="/login"
                  className="font-mono font-bold text-blue-400 border-b border-blue-400"
                >
                  ВОЙТИ
                </Link>
              </p>
            </div>
          </form>

          {/* Информационные блоки для разных ролей */}
          <div className="mt-6 space-y-3">
            {role === UserRole.APPLICANT && (
              <div className="bg-green-900 border-2 border-green-600 p-3">
                <div className="flex items-start gap-2">
                  <GraduationCap className="h-4 w-4 text-green-400 mt-0.5" />
                  <div className="text-xs text-green-200 font-mono">
                    <strong>ДЛЯ АБИТУРИЕНТОВ:</strong> ПОСЛЕ АКТИВАЦИИ ЗАПОЛНИТЕ
                    АНКЕТУ С ПАСПОРТНЫМИ ДАННЫМИ ДЛЯ ПОЛУЧЕНИЯ ДОСТУПА К ТЕСТАМ.
                  </div>
                </div>
              </div>
            )}

            {role === UserRole.CURATOR && (
              <div className="bg-blue-900 border-2 border-blue-600 p-3">
                <div className="flex items-start gap-2">
                  <Users className="h-4 w-4 text-blue-400 mt-0.5" />
                  <div className="text-xs text-blue-200 font-mono">
                    <strong>ДЛЯ КУРАТОРОВ:</strong> ПОСЛЕ АКТИВАЦИИ ВЫ СМОЖЕТЕ
                    СОЗДАВАТЬ И РЕДАКТИРОВАТЬ ТЕСТЫ, УПРАВЛЯТЬ АБИТУРИЕНТАМИ.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}