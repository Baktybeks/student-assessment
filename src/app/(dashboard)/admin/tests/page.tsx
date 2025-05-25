// src/app/(dashboard)/admin/tests/page.tsx
"use client";

import React, { useState } from "react";
import {
  useTests,
  usePublishTest,
  useDeleteTest,
} from "@/services/testService";
import { useActiveCurators } from "@/services/authService";
import { useActiveDirections } from "@/services/instituteService";
import { TestWithDetails } from "@/types";
import { toast } from "react-toastify";
import {
  TestTube,
  Eye,
  Edit,
  Trash2,
  Search,
  RefreshCw,
  Filter,
  Download,
  Play,
  Pause,
  Clock,
  CheckCircle,
  AlertTriangle,
  Users,
  Building,
  GraduationCap,
  BarChart3,
  FileText,
  Calendar,
  Target,
} from "lucide-react";

export default function AdminTestsPage() {
  const { data: tests = [], isLoading, refetch } = useTests();
  const { data: curators = [] } = useActiveCurators();
  const { data: directions = [] } = useActiveDirections();
  const publishTestMutation = usePublishTest();
  const deleteTestMutation = useDeleteTest();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "PUBLISHED" | "DRAFT" | "INACTIVE"
  >("ALL");
  const [curatorFilter, setCuratorFilter] = useState<string>("ALL");
  const [directionFilter, setDirectionFilter] = useState<string>("ALL");

  const filteredTests = tests.filter((test) => {
    const matchesSearch =
      test.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      test.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      test.direction?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      test.institute?.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "PUBLISHED" && test.isPublished && test.isActive) ||
      (statusFilter === "DRAFT" && !test.isPublished && test.isActive) ||
      (statusFilter === "INACTIVE" && !test.isActive);

    const matchesCurator =
      curatorFilter === "ALL" || test.curatorId === curatorFilter;
    const matchesDirection =
      directionFilter === "ALL" || test.directionId === directionFilter;

    return matchesSearch && matchesStatus && matchesCurator && matchesDirection;
  });

  const testStats = {
    total: tests.length,
    published: tests.filter((t) => t.isPublished && t.isActive).length,
    drafts: tests.filter((t) => !t.isPublished && t.isActive).length,
    inactive: tests.filter((t) => !t.isActive).length,
  };

  const handlePublishTest = async (testId: string, testTitle: string) => {
    try {
      await publishTestMutation.mutateAsync(testId);
      toast.success(`✅ Тест "${testTitle}" опубликован`);
    } catch (error) {
      toast.error(`❌ Ошибка при публикации: ${(error as Error).message}`);
    }
  };

  const handleDeleteTest = async (testId: string, testTitle: string) => {
    if (
      window.confirm(
        `Удалить тест "${testTitle}"? Это действие нельзя отменить.`
      )
    ) {
      try {
        await deleteTestMutation.mutateAsync(testId);
        toast.success(`✅ Тест "${testTitle}" удален`);
      } catch (error) {
        toast.error(`❌ Ошибка при удалении: ${(error as Error).message}`);
      }
    }
  };

  const getStatusBadge = (test: TestWithDetails) => {
    if (!test.isActive) {
      return (
        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
          Неактивен
        </span>
      );
    }
    if (test.isPublished) {
      return (
        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
          Опубликован
        </span>
      );
    }
    return (
      <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
        Черновик
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ru-RU", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return "Без ограничений";
    if (minutes < 60) return `${minutes} мин`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}ч ${remainingMinutes}м`;
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="ml-3 text-gray-600">Загрузка тестов...</span>
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
              <TestTube className="h-8 w-8 text-indigo-500" />
              <h1 className="text-3xl font-bold text-gray-900">
                Все тесты системы
              </h1>
            </div>
            <p className="text-gray-600">
              Просмотр и управление всеми тестами в системе тестирования
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                /* TODO: экспорт всех тестов */
              }}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Download className="h-4 w-4" />
              Экспорт
            </button>

            <button
              onClick={() => {
                /* TODO: статистика */
              }}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <BarChart3 className="h-4 w-4" />
              Статистика
            </button>
          </div>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TestTube className="h-8 w-8 text-indigo-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Всего тестов</p>
              <p className="text-2xl font-bold text-gray-900">
                {testStats.total}
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
              <p className="text-sm font-medium text-gray-600">
                Опубликованные
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {testStats.published}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FileText className="h-8 w-8 text-yellow-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Черновики</p>
              <p className="text-2xl font-bold text-gray-900">
                {testStats.drafts}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Pause className="h-8 w-8 text-gray-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Неактивные</p>
              <p className="text-2xl font-bold text-gray-900">
                {testStats.inactive}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Фильтры и поиск */}
      <div className="bg-white rounded-lg shadow border p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          {/* Поиск */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Поиск
            </label>
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Название теста, направление..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="ALL">Все статусы</option>
              <option value="PUBLISHED">Опубликованные</option>
              <option value="DRAFT">Черновики</option>
              <option value="INACTIVE">Неактивные</option>
            </select>
          </div>

          {/* Фильтр по куратору */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Куратор
            </label>
            <select
              value={curatorFilter}
              onChange={(e) => setCuratorFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="ALL">Все кураторы</option>
              {curators.map((curator) => (
                <option key={curator.$id} value={curator.$id}>
                  {curator.name}
                </option>
              ))}
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="ALL">Все направления</option>
              {directions.map((direction) => (
                <option key={direction.$id} value={direction.$id}>
                  {direction.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Обновить
          </button>
        </div>
      </div>

      {/* Список тестов */}
      <div className="bg-white rounded-lg shadow border">
        {filteredTests.length === 0 ? (
          <div className="text-center py-12">
            <TestTube className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {tests.length === 0 ? "Нет тестов" : "Тесты не найдены"}
            </h3>
            <p className="text-gray-500">
              {tests.length === 0
                ? "Тесты будут появляться здесь после создания кураторами"
                : "Попробуйте изменить параметры поиска"}
            </p>
          </div>
        ) : (
          <div className="overflow-hidden">
            {/* Заголовок таблицы */}
            <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
              <div className="grid grid-cols-12 gap-4 items-center text-sm font-medium text-gray-900">
                <div className="col-span-4">Тест</div>
                <div className="col-span-2">Направление</div>
                <div className="col-span-2">Куратор</div>
                <div className="col-span-1">Статус</div>
                <div className="col-span-1">Вопросы</div>
                <div className="col-span-1">Время</div>
                <div className="col-span-1">Действия</div>
              </div>
            </div>

            {/* Список тестов */}
            <div className="divide-y divide-gray-200">
              {filteredTests.map((test) => {
                const curator = curators.find((c) => c.$id === test.curatorId);

                return (
                  <div
                    key={test.$id}
                    className="px-6 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="grid grid-cols-12 gap-4 items-center">
                      {/* Информация о тесте */}
                      <div className="col-span-4">
                        <div>
                          <h3 className="text-sm font-medium text-gray-900 mb-1">
                            {test.title}
                          </h3>
                          {test.description && (
                            <p className="text-xs text-gray-500 line-clamp-2">
                              {test.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                            <Calendar className="h-3 w-3" />
                            <span>Создан {formatDate(test.$createdAt)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Направление и институт */}
                      <div className="col-span-2">
                        <div className="text-sm">
                          <div className="flex items-center gap-1 mb-1">
                            <GraduationCap className="h-3 w-3 text-blue-500" />
                            <span className="font-medium text-gray-900">
                              {test.direction?.name || "Не указано"}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Building className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-500">
                              {test.institute?.name || "Не указан"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Куратор */}
                      <div className="col-span-2">
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3 text-purple-500" />
                          <span className="text-sm text-gray-900">
                            {curator?.name || "Не найден"}
                          </span>
                        </div>
                        {curator?.email && (
                          <p className="text-xs text-gray-500 mt-1">
                            {curator.email}
                          </p>
                        )}
                      </div>

                      {/* Статус */}
                      <div className="col-span-1">{getStatusBadge(test)}</div>

                      {/* Количество вопросов */}
                      <div className="col-span-1">
                        <div className="flex items-center gap-1">
                          <Target className="h-3 w-3 text-gray-400" />
                          <span className="text-sm text-gray-900">
                            {test.totalQuestions}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">
                          {test.maxScore} баллов
                        </p>
                      </div>

                      {/* Время */}
                      <div className="col-span-1">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-gray-400" />
                          <span className="text-xs text-gray-900">
                            {formatDuration(test.timeLimit)}
                          </span>
                        </div>
                      </div>

                      {/* Действия */}
                      <div className="col-span-1">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              /* TODO: просмотр теста */
                            }}
                            className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                            title="Просмотреть тест"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          {!test.isPublished &&
                            test.isActive &&
                            test.totalQuestions > 0 && (
                              <button
                                onClick={() =>
                                  handlePublishTest(test.$id, test.title)
                                }
                                disabled={publishTestMutation.isPending}
                                className="p-1 text-green-600 hover:text-green-800 disabled:opacity-50 transition-colors"
                                title="Опубликовать тест"
                              >
                                <Play className="h-4 w-4" />
                              </button>
                            )}

                          <button
                            onClick={() =>
                              handleDeleteTest(test.$id, test.title)
                            }
                            disabled={deleteTestMutation.isPending}
                            className="p-1 text-red-600 hover:text-red-800 disabled:opacity-50 transition-colors"
                            title="Удалить тест"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
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

      {/* Информационная панель */}
      <div className="mt-6 bg-indigo-50 border border-indigo-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-indigo-600 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-indigo-900 mb-2">
              Управление тестами
            </h3>
            <ul className="text-sm text-indigo-800 space-y-1">
              <li>• Администратор имеет доступ ко всем тестам в системе</li>
              <li>• Тесты создаются кураторами для своих направлений</li>
              <li>• Только тесты с вопросами могут быть опубликованы</li>
              <li>• Опубликованные тесты становятся доступны абитуриентам</li>
              <li>• Удаление теста также удаляет все его вопросы</li>
              <li>• Неактивные тесты скрыты от абитуриентов</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
