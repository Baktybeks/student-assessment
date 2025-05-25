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
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
          <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl shadow-xl border border-gray-100 text-center">
            {isFirstUser || registeredRole === UserRole.ADMIN ? (
              // Сообщение для администратора (автоактивация)
              <>
                <div className="flex justify-center">
                  <div className="p-3 bg-green-500 rounded-full">
                    <CheckCircle className="h-8 w-8 text-white" />
                  </div>
                </div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Добро пожаловать!
                </h1>
                <div className="space-y-3">
                  <p className="text-gray-600">
                    Ваш аккаунт администратора успешно создан и автоматически
                    активирован.
                  </p>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm text-green-800">
                      <strong>Имя:</strong> {name}
                      <br />
                      <strong>Email:</strong> {email}
                      <br />
                      <strong>Роль:</strong> Администратор
                    </p>
                  </div>
                  <p className="text-sm text-gray-500">
                    Перенаправление на страницу входа...
                  </p>
                </div>
              </>
            ) : (
              // Сообщение для обычных пользователей (нужна активация)
              <>
                <div className="flex justify-center">
                  <div className="p-3 bg-amber-500 rounded-full">
                    <Clock className="h-8 w-8 text-white" />
                  </div>
                </div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Регистрация завершена!
                </h1>
                <div className="space-y-3">
                  <p className="text-gray-600">
                    Ваш аккаунт успешно создан, но требует активации
                    {role === UserRole.CURATOR
                      ? " администратором"
                      : " куратором или администратором"}
                    .
                  </p>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      <span className="text-sm font-medium text-amber-800">
                        Что дальше?
                      </span>
                    </div>
                    <ul className="text-sm text-amber-700 space-y-1 text-left">
                      <li>
                        • Администратор получит уведомление о вашей регистрации
                      </li>
                      <li>• После активации вы получите доступ к системе</li>
                      <li>• Попробуйте войти через несколько минут</li>
                      {role === UserRole.APPLICANT && (
                        <li>
                          • После активации заполните анкету для доступа к
                          тестам
                        </li>
                      )}
                    </ul>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-sm text-gray-600">
                      <strong>Имя:</strong> {name}
                      <br />
                      <strong>Email:</strong> {email}
                      <br />
                      <strong>Роль:</strong>{" "}
                      {registeredRole === UserRole.CURATOR
                        ? "Куратор"
                        : "Абитуриент"}
                      {registeredRole === UserRole.APPLICANT && directionId && (
                        <>
                          <br />
                          <strong>Направление:</strong>{" "}
                          {directions.find((d) => d.$id === directionId)
                            ?.name || "Выбранное направление"}
                        </>
                      )}
                    </p>
                  </div>
                  <p className="text-sm text-gray-500">
                    Перенаправление на страницу входа...
                  </p>
                </div>
              </>
            )}

            <div className="pt-4">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Перейти ко входу
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Регистрация в системе тестирования">
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-2xl shadow-xl border border-gray-100">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-indigo-600 rounded-full">
                <UserPlus className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900">
              Регистрация
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Создайте аккаунт для доступа к системе тестирования
            </p>
          </div>

          {!isFirstUser && role !== UserRole.ADMIN && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                <p className="text-sm text-amber-800">
                  <strong>Важно:</strong> После регистрации ваш аккаунт должен
                  быть активирован{" "}
                  {role === UserRole.CURATOR
                    ? "администратором"
                    : "куратором или администратором"}{" "}
                  перед первым входом в систему.
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
              <div className="p-4 text-red-700 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span className="text-sm">{errorMessage || error}</span>
                </div>
              </div>
            )}

            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Полное имя
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                placeholder="Введите ваше полное имя"
              />
            </div>

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
                autoComplete="off"
                className="w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                placeholder="Введите ваш email"
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
                  autoComplete="off"
                  className="w-full px-3 py-3 pr-10 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  placeholder="Минимум 8 символов"
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
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Подтверждение пароля
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-3 py-3 pr-10 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  placeholder="Повторите пароль"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
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
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Роль в системе
                </label>
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                >
                  <option value={UserRole.APPLICANT}>Абитуриент</option>
                  <option value={UserRole.CURATOR}>Куратор</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  {role === UserRole.APPLICANT
                    ? "Вы сможете проходить тесты после активации аккаунта"
                    : "Вы сможете создавать тесты после активации администратором"}
                </p>
              </div>
            ) : (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <p className="text-sm text-blue-800">
                    Вы будете зарегистрированы как{" "}
                    <strong>администратор</strong> и автоматически активированы
                    (первый пользователь системы).
                  </p>
                </div>
              </div>
            )}

            {role === UserRole.APPLICANT && (
              <div>
                <label
                  htmlFor="direction"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Направление подготовки
                </label>
                {directionsLoading ? (
                  <div className="w-full px-3 py-3 border border-gray-300 rounded-lg bg-gray-50 flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                    <span className="text-gray-500">
                      Загрузка направлений...
                    </span>
                  </div>
                ) : directions.length > 0 ? (
                  <select
                    id="direction"
                    value={directionId}
                    onChange={(e) => setDirectionId(e.target.value)}
                    required
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  >
                    <option value="">Выберите направление</option>
                    {directions.map((direction) => (
                      <option key={direction.$id} value={direction.$id}>
                        {direction.name} ({direction.institute?.name})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="w-full px-3 py-3 border border-gray-300 rounded-lg bg-gray-50">
                    <div className="flex items-center gap-2 text-gray-500">
                      <Building className="h-4 w-4" />
                      <span>Направления пока не созданы</span>
                    </div>
                  </div>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Выберите направление, по которому планируете поступать
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
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-all duration-200"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Регистрация...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    Зарегистрироваться
                  </>
                )}
              </button>

              {role === UserRole.APPLICANT && directions.length === 0 && (
                <p className="mt-2 text-xs text-red-600 text-center">
                  Регистрация недоступна: не созданы направления подготовки
                </p>
              )}
            </div>

            <div className="text-center text-sm">
              <p>
                Уже есть аккаунт?{" "}
                <Link
                  href="/login"
                  className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
                >
                  Войти
                </Link>
              </p>
            </div>
          </form>

          {/* Информационные блоки для разных ролей */}
          <div className="mt-6 space-y-3">
            {role === UserRole.APPLICANT && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <GraduationCap className="h-4 w-4 text-green-600 mt-0.5" />
                  <div className="text-xs text-green-800">
                    <strong>Для абитуриентов:</strong> После активации заполните
                    анкету с паспортными данными для получения доступа к тестам.
                  </div>
                </div>
              </div>
            )}

            {role === UserRole.CURATOR && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Users className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div className="text-xs text-blue-800">
                    <strong>Для кураторов:</strong> После активации вы сможете
                    создавать и редактировать тесты, управлять абитуриентами.
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
