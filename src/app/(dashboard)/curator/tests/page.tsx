// src/app/(dashboard)/curator/tests/page.tsx
"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
  useTestsByCurator,
  useDeleteTest,
  usePublishTest,
  testApi,
} from "@/services/testService";
import { TestWithDetails } from "@/types";
import { toast } from "react-toastify";
import {
  TestTube,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Play,
  Pause,
  Clock,
  Target,
  BookOpen,
  AlertTriangle,
  CheckCircle,
  MoreVertical,
  Download,
  Upload,
  Copy,
  Archive,
  RefreshCw,
  TrendingUp,
  Users,
  Calendar,
  Settings,
  FileText,
  BarChart3,
  PieChart,
} from "lucide-react";

type FilterStatus = "all" | "published" | "draft";
type SortBy = "createdAt" | "title" | "questionsCount" | "updatedAt";
type SortOrder = "asc" | "desc";

export default function CuratorTestsPage() {
  const router = useRouter();
  const { user } = useAuth();

  // Получаем тесты куратора
  const {
    data: tests = [],
    isLoading,
    refetch: refetchTests,
  } = useTestsByCurator(user?.$id || "");

  const deleteTestMutation = useDeleteTest();
  const publishTestMutation = usePublishTest();

  // Состояние фильтров и поиска
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [sortBy, setSortBy] = useState<SortBy>("updatedAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [showFilters, setShowFilters] = useState(false);

  // Состояние выбранных тестов для массовых операций
  const [selectedTests, setSelectedTests] = useState<string[]>([]);

  // Фильтрация и сортировка тестов
  const filteredAndSortedTests = useMemo(() => {
    let filtered = tests.filter((test) => {
      // Фильтр по статусу
      if (filterStatus === "published" && !test.isPublished) return false;
      if (filterStatus === "draft" && test.isPublished) return false;

      // Поиск по названию и описанию
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          test.title.toLowerCase().includes(query) ||
          test.description?.toLowerCase().includes(query) ||
          test.direction?.name.toLowerCase().includes(query) ||
          test.institute?.name.toLowerCase().includes(query)
        );
      }

      return true;
    });

    // Сортировка
    filtered.sort((a, b) => {
      let valueA: any, valueB: any;

      switch (sortBy) {
        case "title":
          valueA = a.title.toLowerCase();
          valueB = b.title.toLowerCase();
          break;
        case "questionsCount":
          valueA = a.questionsCount || 0;
          valueB = b.questionsCount || 0;
          break;
        case "updatedAt":
          valueA = new Date(a.updatedAt || a.$createdAt);
          valueB = new Date(b.updatedAt || b.$createdAt);
          break;
        case "createdAt":
        default:
          valueA = new Date(a.$createdAt);
          valueB = new Date(b.$createdAt);
          break;
      }

      if (valueA < valueB) return sortOrder === "asc" ? -1 : 1;
      if (valueA > valueB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [tests, searchQuery, filterStatus, sortBy, sortOrder]);

  // Статистика
  const stats = useMemo(() => {
    return {
      total: tests.length,
      published: tests.filter((t) => t.isPublished).length,
      draft: tests.filter((t) => !t.isPublished).length,
      totalQuestions: tests.reduce((sum, t) => sum + (t.questionsCount || 0), 0),
      averageQuestions: tests.length > 0 
        ? Math.round(tests.reduce((sum, t) => sum + (t.questionsCount || 0), 0) / tests.length)
        : 0,
    };
  }, [tests]);

  // Обработчики действий
  const handleDeleteTest = async (test: TestWithDetails) => {
    const confirmMessage = test.isPublished
      ? `Удалить опубликованный тест "${test.title}"? Это действие нельзя отменить, и тест станет недоступен абитуриентам.`
      : `Удалить тест "${test.title}"? Это действие нельзя отменить.`;

    if (window.confirm(confirmMessage)) {
      try {
        await deleteTestMutation.mutateAsync(test.$id);
        toast.success(`Тест "${test.title}" удален`);
        
        // Убираем тест из выбранных
        setSelectedTests(prev => prev.filter(id => id !== test.$id));
      } catch (error) {
        toast.error(`Ошибка при удалении теста: ${(error as Error).message}`);
      }
    }
  };

  const handleTogglePublish = async (test: TestWithDetails) => {
    if (test.isPublished) {
      // Снимаем с публикации
      if (window.confirm(`Снять тест "${test.title}" с публикации? Он станет недоступен абитуриентам.`)) {
        try {
          await testApi.unpublishTest(test.$id);
          toast.success(`Тест "${test.title}" снят с публикации`);
          refetchTests();
        } catch (error) {
          toast.error(`Ошибка: ${(error as Error).message}`);
        }
      }
    } else {
      // Публикуем
      try {
        await publishTestMutation.mutateAsync(test.$id);
        toast.success(`Тест "${test.title}" опубликован`);
      } catch (error) {
        toast.error(`Ошибка при публикации: ${(error as Error).message}`);
      }
    }
  };

  const handleSelectAll = () => {
    if (selectedTests.length === filteredAndSortedTests.length) {
      setSelectedTests([]);
    } else {
      setSelectedTests(filteredAndSortedTests.map(t => t.$id));
    }
  };

  const handleSelectTest = (testId: string) => {
    setSelectedTests(prev => 
      prev.includes(testId) 
        ? prev.filter(id => id !== testId)
        : [...prev, testId]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedTests.length === 0) return;

    const testsToDelete = tests.filter(t => selectedTests.includes(t.$id));
    const publishedCount = testsToDelete.filter(t => t.isPublished).length;
    
    let confirmMessage = `Удалить выбранные тесты (${selectedTests.length} шт.)? Это действие нельзя отменить.`;
    if (publishedCount > 0) {
      confirmMessage += ` Среди них ${publishedCount} опубликованных тестов, которые станут недоступны абитуриентам.`;
    }

    if (window.confirm(confirmMessage)) {
      let successCount = 0;
      let errorCount = 0;

      for (const testId of selectedTests) {
        try {
          await deleteTestMutation.mutateAsync(testId);
          successCount++;
        } catch (error) {
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`Успешно удалено тестов: ${successCount}`);
      }
      if (errorCount > 0) {
        toast.error(`Ошибок при удалении: ${errorCount}`);
      }

      setSelectedTests([]);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (test: TestWithDetails) => {
    if (!test.isActive) return "bg-gray-100 text-gray-800";
    if (test.isPublished) return "bg-green-100 text-green-800";
    return "bg-yellow-100 text-yellow-800";
  };

  const getStatusText = (test: TestWithDetails) => {
    if (!test.isActive) return "Неактивен";
    if (test.isPublished) return "Опубликован";
    return "Черновик";
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Загрузка тестов...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Заголовок */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <TestTube className="h-8 w-8 text-blue-500" />
              <h1 className="text-3xl font-bold text-gray-900">Мои тесты</h1>
            </div>
            <p className="text-gray-600">
              Управление тестами для абитуриентов
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => refetchTests()}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Обновить
            </button>

            <button
              onClick={() => router.push("/curator/tests/create")}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Создать тест
            </button>
          </div>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TestTube className="h-8 w-8 text-blue-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Всего тестов</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Опубликовано</p>
              <p className="text-2xl font-bold text-gray-900">{stats.published}</p>
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
              <p className="text-2xl font-bold text-gray-900">{stats.draft}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BookOpen className="h-8 w-8 text-purple-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Всего вопросов</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalQuestions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BarChart3 className="h-8 w-8 text-orange-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Средн. вопросов</p>
              <p className="text-2xl font-bold text-gray-900">{stats.averageQuestions}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Поиск и фильтры */}
      <div className="bg-white rounded-lg shadow border p-4 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Поиск по названию, описанию, направлению..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
              showFilters 
                ? "bg-blue-50 border-blue-300 text-blue-700" 
                : "border-gray-300 text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Filter className="h-4 w-4" />
            Фильтры
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Статус
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Все тесты</option>
                <option value="published">Опубликованные</option>
                <option value="draft">Черновики</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Сортировать по
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortBy)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="updatedAt">Дате изменения</option>
                <option value="createdAt">Дате создания</option>
                <option value="title">Названию</option>
                <option value="questionsCount">Количеству вопросов</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Порядок
              </label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="desc">По убыванию</option>
                <option value="asc">По возрастанию</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchQuery("");
                  setFilterStatus("all");
                  setSortBy("updatedAt");
                  setSortOrder("desc");
                }}
                className="w-full px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Сбросить
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Массовые операции */}
      {selectedTests.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-blue-900">
                Выбрано тестов: {selectedTests.length}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleBulkDelete}
                disabled={deleteTestMutation.isPending}
                className="flex items-center gap-2 px-3 py-1 text-sm text-red-600 bg-white border border-red-300 rounded hover:bg-red-50 disabled:opacity-50 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                Удалить выбранные
              </button>
              <button
                onClick={() => setSelectedTests([])}
                className="flex items-center gap-2 px-3 py-1 text-sm text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                Отменить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Список тестов */}
      <div className="bg-white rounded-lg shadow border">
        {filteredAndSortedTests.length === 0 ? (
          <div className="text-center py-12">
            {tests.length === 0 ? (
              <>
                <TestTube className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  У вас пока нет тестов
                </h3>
                <p className="text-gray-500 mb-4">
                  Создайте первый тест для ваших абитуриентов
                </p>
                <button
                  onClick={() => router.push("/curator/tests/create")}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Создать первый тест
                </button>
              </>
            ) : (
              <>
                <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Тесты не найдены
                </h3>
                <p className="text-gray-500">
                  Попробуйте изменить параметры поиска или фильтрации
                </p>
              </>
            )}
          </div>
        ) : (
          <>
            {/* Заголовок таблицы */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedTests.length === filteredAndSortedTests.length && filteredAndSortedTests.length > 0}
                    onChange={handleSelectAll}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-3 text-sm font-medium text-gray-900">
                    Тест
                  </span>
                </div>
              </div>
            </div>

            {/* Список тестов */}
            <div className="divide-y divide-gray-200">
              {filteredAndSortedTests.map((test) => (
                <div key={test.$id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start">
                    <div className="flex items-center mr-4">
                      <input
                        type="checkbox"
                        checked={selectedTests.includes(test.$id)}
                        onChange={() => handleSelectTest(test.$id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {test.title}
                            </h3>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(test)}`}>
                              {getStatusText(test)}
                            </span>
                          </div>

                          {test.description && (
                            <p className="text-gray-600 mb-3 line-clamp-2">
                              {test.description}
                            </p>
                          )}

                          <div className="flex items-center gap-6 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <BookOpen className="h-4 w-4" />
                              <span>{test.questionsCount || 0} вопросов</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Target className="h-4 w-4" />
                              <span>{test.maxScore} баллов</span>
                            </div>
                            {test.timeLimit && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                <span>{test.timeLimit} мин</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>Изменен {formatDate(test.updatedAt || test.$createdAt)}</span>
                            </div>
                          </div>

                          <div className="mt-2 text-sm text-gray-600">
                            <span className="font-medium">{test.direction?.name}</span>
                            {test.institute && (
                              <span> • {test.institute.name}</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          <button
                            onClick={() => router.push(`/curator/tests/${test.$id}/edit`)}
                            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Редактировать"
                          >
                            <Edit className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => handleTogglePublish(test)}
                            disabled={publishTestMutation.isPending}
                            className={`p-2 rounded-lg transition-colors ${
                              test.isPublished
                                ? "text-orange-600 hover:text-orange-800 hover:bg-orange-100"
                                : "text-green-600 hover:text-green-800 hover:bg-green-100"
                            }`}
                            title={test.isPublished ? "Снять с публикации" : "Опубликовать"}
                          >
                            {test.isPublished ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>

                          <button
                            onClick={() => handleDeleteTest(test)}
                            disabled={deleteTestMutation.isPending}
                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg transition-colors"
                            title="Удалить"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Показать результаты поиска */}
      {searchQuery && (
        <div className="mt-4 text-sm text-gray-600 text-center">
          Найдено тестов: {filteredAndSortedTests.length} из {tests.length}
        </div>
      )}
    </div>
  );
}