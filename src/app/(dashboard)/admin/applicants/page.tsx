// src/app/(dashboard)/admin/applicants/page.tsx
"use client";

import React, { useState } from "react";
import {
  useApplicants,
  useActivateUser,
  useDeactivateUser,
  useBlockUser,
  useUnblockUser,
} from "@/services/authService";
import { useActiveDirections } from "@/services/instituteService";
import { User } from "@/types";
import { toast } from "react-toastify";
import {
  GraduationCap,
  UserCheck,
  UserX,
  Mail,
  Calendar,
  Search,
  RefreshCw,
  Eye,
  Shield,
  ShieldOff,
  AlertTriangle,
  CheckCircle,
  Clock,
  Filter,
  Building,
  FileText,
  Download,
  Users,
} from "lucide-react";

export default function ApplicantsPage() {
  const { data: applicants = [], isLoading, refetch } = useApplicants();
  const { data: directions = [] } = useActiveDirections();
  const activateUserMutation = useActivateUser();
  const deactivateUserMutation = useDeactivateUser();
  const blockUserMutation = useBlockUser();
  const unblockUserMutation = useUnblockUser();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "ACTIVE" | "INACTIVE" | "BLOCKED"
  >("ALL");
  const [directionFilter, setDirectionFilter] = useState<string>("ALL");
  const [selectedApplicants, setSelectedApplicants] = useState<Set<string>>(
    new Set()
  );

  const filteredApplicants = applicants.filter((applicant) => {
    const matchesSearch =
      applicant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      applicant.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" &&
        applicant.isActive &&
        !applicant.isBlocked) ||
      (statusFilter === "INACTIVE" &&
        !applicant.isActive &&
        !applicant.isBlocked) ||
      (statusFilter === "BLOCKED" && applicant.isBlocked);

    const matchesDirection = directionFilter === "ALL"; // TODO: добавить фильтр по направлению когда будет профиль

    return matchesSearch && matchesStatus && matchesDirection;
  });

  const applicantStats = {
    total: applicants.length,
    active: applicants.filter((a) => a.isActive && !a.isBlocked).length,
    inactive: applicants.filter((a) => !a.isActive && !a.isBlocked).length,
    blocked: applicants.filter((a) => a.isBlocked).length,
  };

  const handleActivate = async (applicantId: string, applicantName: string) => {
    try {
      await activateUserMutation.mutateAsync(applicantId);
      toast.success(`✅ Абитуриент ${applicantName} активирован`);
    } catch (error) {
      toast.error(`❌ Ошибка при активации: ${(error as Error).message}`);
    }
  };

  const handleDeactivate = async (
    applicantId: string,
    applicantName: string
  ) => {
    if (window.confirm(`Деактивировать абитуриента ${applicantName}?`)) {
      try {
        await deactivateUserMutation.mutateAsync(applicantId);
        toast.warning(`⚠️ Абитуриент ${applicantName} деактивирован`);
      } catch (error) {
        toast.error(`❌ Ошибка при деактивации: ${(error as Error).message}`);
      }
    }
  };

  const handleBlock = async (applicantId: string, applicantName: string) => {
    if (
      window.confirm(
        `Заблокировать абитуриента ${applicantName}? Он потеряет доступ к системе.`
      )
    ) {
      try {
        await blockUserMutation.mutateAsync(applicantId);
        toast.warning(`🚫 Абитуриент ${applicantName} заблокирован`);
      } catch (error) {
        toast.error(`❌ Ошибка при блокировке: ${(error as Error).message}`);
      }
    }
  };

  const handleUnblock = async (applicantId: string, applicantName: string) => {
    try {
      await unblockUserMutation.mutateAsync(applicantId);
      toast.success(`✅ Абитуриент ${applicantName} разблокирован`);
    } catch (error) {
      toast.error(`❌ Ошибка при разблокировке: ${(error as Error).message}`);
    }
  };

  const handleBulkActivate = async () => {
    if (selectedApplicants.size === 0) return;

    if (
      window.confirm(
        `Активировать ${selectedApplicants.size} выбранных абитуриентов?`
      )
    ) {
      const results = await Promise.allSettled(
        Array.from(selectedApplicants).map((applicantId) =>
          activateUserMutation.mutateAsync(applicantId)
        )
      );

      const successful = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.filter((r) => r.status === "rejected").length;

      if (successful > 0) {
        toast.success(`✅ Активировано абитуриентов: ${successful}`);
      }

      if (failed > 0) {
        toast.error(`❌ Не удалось активировать: ${failed}`);
      }

      setSelectedApplicants(new Set());
    }
  };

  const toggleApplicantSelection = (applicantId: string) => {
    setSelectedApplicants((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(applicantId)) {
        newSet.delete(applicantId);
      } else {
        newSet.add(applicantId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedApplicants.size === filteredApplicants.length) {
      setSelectedApplicants(new Set());
    } else {
      setSelectedApplicants(new Set(filteredApplicants.map((a) => a.$id)));
    }
  };

  const getStatusBadge = (applicant: User) => {
    if (applicant.isBlocked) {
      return (
        <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
          Заблокирован
        </span>
      );
    }
    if (applicant.isActive) {
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
          <span className="ml-3 text-gray-600">Загрузка абитуриентов...</span>
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
              <GraduationCap className="h-8 w-8 text-green-500" />
              <h1 className="text-3xl font-bold text-gray-900">
                Управление абитуриентами
              </h1>
            </div>
            <p className="text-gray-600">
              Активация и управление абитуриентами системы тестирования
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                /* TODO: экспорт в Excel */
              }}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Download className="h-4 w-4" />
              Экспорт
            </button>
          </div>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <GraduationCap className="h-8 w-8 text-green-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Всего абитуриентов
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {applicantStats.total}
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
                {applicantStats.active}
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
                {applicantStats.inactive}
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
                {applicantStats.blocked}
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
                className="pl-10 pr-4 py-2 w-80 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            {/* Фильтр по статусу */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="ALL">Все статусы</option>
                <option value="ACTIVE">Активные</option>
                <option value="INACTIVE">Неактивные</option>
                <option value="BLOCKED">Заблокированные</option>
              </select>
            </div>

            {/* Фильтр по направлению */}
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-gray-500" />
              <select
                value={directionFilter}
                onChange={(e) => setDirectionFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="ALL">Все направления</option>
                {directions.map((direction) => (
                  <option key={direction.$id} value={direction.$id}>
                    {direction.name} ({direction.institute?.name})
                  </option>
                ))}
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

            {selectedApplicants.size > 0 && (
              <button
                onClick={handleBulkActivate}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <UserCheck className="h-4 w-4" />
                Активировать выбранных ({selectedApplicants.size})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Список абитуриентов */}
      <div className="bg-white rounded-lg shadow border">
        {filteredApplicants.length === 0 ? (
          <div className="text-center py-12">
            <GraduationCap className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {applicants.length === 0
                ? "Нет абитуриентов"
                : "Абитуриенты не найдены"}
            </h3>
            <p className="text-gray-500">
              {applicants.length === 0
                ? "Абитуриенты будут появляться здесь после регистрации"
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
                      selectedApplicants.size === filteredApplicants.length &&
                      filteredApplicants.length > 0
                    }
                    onChange={toggleSelectAll}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <span className="ml-3 text-sm font-medium text-gray-900">
                    Абитуриенты ({filteredApplicants.length})
                  </span>
                </div>
                <span className="text-sm text-gray-500">Действия</span>
              </div>
            </div>

            {/* Список абитуриентов */}
            <div className="divide-y divide-gray-200">
              {filteredApplicants.map((applicant) => (
                <div
                  key={applicant.$id}
                  className="px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedApplicants.has(applicant.$id)}
                        onChange={() => toggleApplicantSelection(applicant.$id)}
                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                      />

                      <div className="ml-4 flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div>
                            <h3 className="text-sm font-medium text-gray-900">
                              {applicant.name}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Mail className="h-3 w-3 text-gray-400" />
                              <span className="text-sm text-gray-500">
                                {applicant.email}
                              </span>
                            </div>
                          </div>

                          {getStatusBadge(applicant)}
                        </div>

                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>
                              Зарегистрирован {formatDate(applicant.$createdAt)}
                            </span>
                          </div>
                          {/* TODO: добавить информацию о направлении когда будет профиль */}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          /* TODO: просмотр профиля */
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                      >
                        <Eye className="h-3 w-3" />
                        Профиль
                      </button>

                      {applicant.isBlocked ? (
                        <button
                          onClick={() =>
                            handleUnblock(applicant.$id, applicant.name)
                          }
                          disabled={unblockUserMutation.isPending}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 disabled:opacity-50 transition-colors"
                        >
                          <Shield className="h-3 w-3" />
                          Разблокировать
                        </button>
                      ) : applicant.isActive ? (
                        <>
                          <button
                            onClick={() =>
                              handleDeactivate(applicant.$id, applicant.name)
                            }
                            disabled={deactivateUserMutation.isPending}
                            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200 disabled:opacity-50 transition-colors"
                          >
                            <UserX className="h-3 w-3" />
                            Деактивировать
                          </button>
                          <button
                            onClick={() =>
                              handleBlock(applicant.$id, applicant.name)
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
                              handleActivate(applicant.$id, applicant.name)
                            }
                            disabled={activateUserMutation.isPending}
                            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 disabled:opacity-50 transition-colors"
                          >
                            <UserCheck className="h-3 w-3" />
                            Активировать
                          </button>
                          <button
                            onClick={() =>
                              handleBlock(applicant.$id, applicant.name)
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

      {/* Информационная панель */}
      <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-green-600 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-green-900 mb-2">
              Возможности абитуриентов
            </h3>
            <ul className="text-sm text-green-800 space-y-1">
              <li>• Заполнение персональной анкеты с паспортными данными</li>
              <li>• Прохождение тестов по выбранному направлению подготовки</li>
              <li>• Просмотр результатов и оценок за пройденные тесты</li>
              <li>• Отслеживание прогресса и истории тестирования</li>
              <li>
                • Повторное прохождение тестов (если разрешено настройками)
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Статистика по направлениям */}
      {directions.length > 0 && (
        <div className="mt-6 bg-white rounded-lg shadow border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Building className="h-5 w-5" />
            Распределение по направлениям
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {directions.map((direction) => {
              const directionApplicants = applicants.filter((a) => {
                // TODO: фильтр по направлению когда будет профиль
                return true;
              });

              return (
                <div key={direction.$id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900 text-sm">
                      {direction.name}
                    </h4>
                    <span className="text-sm text-gray-500">
                      {/* TODO: показать количество когда будет профиль */}0
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">
                    {direction.institute?.name}
                  </p>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: "0%" }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
