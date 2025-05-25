// src/app/(dashboard)/admin/activation/page.tsx
"use client";

import React, { useState } from "react";
import {
  usePendingUsers,
  useActivateUser,
  useBlockUser,
} from "@/services/authService";
import { User, UserRole, getRoleLabel, getRoleColor } from "@/types";
import { toast } from "react-toastify";
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  AlertTriangle,
  CheckCircle,
  Mail,
  Calendar,
  Filter,
  Search,
  RefreshCw,
  Eye,
  Shield,
  GraduationCap,
} from "lucide-react";

export default function ActivationPage() {
  const { data: pendingUsers = [], isLoading, refetch } = usePendingUsers();
  const activateUserMutation = useActivateUser();
  const blockUserMutation = useBlockUser();

  const [filter, setFilter] = useState<UserRole | "ALL">("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());

  const filteredUsers = pendingUsers.filter((user) => {
    const matchesRole = filter === "ALL" || user.role === filter;
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesRole && matchesSearch;
  });

  const handleActivateUser = async (userId: string, userName: string) => {
    try {
      await activateUserMutation.mutateAsync(userId);
      toast.success(`✅ Пользователь ${userName} успешно активирован`, {
        position: "top-right",
        autoClose: 4000,
      });
      setSelectedUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    } catch (error) {
      toast.error(
        `❌ Ошибка при активации пользователя: ${(error as Error).message}`,
        {
          position: "top-right",
          autoClose: 5000,
        }
      );
    }
  };

  const handleBlockUser = async (userId: string, userName: string) => {
    if (
      window.confirm(
        `Вы уверены, что хотите заблокировать пользователя ${userName}?`
      )
    ) {
      try {
        await blockUserMutation.mutateAsync(userId);
        toast.warning(`🚫 Пользователь ${userName} заблокирован`, {
          position: "top-right",
          autoClose: 4000,
        });
        setSelectedUsers((prev) => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
      } catch (error) {
        toast.error(
          `❌ Ошибка при блокировке пользователя: ${(error as Error).message}`,
          {
            position: "top-right",
            autoClose: 5000,
          }
        );
      }
    }
  };

  const handleBulkActivate = async () => {
    if (selectedUsers.size === 0) return;

    if (
      window.confirm(
        `Активировать ${selectedUsers.size} выбранных пользователей?`
      )
    ) {
      const results = await Promise.allSettled(
        Array.from(selectedUsers).map((userId) =>
          activateUserMutation.mutateAsync(userId)
        )
      );

      const successful = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.filter((r) => r.status === "rejected").length;

      if (successful > 0) {
        toast.success(`✅ Активировано пользователей: ${successful}`, {
          position: "top-right",
          autoClose: 4000,
        });
      }

      if (failed > 0) {
        toast.error(`❌ Не удалось активировать: ${failed}`, {
          position: "top-right",
          autoClose: 5000,
        });
      }

      setSelectedUsers(new Set());
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map((u) => u.$id)));
    }
  };

  const formatCreatedDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Сегодня";
    if (diffDays === 1) return "Вчера";
    if (diffDays < 7) return `${diffDays} дней назад`;
    return date.toLocaleDateString("ru-RU");
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="ml-3 text-gray-600">Загрузка пользователей...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Заголовок */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <UserCheck className="h-8 w-8 text-orange-500" />
          <h1 className="text-3xl font-bold text-gray-900">
            Активация пользователей
          </h1>
        </div>
        <p className="text-gray-600">
          Управление активацией новых пользователей в системе
        </p>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Ожидают активации
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {pendingUsers.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-purple-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Кураторы</p>
              <p className="text-2xl font-bold text-gray-900">
                {pendingUsers.filter((u) => u.role === UserRole.CURATOR).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <GraduationCap className="h-8 w-8 text-green-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Абитуриенты</p>
              <p className="text-2xl font-bold text-gray-900">
                {
                  pendingUsers.filter((u) => u.role === UserRole.APPLICANT)
                    .length
                }
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircle className="h-8 w-8 text-blue-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Выбрано</p>
              <p className="text-2xl font-bold text-gray-900">
                {selectedUsers.size}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Фильтры и поиск */}
      <div className="bg-white rounded-lg shadow border p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            {/* Поиск */}
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Поиск по имени или email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-80 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Фильтр по роли */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as UserRole | "ALL")}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="ALL">Все роли</option>
                <option value={UserRole.CURATOR}>Кураторы</option>
                <option value={UserRole.APPLICANT}>Абитуриенты</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => refetch()}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Обновить
            </button>

            {selectedUsers.size > 0 && (
              <button
                onClick={handleBulkActivate}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <UserCheck className="h-4 w-4" />
                Активировать выбранных ({selectedUsers.size})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Список пользователей */}
      <div className="bg-white rounded-lg shadow border">
        {filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <UserCheck className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {pendingUsers.length === 0
                ? "Нет пользователей, ожидающих активации"
                : "Пользователи не найдены"}
            </h3>
            <p className="text-gray-500">
              {pendingUsers.length === 0
                ? "Все пользователи уже активированы"
                : "Попробуйте изменить параметры поиска"}
            </p>
          </div>
        ) : (
          <div className="overflow-hidden">
            {/* Заголовок таблицы */}
            <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={
                      selectedUsers.size === filteredUsers.length &&
                      filteredUsers.length > 0
                    }
                    onChange={toggleSelectAll}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="ml-3 text-sm font-medium text-gray-900">
                    Пользователи ({filteredUsers.length})
                  </span>
                </div>
                <span className="text-sm text-gray-500">Дата регистрации</span>
              </div>
            </div>

            {/* Список пользователей */}
            <div className="divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <div
                  key={user.$id}
                  className="px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedUsers.has(user.$id)}
                        onChange={() => toggleUserSelection(user.$id)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />

                      <div className="ml-4 flex-1">
                        <div className="flex items-center gap-3">
                          <div>
                            <h3 className="text-sm font-medium text-gray-900">
                              {user.name}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Mail className="h-3 w-3 text-gray-400" />
                              <span className="text-sm text-gray-500">
                                {user.email}
                              </span>
                            </div>
                          </div>

                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(
                              user.role
                            )}`}
                          >
                            {getRoleLabel(user.role)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                          <Calendar className="h-3 w-3" />
                          <span>
                            Зарегистрирован {formatCreatedDate(user.$createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleActivateUser(user.$id, user.name)}
                        disabled={activateUserMutation.isPending}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 disabled:opacity-50 transition-colors"
                      >
                        <UserCheck className="h-3 w-3" />
                        Активировать
                      </button>

                      <button
                        onClick={() => handleBlockUser(user.$id, user.name)}
                        disabled={blockUserMutation.isPending}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 disabled:opacity-50 transition-colors"
                      >
                        <UserX className="h-3 w-3" />
                        Заблокировать
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Информационная панель */}
      {pendingUsers.length > 0 && (
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-blue-900 mb-2">
                Рекомендации по активации
              </h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>
                  • Проверьте корректность данных пользователя перед активацией
                </li>
                <li>
                  • Кураторы получат доступ к созданию тестов и управлению
                  абитуриентами
                </li>
                <li>• Абитуриенты смогут заполнить анкету и проходить тесты</li>
                <li>• При блокировке пользователь теряет доступ к системе</li>
                <li>• Массовая активация доступна через чекбоксы</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
