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

    if (diffDays === 0) return "СЕГОДНЯ";
    if (diffDays === 1) return "ВЧЕРА";
    if (diffDays < 7) return `${diffDays} ДНЕЙ НАЗАД`;
    return date.toLocaleDateString("ru-RU");
  };

  const getGovRoleBadge = (role: UserRole) => {
    if (role === UserRole.CURATOR) {
      return (
        <span className="px-2 py-1 text-xs font-mono font-bold bg-purple-800 text-purple-200 border border-purple-600 uppercase">
          КУРАТОР
        </span>
      );
    }
    if (role === UserRole.APPLICANT) {
      return (
        <span className="px-2 py-1 text-xs font-mono font-bold bg-green-800 text-green-200 border border-green-600 uppercase">
          АБИТУРИЕНТ
        </span>
      );
    }
    return (
      <span className="px-2 py-1 text-xs font-mono font-bold bg-gray-800 text-gray-200 border border-gray-600 uppercase">
        НЕИЗВЕСТНО
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white">
        <div className="p-6 max-w-7xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="w-8 h-8 border-2 border-orange-400 border-t-transparent"></div>
            <span className="ml-3 text-slate-300 font-mono">ЗАГРУЗКА ПОЛЬЗОВАТЕЛЕЙ...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Заголовок */}
        <div className="mb-8 border-b border-slate-700 pb-6">
          <div className="flex items-center gap-3 mb-2">
            <UserCheck className="h-8 w-8 text-orange-400" />
            <h1 className="text-3xl font-mono font-bold text-white uppercase tracking-wide">
              АКТИВАЦИЯ ПОЛЬЗОВАТЕЛЕЙ
            </h1>
          </div>
          <p className="text-slate-300 font-mono">
            УПРАВЛЕНИЕ АКТИВАЦИЕЙ НОВЫХ ПОЛЬЗОВАТЕЛЕЙ В СИСТЕМЕ
          </p>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800 border-2 border-slate-600 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-8 w-8 text-orange-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-mono font-bold text-slate-300 uppercase">
                  ОЖИДАЮТ АКТИВАЦИИ
                </p>
                <p className="text-2xl font-mono font-bold text-white">
                  {pendingUsers.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 border-2 border-slate-600 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-mono font-bold text-slate-300 uppercase">
                  КУРАТОРЫ
                </p>
                <p className="text-2xl font-mono font-bold text-white">
                  {pendingUsers.filter((u) => u.role === UserRole.CURATOR).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 border-2 border-slate-600 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <GraduationCap className="h-8 w-8 text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-mono font-bold text-slate-300 uppercase">
                  АБИТУРИЕНТЫ
                </p>
                <p className="text-2xl font-mono font-bold text-white">
                  {
                    pendingUsers.filter((u) => u.role === UserRole.APPLICANT)
                      .length
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 border-2 border-slate-600 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-8 w-8 text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-mono font-bold text-slate-300 uppercase">
                  ВЫБРАНО
                </p>
                <p className="text-2xl font-mono font-bold text-white">
                  {selectedUsers.size}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Фильтры и поиск */}
        <div className="bg-slate-800 border-2 border-slate-600 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              {/* Поиск */}
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="ПОИСК ПО ИМЕНИ ИЛИ EMAIL..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-80 border-2 border-slate-600 bg-slate-700 text-white font-mono placeholder-slate-400 uppercase"
                />
              </div>

              {/* Фильтр по роли */}
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-slate-400" />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as UserRole | "ALL")}
                  className="px-3 py-2 border-2 border-slate-600 bg-slate-700 text-white font-mono"
                >
                  <option value="ALL">ВСЕ РОЛИ</option>
                  <option value={UserRole.CURATOR}>КУРАТОРЫ</option>
                  <option value={UserRole.APPLICANT}>АБИТУРИЕНТЫ</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => refetch()}
                className="flex items-center gap-2 px-3 py-2 text-slate-300 font-mono font-bold border border-slate-600 uppercase"
              >
                <RefreshCw className="h-4 w-4" />
                ОБНОВИТЬ
              </button>

              {selectedUsers.size > 0 && (
                <button
                  onClick={handleBulkActivate}
                  className="flex items-center gap-2 px-4 py-2 bg-green-800 text-green-200 border-2 border-green-600 font-mono font-bold uppercase"
                >
                  <UserCheck className="h-4 w-4" />
                  АКТИВИРОВАТЬ ВЫБРАННЫХ ({selectedUsers.size})
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Список пользователей */}
        <div className="bg-slate-800 border-2 border-slate-600">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <UserCheck className="h-16 w-16 text-slate-500 mx-auto mb-4" />
              <h3 className="text-lg font-mono font-bold text-white mb-2 uppercase">
                {pendingUsers.length === 0
                  ? "НЕТ ПОЛЬЗОВАТЕЛЕЙ, ОЖИДАЮЩИХ АКТИВАЦИИ"
                  : "ПОЛЬЗОВАТЕЛИ НЕ НАЙДЕНЫ"}
              </h3>
              <p className="text-slate-400 font-mono">
                {pendingUsers.length === 0
                  ? "ВСЕ ПОЛЬЗОВАТЕЛИ УЖЕ АКТИВИРОВАНЫ"
                  : "ПОПРОБУЙТЕ ИЗМЕНИТЬ ПАРАМЕТРЫ ПОИСКА"}
              </p>
            </div>
          ) : (
            <div className="overflow-hidden">
              {/* Заголовок таблицы */}
              <div className="bg-slate-700 px-6 py-3 border-b-2 border-slate-600">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={
                        selectedUsers.size === filteredUsers.length &&
                        filteredUsers.length > 0
                      }
                      onChange={toggleSelectAll}
                      className="h-4 w-4 text-orange-600 bg-slate-700 border-2 border-slate-500"
                    />
                    <span className="ml-3 text-sm font-mono font-bold text-white uppercase">
                      ПОЛЬЗОВАТЕЛИ ({filteredUsers.length})
                    </span>
                  </div>
                  <span className="text-sm text-slate-300 font-mono font-bold uppercase">
                    ДАТА РЕГИСТРАЦИИ
                  </span>
                </div>
              </div>

              {/* Список пользователей */}
              <div className="divide-y-2 divide-slate-700">
                {filteredUsers.map((user) => (
                  <div
                    key={user.$id}
                    className="px-6 py-4 bg-slate-800"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedUsers.has(user.$id)}
                          onChange={() => toggleUserSelection(user.$id)}
                          className="h-4 w-4 text-orange-600 bg-slate-700 border-2 border-slate-500"
                        />

                        <div className="ml-4 flex-1">
                          <div className="flex items-center gap-3">
                            <div>
                              <h3 className="text-sm font-mono font-bold text-white">
                                {user.name}
                              </h3>
                              <div className="flex items-center gap-2 mt-1">
                                <Mail className="h-3 w-3 text-slate-400" />
                                <span className="text-sm text-slate-300 font-mono">
                                  {user.email}
                                </span>
                              </div>
                            </div>

                            {getGovRoleBadge(user.role)}
                          </div>

                          <div className="flex items-center gap-2 mt-2 text-xs text-slate-400 font-mono">
                            <Calendar className="h-3 w-3" />
                            <span>
                              ЗАРЕГИСТРИРОВАН {formatCreatedDate(user.$createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleActivateUser(user.$id, user.name)}
                          disabled={activateUserMutation.isPending}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-800 text-green-200 border border-green-600 disabled:opacity-50 font-mono font-bold uppercase"
                        >
                          <UserCheck className="h-3 w-3" />
                          АКТИВИРОВАТЬ
                        </button>

                        <button
                          onClick={() => handleBlockUser(user.$id, user.name)}
                          disabled={blockUserMutation.isPending}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-800 text-red-200 border border-red-600 disabled:opacity-50 font-mono font-bold uppercase"
                        >
                          <UserX className="h-3 w-3" />
                          ЗАБЛОКИРОВАТЬ
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
          <div className="mt-6 bg-blue-900 border-2 border-blue-600 p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-blue-400 mt-0.5" />
              <div>
                <h3 className="text-sm font-mono font-bold text-blue-200 mb-2 uppercase">
                  РЕКОМЕНДАЦИИ ПО АКТИВАЦИИ
                </h3>
                <ul className="text-sm text-blue-300 font-mono space-y-1">
                  <li>
                    • ПРОВЕРЬТЕ КОРРЕКТНОСТЬ ДАННЫХ ПОЛЬЗОВАТЕЛЯ ПЕРЕД АКТИВАЦИЕЙ
                  </li>
                  <li>
                    • КУРАТОРЫ ПОЛУЧАТ ДОСТУП К СОЗДАНИЮ ТЕСТОВ И УПРАВЛЕНИЮ АБИТУРИЕНТАМИ
                  </li>
                  <li>• АБИТУРИЕНТЫ СМОГУТ ЗАПОЛНИТЬ АНКЕТУ И ПРОХОДИТЬ ТЕСТЫ</li>
                  <li>• ПРИ БЛОКИРОВКЕ ПОЛЬЗОВАТЕЛЬ ТЕРЯЕТ ДОСТУП К СИСТЕМЕ</li>
                  <li>• МАССОВАЯ АКТИВАЦИЯ ДОСТУПНА ЧЕРЕЗ ЧЕКБОКСЫ</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Статистика активации */}
        <div className="mt-6 bg-slate-800 border-2 border-slate-600 p-6">
          <h3 className="text-lg font-mono font-bold text-white mb-4 uppercase tracking-wide border-b border-slate-600 pb-2">
            СТАТИСТИКА АКТИВАЦИИ
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <h4 className="font-mono font-bold text-white uppercase border-b border-slate-600 pb-2">
                ПО РОЛЯМ:
              </h4>
              <div className="space-y-2 text-sm text-slate-300 font-mono">
                <div className="flex justify-between border-b border-slate-700 pb-1">
                  <span>КУРАТОРЫ:</span>
                  <span className="font-bold text-purple-400">
                    {pendingUsers.filter((u) => u.role === UserRole.CURATOR).length}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-700 pb-1">
                  <span>АБИТУРИЕНТЫ:</span>
                  <span className="font-bold text-green-400">
                    {pendingUsers.filter((u) => u.role === UserRole.APPLICANT).length}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-700 pb-1">
                  <span>ВСЕГО:</span>
                  <span className="font-bold text-white">
                    {pendingUsers.length}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-mono font-bold text-white uppercase border-b border-slate-600 pb-2">
                ПО ВРЕМЕНИ:
              </h4>
              <div className="space-y-2 text-sm text-slate-300 font-mono">
                <div className="flex justify-between border-b border-slate-700 pb-1">
                  <span>СЕГОДНЯ:</span>
                  <span className="font-bold text-blue-400">
                    {pendingUsers.filter(u => {
                      const today = new Date();
                      const userDate = new Date(u.$createdAt);
                      return userDate.toDateString() === today.toDateString();
                    }).length}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-700 pb-1">
                  <span>НА ЭТОЙ НЕДЕЛЕ:</span>
                  <span className="font-bold text-yellow-400">
                    {pendingUsers.filter(u => {
                      const weekAgo = new Date();
                      weekAgo.setDate(weekAgo.getDate() - 7);
                      return new Date(u.$createdAt) > weekAgo;
                    }).length}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-700 pb-1">
                  <span>БОЛЕЕ НЕДЕЛИ:</span>
                  <span className="font-bold text-red-400">
                    {pendingUsers.filter(u => {
                      const weekAgo = new Date();
                      weekAgo.setDate(weekAgo.getDate() - 7);
                      return new Date(u.$createdAt) <= weekAgo;
                    }).length}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-mono font-bold text-white uppercase border-b border-slate-600 pb-2">
                ДЕЙСТВИЯ:
              </h4>
              <div className="space-y-2 text-sm text-slate-300 font-mono">
                <div className="flex justify-between border-b border-slate-700 pb-1">
                  <span>ВЫБРАНО:</span>
                  <span className="font-bold text-white">
                    {selectedUsers.size}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-700 pb-1">
                  <span>ПРОЦЕНТ ВЫБОРА:</span>
                  <span className="font-bold text-orange-400">
                    {filteredUsers.length > 0 
                      ? ((selectedUsers.size / filteredUsers.length) * 100).toFixed(1)
                      : 0}%
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-700 pb-1">
                  <span>ОСТАЛОСЬ:</span>
                  <span className="font-bold text-slate-400">
                    {filteredUsers.length - selectedUsers.size}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}