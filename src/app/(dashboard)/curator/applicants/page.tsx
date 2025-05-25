// src/app/(dashboard)/curator/applicants/page.tsx
"use client";

import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  useApplicants,
  useActivateUser,
  useDeactivateUser,
} from "@/services/authService";
import { useActiveDirections } from "@/services/instituteService";
import { User, getTestGrade, getGradeColor } from "@/types";
import { toast } from "react-toastify";
import {
  GraduationCap,
  Search,
  RefreshCw,
  Eye,
  UserCheck,
  UserX,
  Filter,
  Building,
  Calendar,
  Mail,
  Phone,
  Award,
  BarChart3,
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  Target,
  TrendingUp,
  Users,
  TestTube,
  BookOpen,
} from "lucide-react";

export default function CuratorApplicantsPage() {
  const { user } = useAuth();
  const { data: allApplicants = [], isLoading, refetch } = useApplicants();
  const { data: allDirections = [] } = useActiveDirections();
  const activateUserMutation = useActivateUser();
  const deactivateUserMutation = useDeactivateUser();

  // Фильтруем направления по институтам куратора
  // TODO: Когда будет готов сервис назначений кураторов,
  // заменить на реальную фильтрацию по назначенным институтам
  const curatorDirections = allDirections;
  const curatorDirectionIds = curatorDirections.map((d) => d.$id);

  // Фильтруем абитуриентов только по направлениям куратора
  // TODO: Добавить фильтрацию по профилям абитуриентов когда будет готов сервис профилей
  const curatorApplicants = allApplicants; // Пока показываем всех абитуриентов

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "ACTIVE" | "INACTIVE" | "PENDING"
  >("ALL");
  const [directionFilter, setDirectionFilter] = useState<string>("ALL");
  const [selectedApplicant, setSelectedApplicant] = useState<User | null>(null);

  const filteredApplicants = curatorApplicants.filter((applicant) => {
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
      (statusFilter === "PENDING" &&
        !applicant.isActive &&
        !applicant.isBlocked);

    // TODO: Добавить фильтрацию по направлению когда будет профиль
    const matchesDirection = directionFilter === "ALL";

    return matchesSearch && matchesStatus && matchesDirection;
  });

  const applicantStats = {
    total: curatorApplicants.length,
    active: curatorApplicants.filter((a) => a.isActive && !a.isBlocked).length,
    pending: curatorApplicants.filter((a) => !a.isActive && !a.isBlocked)
      .length,
    withProfiles: 0, // TODO: подсчет когда будет сервис профилей
  };

  // Моковые данные для статистики тестирования
  const testingStats = {
    totalTests: 45,
    completedTests: 38,
    averageScore: 76.8,
    passRate: 84.2,
  };

  // Моковые данные результатов абитуриентов
  const getApplicantResults = (applicantId: string) => {
    // TODO: Заменить на реальные данные из сервиса результатов
    return {
      testsCompleted: Math.floor(Math.random() * 5) + 1,
      averageScore: Math.floor(Math.random() * 40) + 60,
      lastActivity: new Date(
        Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000
      ).toISOString(),
      hasProfile: Math.random() > 0.3,
    };
  };

  const handleActivateApplicant = async (
    applicantId: string,
    applicantName: string
  ) => {
    try {
      await activateUserMutation.mutateAsync(applicantId);
      toast.success(`✅ Абитуриент ${applicantName} активирован`);
    } catch (error) {
      toast.error(`❌ Ошибка при активации: ${(error as Error).message}`);
    }
  };

  const handleDeactivateApplicant = async (
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
        Ожидает активации
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

  const formatLastActivity = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Сегодня";
    if (diffDays === 1) return "Вчера";
    if (diffDays < 7) return `${diffDays} дней назад`;
    return formatDate(dateString);
  };

  if (!user) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Ошибка доступа
          </h2>
          <p className="text-gray-600">Пользователь не авторизован</p>
        </div>
      </div>
    );
  }

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
                Мои абитуриенты
              </h1>
            </div>
            <p className="text-gray-600">
              Управление абитуриентами по вашим направлениям подготовки
            </p>
          </div>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-green-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Всего абитуриентов
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {applicantStats.total}
              </p>
              <p className="text-xs text-gray-500">по вашим направлениям</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircle className="h-8 w-8 text-blue-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Активные</p>
              <p className="text-2xl font-bold text-gray-900">
                {applicantStats.active}
              </p>
              <p className="text-xs text-gray-500">могут проходить тесты</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Ожидают активации
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {applicantStats.pending}
              </p>
              <p className="text-xs text-gray-500">требуют вашего одобрения</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Target className="h-8 w-8 text-purple-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Средний балл</p>
              <p className="text-2xl font-bold text-gray-900">
                {testingStats.averageScore.toFixed(1)}
              </p>
              <p className="text-xs text-gray-500">
                {testingStats.passRate.toFixed(1)}% успешных
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Направления куратора */}
      {curatorDirections.length > 0 && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
            <Building className="h-5 w-5" />
            Ваши направления подготовки
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {curatorDirections.map((direction) => {
              // TODO: Подсчет абитуриентов по направлению когда будет профиль
              const applicantsCount = Math.floor(Math.random() * 15) + 5;

              return (
                <div
                  key={direction.$id}
                  className="bg-white rounded-lg p-4 border"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900 text-sm">
                      {direction.name}
                    </h4>
                    <span className="text-sm text-gray-500">
                      {applicantsCount} чел.
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">
                    {direction.institute?.name}
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                    <TestTube className="h-3 w-3" />
                    <span>3 теста доступно</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Фильтры и поиск */}
      <div className="bg-white rounded-lg shadow border p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          {/* Поиск */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Поиск
            </label>
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Имя или email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>

          {/* Фильтр по статусу */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Статус
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="ALL">Все статусы</option>
              <option value="ACTIVE">Активные</option>
              <option value="PENDING">Ожидают активации</option>
              <option value="INACTIVE">Неактивные</option>
            </select>
          </div>

          {/* Фильтр по направлению */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Направление
            </label>
            <select
              value={directionFilter}
              onChange={(e) => setDirectionFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="ALL">Все направления</option>
              {curatorDirections.map((direction) => (
                <option key={direction.$id} value={direction.$id}>
                  {direction.name}
                </option>
              ))}
            </select>
          </div>

          {/* Кнопка обновления */}
          <div>
            <button
              onClick={() => refetch()}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Обновить
            </button>
          </div>
        </div>
      </div>

      {/* Список абитуриентов */}
      <div className="bg-white rounded-lg shadow border">
        {filteredApplicants.length === 0 ? (
          <div className="text-center py-12">
            <GraduationCap className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {curatorApplicants.length === 0
                ? "Нет абитуриентов"
                : "Абитуриенты не найдены"}
            </h3>
            <p className="text-gray-500">
              {curatorApplicants.length === 0
                ? "Абитуриенты появятся здесь после регистрации на ваши направления"
                : "Попробуйте изменить параметры поиска"}
            </p>
          </div>
        ) : (
          <div className="overflow-hidden">
            {/* Заголовок таблицы */}
            <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
              <div className="grid grid-cols-12 gap-4 items-center text-sm font-medium text-gray-900">
                <div className="col-span-4">Абитуриент</div>
                <div className="col-span-2">Направление</div>
                <div className="col-span-2">Результаты</div>
                <div className="col-span-2">Статус</div>
                <div className="col-span-2">Действия</div>
              </div>
            </div>

            {/* Список абитуриентов */}
            <div className="divide-y divide-gray-200">
              {filteredApplicants.map((applicant) => {
                const results = getApplicantResults(applicant.$id);
                const grade = getTestGrade(results.averageScore);

                return (
                  <div
                    key={applicant.$id}
                    className="px-6 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="grid grid-cols-12 gap-4 items-center">
                      {/* Информация об абитуриенте */}
                      <div className="col-span-4">
                        <div>
                          <h3 className="text-sm font-medium text-gray-900 mb-1">
                            {applicant.name}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Mail className="h-3 w-3" />
                            <span>{applicant.email}</span>
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>
                                Рег. {formatDate(applicant.$createdAt)}
                              </span>
                            </div>
                            {results.hasProfile && (
                              <div className="flex items-center gap-1 text-green-600">
                                <CheckCircle className="h-3 w-3" />
                                <span>Анкета заполнена</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Направление */}
                      <div className="col-span-2">
                        <div className="text-sm">
                          {/* TODO: Показать реальное направление из профиля */}
                          <div className="flex items-center gap-1 mb-1">
                            <GraduationCap className="h-3 w-3 text-purple-500" />
                            <span className="font-medium text-gray-900">
                              {curatorDirections[0]?.name || "Не указано"}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">
                            {curatorDirections[0]?.institute?.name}
                          </div>
                        </div>
                      </div>

                      {/* Результаты */}
                      <div className="col-span-2">
                        <div className="text-sm">
                          <div className="flex items-center gap-1 mb-1">
                            <TestTube className="h-3 w-3 text-blue-500" />
                            <span className="font-medium text-gray-900">
                              {results.testsCompleted} тестов
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Target className="h-3 w-3 text-gray-400" />
                            <span
                              className={`text-xs font-medium ${getGradeColor(
                                grade
                              )} px-1 rounded`}
                            >
                              {results.averageScore}% ({grade})
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Последняя активность:{" "}
                            {formatLastActivity(results.lastActivity)}
                          </div>
                        </div>
                      </div>

                      {/* Статус */}
                      <div className="col-span-2">
                        {getStatusBadge(applicant)}
                        {!results.hasProfile && applicant.isActive && (
                          <div className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Анкета не заполнена
                          </div>
                        )}
                      </div>

                      {/* Действия */}
                      <div className="col-span-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedApplicant(applicant)}
                            className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                            title="Просмотреть детали"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => {
                              /* TODO: просмотр результатов */
                            }}
                            className="p-1 text-purple-600 hover:text-purple-800 transition-colors"
                            title="Результаты тестов"
                          >
                            <BarChart3 className="h-4 w-4" />
                          </button>

                          {!applicant.isActive ? (
                            <button
                              onClick={() =>
                                handleActivateApplicant(
                                  applicant.$id,
                                  applicant.name
                                )
                              }
                              disabled={activateUserMutation.isPending}
                              className="p-1 text-green-600 hover:text-green-800 disabled:opacity-50 transition-colors"
                              title="Активировать"
                            >
                              <UserCheck className="h-4 w-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() =>
                                handleDeactivateApplicant(
                                  applicant.$id,
                                  applicant.name
                                )
                              }
                              disabled={deactivateUserMutation.isPending}
                              className="p-1 text-yellow-600 hover:text-yellow-800 disabled:opacity-50 transition-colors"
                              title="Деактивировать"
                            >
                              <UserX className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Модальное окно деталей абитуриента */}
      {selectedApplicant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Информация об абитуриенте
              </h3>
              <button
                onClick={() => setSelectedApplicant(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              {/* Основная информация */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">
                  Основная информация
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Имя:</span>
                    <span className="ml-2 font-medium">
                      {selectedApplicant.name}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Email:</span>
                    <span className="ml-2">{selectedApplicant.email}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Дата регистрации:</span>
                    <span className="ml-2">
                      {formatDate(selectedApplicant.$createdAt)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Статус:</span>
                    <span className="ml-2">
                      {getStatusBadge(selectedApplicant)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Результаты тестирования */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">
                  Результаты тестирования
                </h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-blue-600">
                        {
                          getApplicantResults(selectedApplicant.$id)
                            .testsCompleted
                        }
                      </div>
                      <div className="text-xs text-gray-600">
                        Тестов пройдено
                      </div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-purple-600">
                        {
                          getApplicantResults(selectedApplicant.$id)
                            .averageScore
                        }
                        %
                      </div>
                      <div className="text-xs text-gray-600">Средний балл</div>
                    </div>
                    <div>
                      <div
                        className={`text-2xl font-bold ${getGradeColor(
                          getTestGrade(
                            getApplicantResults(selectedApplicant.$id)
                              .averageScore
                          )
                        )}`}
                      >
                        {getTestGrade(
                          getApplicantResults(selectedApplicant.$id)
                            .averageScore
                        )}
                      </div>
                      <div className="text-xs text-gray-600">Оценка</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Анкетные данные */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">
                  Анкетные данные
                </h4>
                {getApplicantResults(selectedApplicant.$id).hasProfile ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-green-800">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm">
                        Анкета заполнена полностью
                      </span>
                    </div>
                    {/* TODO: Показать реальные данные профиля */}
                    <div className="mt-3 text-sm text-gray-600">
                      <div>ФИО: Иванов Иван Иванович</div>
                      <div>Дата рождения: 15.06.2005</div>
                      <div>Паспорт: 1234 567890</div>
                      <div>Телефон: +7 (999) 123-45-67</div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-orange-800">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-sm">Анкета не заполнена</span>
                    </div>
                    <p className="text-xs text-orange-600 mt-1">
                      Абитуриент должен заполнить анкету для доступа к тестам
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t">
              <button
                onClick={() => setSelectedApplicant(null)}
                className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Закрыть
              </button>
              <button
                onClick={() => {
                  /* TODO: открыть детальные результаты */
                }}
                className="flex-1 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Результаты тестов
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Информационная панель */}
      <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <Award className="h-5 w-5 text-green-600 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-green-900 mb-2">
              Управление абитуриентами
            </h3>
            <ul className="text-sm text-green-800 space-y-1">
              <li>• Активируйте абитуриентов после проверки их регистрации</li>
              <li>• Следите за заполнением анкет - без них тесты недоступны</li>
              <li>
                • Анализируйте результаты для выявления слабых мест в подготовке
              </li>
              <li>
                • Используйте фильтры для быстрого поиска нужных абитуриентов
              </li>
              <li>• Абитуриенты видят только тесты по своему направлению</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
