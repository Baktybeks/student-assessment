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
        <span className="px-2 py-1 text-xs font-mono font-bold bg-red-800 text-red-200 border border-red-600 uppercase">
          ЗАБЛОКИРОВАН
        </span>
      );
    }
    if (curator.isActive) {
      return (
        <span className="px-2 py-1 text-xs font-mono font-bold bg-green-800 text-green-200 border border-green-600 uppercase">
          АКТИВЕН
        </span>
      );
    }
    return (
      <span className="px-2 py-1 text-xs font-mono font-bold bg-yellow-800 text-yellow-200 border border-yellow-600 uppercase">
        НЕАКТИВЕН
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
      <div className="min-h-screen bg-slate-900 text-white p-6 max-w-7xl mx-auto">
        <div className="flex justify-center items-center h-64">
          <div className="h-8 w-8 border-2 border-blue-400 border-t-transparent"></div>
          <span className="ml-3 text-slate-300 font-mono">ЗАГРУЗКА КУРАТОРОВ...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Заголовок */}
        <div className="mb-8 border-b border-slate-700 pb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Users className="h-8 w-8 text-blue-400" />
                <h1 className="text-3xl font-mono font-bold text-white uppercase tracking-wide">
                  УПРАВЛЕНИЕ КУРАТОРАМИ
                </h1>
              </div>
              <p className="text-slate-300 font-mono">
                СОЗДАНИЕ И УПРАВЛЕНИЕ КУРАТОРАМИ СИСТЕМЫ ТЕСТИРОВАНИЯ
              </p>
            </div>

            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-700 text-white border-2 border-blue-600 font-mono font-bold uppercase"
            >
              <Plus className="h-4 w-4" />
              СОЗДАТЬ КУРАТОРА
            </button>
          </div>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800 border-2 border-slate-600 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-mono font-bold text-slate-300 uppercase">
                  ВСЕГО КУРАТОРОВ
                </p>
                <p className="text-2xl font-mono font-bold text-white">
                  {curatorStats.total}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 border-2 border-slate-600 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-mono font-bold text-slate-300 uppercase">
                  АКТИВНЫЕ
                </p>
                <p className="text-2xl font-mono font-bold text-white">
                  {curatorStats.active}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 border-2 border-slate-600 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-8 w-8 text-yellow-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-mono font-bold text-slate-300 uppercase">
                  НЕАКТИВНЫЕ
                </p>
                <p className="text-2xl font-mono font-bold text-white">
                  {curatorStats.inactive}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 border-2 border-slate-600 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ShieldOff className="h-8 w-8 text-red-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-mono font-bold text-slate-300 uppercase">
                  ЗАБЛОКИРОВАННЫЕ
                </p>
                <p className="text-2xl font-mono font-bold text-white">
                  {curatorStats.blocked}
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
                <label className="block text-xs font-mono font-bold text-slate-300 uppercase mb-1">
                  ПОИСК:
                </label>
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="ПО ИМЕНИ ИЛИ EMAIL..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 w-80 border-2 border-slate-600 bg-slate-700 text-white font-mono placeholder-slate-400"
                  />
                </div>
              </div>

              {/* Фильтр по статусу */}
              <div>
                <label className="block text-xs font-mono font-bold text-slate-300 uppercase mb-1">
                  СТАТУС:
                </label>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-slate-400" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="px-3 py-2 border-2 border-slate-600 bg-slate-700 text-white font-mono"
                  >
                    <option value="ALL">ВСЕ СТАТУСЫ</option>
                    <option value="ACTIVE">АКТИВНЫЕ</option>
                    <option value="INACTIVE">НЕАКТИВНЫЕ</option>
                    <option value="BLOCKED">ЗАБЛОКИРОВАННЫЕ</option>
                  </select>
                </div>
              </div>
            </div>

            <button
              onClick={() => refetch()}
              className="flex items-center gap-2 px-3 py-2 text-slate-300 border border-slate-600 font-mono font-bold uppercase"
            >
              <RefreshCw className="h-4 w-4" />
              ОБНОВИТЬ
            </button>
          </div>
        </div>

        {/* Список кураторов */}
        <div className="bg-slate-800 border-2 border-slate-600">
          {filteredCurators.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-slate-500 mx-auto mb-4" />
              <h3 className="text-lg font-mono font-bold text-white mb-2 uppercase">
                {curators.length === 0 ? "НЕТ КУРАТОРОВ" : "КУРАТОРЫ НЕ НАЙДЕНЫ"}
              </h3>
              <p className="text-slate-400 mb-4 font-mono">
                {curators.length === 0
                  ? "СОЗДАЙТЕ ПЕРВОГО КУРАТОРА ДЛЯ УПРАВЛЕНИЯ ТЕСТАМИ"
                  : "ПОПРОБУЙТЕ ИЗМЕНИТЬ ПАРАМЕТРЫ ПОИСКА"}
              </p>
              {curators.length === 0 && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 text-white border-2 border-blue-600 font-mono font-bold uppercase"
                >
                  <UserPlus className="h-4 w-4" />
                  СОЗДАТЬ КУРАТОРА
                </button>
              )}
            </div>
          ) : (
            <div>
              {/* Заголовок таблицы */}
              <div className="bg-slate-700 px-6 py-3 border-b-2 border-slate-600">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-mono font-bold text-white uppercase">
                    КУРАТОРЫ ({filteredCurators.length})
                  </span>
                  <span className="text-sm text-slate-300 font-mono font-bold uppercase">
                    ДЕЙСТВИЯ
                  </span>
                </div>
              </div>

              {/* Список кураторов */}
              <div className="divide-y-2 divide-slate-700">
                {filteredCurators.map((curator) => (
                  <div
                    key={curator.$id}
                    className="px-6 py-4 bg-slate-800"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div>
                            <h3 className="text-sm font-mono font-bold text-white uppercase">
                              {curator.name}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Mail className="h-3 w-3 text-slate-400" />
                              <span className="text-sm text-slate-300 font-mono">
                                {curator.email}
                              </span>
                            </div>
                          </div>

                          {getStatusBadge(curator)}
                        </div>

                        <div className="flex items-center gap-4 text-xs text-slate-400 font-mono">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>СОЗДАН {formatDate(curator.$createdAt)}</span>
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
                            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-800 text-green-200 border border-green-600 disabled:opacity-50 font-mono font-bold uppercase"
                          >
                            <Shield className="h-3 w-3" />
                            РАЗБЛОКИРОВАТЬ
                          </button>
                        ) : curator.isActive ? (
                          <>
                            <button
                              onClick={() =>
                                handleDeactivate(curator.$id, curator.name)
                              }
                              disabled={deactivateUserMutation.isPending}
                              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-yellow-800 text-yellow-200 border border-yellow-600 disabled:opacity-50 font-mono font-bold uppercase"
                            >
                              <UserX className="h-3 w-3" />
                              ДЕАКТИВИРОВАТЬ
                            </button>
                            <button
                              onClick={() =>
                                handleBlock(curator.$id, curator.name)
                              }
                              disabled={blockUserMutation.isPending}
                              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-800 text-red-200 border border-red-600 disabled:opacity-50 font-mono font-bold uppercase"
                            >
                              <ShieldOff className="h-3 w-3" />
                              ЗАБЛОКИРОВАТЬ
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() =>
                                handleActivate(curator.$id, curator.name)
                              }
                              disabled={activateUserMutation.isPending}
                              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-800 text-green-200 border border-green-600 disabled:opacity-50 font-mono font-bold uppercase"
                            >
                              <UserCheck className="h-3 w-3" />
                              АКТИВИРОВАТЬ
                            </button>
                            <button
                              onClick={() =>
                                handleBlock(curator.$id, curator.name)
                              }
                              disabled={blockUserMutation.isPending}
                              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-800 text-red-200 border border-red-600 disabled:opacity-50 font-mono font-bold uppercase"
                            >
                              <ShieldOff className="h-3 w-3" />
                              ЗАБЛОКИРОВАТЬ
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
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-slate-800 border-2 border-slate-600 p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-mono font-bold text-white mb-4 uppercase border-b border-slate-600 pb-2">
                СОЗДАТЬ НОВОГО КУРАТОРА
              </h3>

              <form onSubmit={handleCreateCurator} className="space-y-4">
                <div>
                  <label
                    htmlFor="curatorName"
                    className="block text-sm font-mono font-bold text-slate-300 mb-1 uppercase"
                  >
                    ПОЛНОЕ ИМЯ:
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
                    className="w-full px-3 py-2 border-2 border-slate-600 bg-slate-700 text-white font-mono placeholder-slate-400"
                    placeholder="ВВЕДИТЕ ПОЛНОЕ ИМЯ КУРАТОРА"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="curatorEmail"
                    className="block text-sm font-mono font-bold text-slate-300 mb-1 uppercase"
                  >
                    EMAIL АДРЕС:
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
                    className="w-full px-3 py-2 border-2 border-slate-600 bg-slate-700 text-white font-mono placeholder-slate-400"
                    placeholder="CURATOR@EXAMPLE.COM"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="curatorPassword"
                    className="block text-sm font-mono font-bold text-slate-300 mb-1 uppercase"
                  >
                    ПАРОЛЬ:
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
                    className="w-full px-3 py-2 border-2 border-slate-600 bg-slate-700 text-white font-mono placeholder-slate-400"
                    placeholder="МИНИМУМ 8 СИМВОЛОВ"
                    minLength={8}
                    required
                  />
                </div>

                <div className="bg-blue-900 border-2 border-blue-600 p-3">
                  <p className="text-sm text-blue-200 font-mono">
                    <strong className="font-bold uppercase">ВАЖНО:</strong> КУРАТОР БУДЕТ СОЗДАН В НЕАКТИВНОМ
                    СОСТОЯНИИ И ПОТРЕБУЕТ АКТИВАЦИИ АДМИНИСТРАТОРОМ.
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      setNewCuratorData({ name: "", email: "", password: "" });
                    }}
                    className="flex-1 px-4 py-2 text-slate-300 bg-slate-700 border-2 border-slate-600 font-mono font-bold uppercase"
                  >
                    ОТМЕНА
                  </button>
                  <button
                    type="submit"
                    disabled={createUserMutation.isPending}
                    className="flex-1 px-4 py-2 text-white bg-blue-700 border-2 border-blue-600 disabled:opacity-50 font-mono font-bold uppercase"
                  >
                    {createUserMutation.isPending ? "СОЗДАНИЕ..." : "СОЗДАТЬ"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Информационная панель */}
        <div className="mt-6 bg-slate-800 border-2 border-slate-600 p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-400 mt-0.5" />
            <div>
              <h3 className="text-sm font-mono font-bold text-white mb-2 uppercase">
                ВОЗМОЖНОСТИ КУРАТОРОВ:
              </h3>
              <ul className="text-sm text-slate-300 font-mono space-y-1">
                <li>• СОЗДАНИЕ И РЕДАКТИРОВАНИЕ ТЕСТОВ ДЛЯ СВОИХ НАПРАВЛЕНИЙ</li>
                <li>• УПРАВЛЕНИЕ ВОПРОСАМИ И НАСТРОЙКАМИ ТЕСТИРОВАНИЯ</li>
                <li>• ПРОСМОТР РЕЗУЛЬТАТОВ И СТАТИСТИКИ АБИТУРИЕНТОВ</li>
                <li>• АКТИВАЦИЯ АБИТУРИЕНТОВ В СВОИХ ИНСТИТУТАХ</li>
                <li>• ЭКСПОРТ ОТЧЕТОВ И АНАЛИТИЧЕСКИХ ДАННЫХ</li>
                <li>• ИМПОРТ ТЕСТОВ ИЗ EXCEL ФАЙЛОВ</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}