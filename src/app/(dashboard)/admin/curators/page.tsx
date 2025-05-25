// src/app/(dashboard)/admin/curators/page.tsx
"use client";

import React, { useState } from "react";
import {
  useCurators,
  useCreateUser,
  useActivateUser,
  useDeactivateUser,
  useBlockUser,
  useUnblockUser,
} from "@/services/authService";
import { useAuth } from "@/hooks/useAuth";
import { User, UserRole } from "@/types";
import { toast } from "react-toastify";
import {
  Users,
  UserPlus,
  UserCheck,
  UserX,
  Mail,
  Calendar,
  Search,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  Shield,
  ShieldOff,
  AlertTriangle,
  CheckCircle,
  Clock,
  Filter,
  Plus,
} from "lucide-react";

export default function CuratorsPage() {
  const { user: currentUser } = useAuth();
  const { data: curators = [], isLoading, refetch } = useCurators();
  const createUserMutation = useCreateUser();
  const activateUserMutation = useActivateUser();
  const deactivateUserMutation = useDeactivateUser();
  const blockUserMutation = useBlockUser();
  const unblockUserMutation = useUnblockUser();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "ACTIVE" | "INACTIVE" | "BLOCKED"
  >("ALL");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCuratorData, setNewCuratorData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const filteredCurators = curators.filter((curator) => {
    const matchesSearch =
      curator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      curator.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" && curator.isActive && !curator.isBlocked) ||
      (statusFilter === "INACTIVE" &&
        !curator.isActive &&
        !curator.isBlocked) ||
      (statusFilter === "BLOCKED" && curator.isBlocked);

    return matchesSearch && matchesStatus;
  });

  const curatorStats = {
    total: curators.length,
    active: curators.filter((c) => c.isActive && !c.isBlocked).length,
    inactive: curators.filter((c) => !c.isActive && !c.isBlocked).length,
    blocked: curators.filter((c) => c.isBlocked).length,
  };

  const handleCreateCurator = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !newCuratorData.name ||
      !newCuratorData.email ||
      !newCuratorData.password
    ) {
      toast.error("Заполните все поля");
      return;
    }

    if (!currentUser) {
      toast.error("Ошибка аутентификации");
      return;
    }

    try {
      await createUserMutation.mutateAsync({
        name: newCuratorData.name,
        email: newCuratorData.email,
        password: newCuratorData.password,
        role: UserRole.CURATOR,
        createdBy: currentUser.$id,
      });

      toast.success(`✅ Куратор ${newCuratorData.name} успешно создан`);
      setShowCreateForm(false);
      setNewCuratorData({ name: "", email: "", password: "" });
    } catch (error) {
      toast.error(
        `❌ Ошибка при создании куратора: ${(error as Error).message}`
      );
    }
  };

  const handleActivate = async (curatorId: string, curatorName: string) => {
    try {
      await activateUserMutation.mutateAsync(curatorId);
      toast.success(`✅ Куратор ${curatorName} активирован`);
    } catch (error) {
      toast.error(`❌ Ошибка при активации: ${(error as Error).message}`);
    }
  };

  const handleDeactivate = async (curatorId: string, curatorName: string) => {
    if (window.confirm(`Деактивировать куратора ${curatorName}?`)) {
      try {
        await deactivateUserMutation.mutateAsync(curatorId);
        toast.warning(`⚠️ Куратор ${curatorName} деактивирован`);
      } catch (error) {
        toast.error(`❌ Ошибка при деактивации: ${(error as Error).message}`);
      }
    }
  };

  const handleBlock = async (curatorId: string, curatorName: string) => {
    if (
      window.confirm(
        `Заблокировать куратора ${curatorName}? Он потеряет доступ к системе.`
      )
    ) {
      try {
        await blockUserMutation.mutateAsync(curatorId);
        toast.warning(`🚫 Куратор ${curatorName} заблокирован`);
      } catch (error) {
        toast.error(`❌ Ошибка при блокировке: ${(error as Error).message}`);
      }
    }
  };

  const handleUnblock = async (curatorId: string, curatorName: string) => {
    try {
      await unblockUserMutation.mutateAsync(curatorId);
      toast.success(`✅ Куратор ${curatorName} разблокирован`);
    } catch (error) {
      toast.error(`❌ Ошибка при разблокировке: ${(error as Error).message}`);
    }
  };

  const getStatusBadge = (curator: User) => {
    if (curator.isBlocked) {
      return (
        <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
          Заблокирован
        </span>
      );
    }
    if (curator.isActive) {
      return (
        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
          Активен
        </span>
      );
    }
    return (
      <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
        Неактивен
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ru-RU", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="ml-3 text-gray-600">Загрузка кураторов...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Заголовок */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Users className="h-8 w-8 text-purple-500" />
              <h1 className="text-3xl font-bold text-gray-900">
                Управление кураторами
              </h1>
            </div>
            <p className="text-gray-600">
              Создание и управление кураторами системы тестирования
            </p>
          </div>

          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Создать куратора
          </button>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-purple-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Всего кураторов
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {curatorStats.total}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Активные</p>
              <p className="text-2xl font-bold text-gray-900">
                {curatorStats.active}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Неактивные</p>
              <p className="text-2xl font-bold text-gray-900">
                {curatorStats.inactive}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ShieldOff className="h-8 w-8 text-red-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Заблокированные
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {curatorStats.blocked}
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
                className="pl-10 pr-4 py-2 w-80 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            {/* Фильтр по статусу */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="ALL">Все статусы</option>
                <option value="ACTIVE">Активные</option>
                <option value="INACTIVE">Неактивные</option>
                <option value="BLOCKED">Заблокированные</option>
              </select>
            </div>
          </div>

          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Обновить
          </button>
        </div>
      </div>

      {/* Список кураторов */}
      <div className="bg-white rounded-lg shadow border">
        {filteredCurators.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {curators.length === 0 ? "Нет кураторов" : "Кураторы не найдены"}
            </h3>
            <p className="text-gray-500 mb-4">
              {curators.length === 0
                ? "Создайте первого куратора для управления тестами"
                : "Попробуйте изменить параметры поиска"}
            </p>
            {curators.length === 0 && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <UserPlus className="h-4 w-4" />
                Создать куратора
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-hidden">
            {/* Заголовок таблицы */}
            <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">
                  Кураторы ({filteredCurators.length})
                </span>
                <span className="text-sm text-gray-500">Действия</span>
              </div>
            </div>

            {/* Список кураторов */}
            <div className="divide-y divide-gray-200">
              {filteredCurators.map((curator) => (
                <div
                  key={curator.$id}
                  className="px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">
                            {curator.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Mail className="h-3 w-3 text-gray-400" />
                            <span className="text-sm text-gray-500">
                              {curator.email}
                            </span>
                          </div>
                        </div>

                        {getStatusBadge(curator)}
                      </div>

                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>Создан {formatDate(curator.$createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {curator.isBlocked ? (
                        <button
                          onClick={() =>
                            handleUnblock(curator.$id, curator.name)
                          }
                          disabled={unblockUserMutation.isPending}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 disabled:opacity-50 transition-colors"
                        >
                          <Shield className="h-3 w-3" />
                          Разблокировать
                        </button>
                      ) : curator.isActive ? (
                        <>
                          <button
                            onClick={() =>
                              handleDeactivate(curator.$id, curator.name)
                            }
                            disabled={deactivateUserMutation.isPending}
                            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200 disabled:opacity-50 transition-colors"
                          >
                            <UserX className="h-3 w-3" />
                            Деактивировать
                          </button>
                          <button
                            onClick={() =>
                              handleBlock(curator.$id, curator.name)
                            }
                            disabled={blockUserMutation.isPending}
                            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 disabled:opacity-50 transition-colors"
                          >
                            <ShieldOff className="h-3 w-3" />
                            Заблокировать
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() =>
                              handleActivate(curator.$id, curator.name)
                            }
                            disabled={activateUserMutation.isPending}
                            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 disabled:opacity-50 transition-colors"
                          >
                            <UserCheck className="h-3 w-3" />
                            Активировать
                          </button>
                          <button
                            onClick={() =>
                              handleBlock(curator.$id, curator.name)
                            }
                            disabled={blockUserMutation.isPending}
                            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 disabled:opacity-50 transition-colors"
                          >
                            <ShieldOff className="h-3 w-3" />
                            Заблокировать
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Модальное окно создания куратора */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Создать нового куратора
            </h3>

            <form onSubmit={handleCreateCurator} className="space-y-4">
              <div>
                <label
                  htmlFor="curatorName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Полное имя
                </label>
                <input
                  id="curatorName"
                  type="text"
                  value={newCuratorData.name}
                  onChange={(e) =>
                    setNewCuratorData((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Введите полное имя куратора"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="curatorEmail"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email адрес
                </label>
                <input
                  id="curatorEmail"
                  type="email"
                  value={newCuratorData.email}
                  onChange={(e) =>
                    setNewCuratorData((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="curator@example.com"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="curatorPassword"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Пароль
                </label>
                <input
                  id="curatorPassword"
                  type="password"
                  value={newCuratorData.password}
                  onChange={(e) =>
                    setNewCuratorData((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Минимум 8 символов"
                  minLength={8}
                  required
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>Важно:</strong> Куратор будет создан в неактивном
                  состоянии и потребует активации администратором.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewCuratorData({ name: "", email: "", password: "" });
                  }}
                  className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={createUserMutation.isPending}
                  className="flex-1 px-4 py-2 text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
                >
                  {createUserMutation.isPending ? "Создание..." : "Создать"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Информационная панель */}
      <div className="mt-6 bg-purple-50 border border-purple-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-purple-600 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-purple-900 mb-2">
              Возможности кураторов
            </h3>
            <ul className="text-sm text-purple-800 space-y-1">
              <li>• Создание и редактирование тестов для своих направлений</li>
              <li>• Управление вопросами и настройками тестирования</li>
              <li>• Просмотр результатов и статистики абитуриентов</li>
              <li>• Активация абитуриентов в своих институтах</li>
              <li>• Экспорт отчетов и аналитических данных</li>
              <li>• Импорт тестов из Excel файлов</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
