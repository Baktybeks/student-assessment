// src/app/(dashboard)/admin/curator-assignments/page.tsx
"use client";

import React, { useState } from "react";
import { useActiveCurators } from "@/services/authService";
import { useActiveInstitutes } from "@/services/instituteService";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "react-toastify";
import {
  UserPlus,
  Building,
  Users,
  Search,
  RefreshCw,
  Plus,
  X,
  AlertTriangle,
  CheckCircle,
  Eye,
  Edit,
  Trash2,
  UserCheck,
} from "lucide-react";

// TODO: Добавить сервисы для работы с назначениями кураторов
// import { useCuratorAssignments, useCreateAssignment, useDeleteAssignment } from "@/services/curatorService";

export default function CuratorAssignmentsPage() {
  const { user: currentUser } = useAuth();
  const { data: curators = [], isLoading: curatorsLoading } =
    useActiveCurators();
  const { data: institutes = [], isLoading: institutesLoading } =
    useActiveInstitutes();

  // TODO: Заменить на реальные данные когда будут готовы сервисы
  const [assignments, setAssignments] = useState<any[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newAssignment, setNewAssignment] = useState({
    curatorId: "",
    instituteId: "",
  });
  const [searchTerm, setSearchTerm] = useState("");

  // Фильтрация назначений
  const filteredAssignments = assignments.filter((assignment) => {
    const curator = curators.find((c) => c.$id === assignment.curatorId);
    const institute = institutes.find((i) => i.$id === assignment.instituteId);

    const searchLower = searchTerm.toLowerCase();
    return (
      curator?.name.toLowerCase().includes(searchLower) ||
      curator?.email.toLowerCase().includes(searchLower) ||
      institute?.name.toLowerCase().includes(searchLower)
    );
  });

  // Получение кураторов без назначений
  const unassignedCurators = curators.filter(
    (curator) =>
      !assignments.some((assignment) => assignment.curatorId === curator.$id)
  );

  // Получение институтов без кураторов
  const institutesWithoutCurators = institutes.filter(
    (institute) =>
      !assignments.some(
        (assignment) => assignment.instituteId === institute.$id
      )
  );

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newAssignment.curatorId || !newAssignment.instituteId) {
      toast.error("Выберите куратора и институт");
      return;
    }

    // Проверка на дублирование
    if (
      assignments.some(
        (a) =>
          a.curatorId === newAssignment.curatorId &&
          a.instituteId === newAssignment.instituteId
      )
    ) {
      toast.error("Такое назначение уже существует");
      return;
    }

    try {
      // TODO: Заменить на реальный API вызов
      const mockAssignment = {
        $id: Date.now().toString(),
        curatorId: newAssignment.curatorId,
        instituteId: newAssignment.instituteId,
        assignedBy: currentUser?.$id,
        $createdAt: new Date().toISOString(),
      };

      setAssignments((prev) => [...prev, mockAssignment]);

      const curator = curators.find((c) => c.$id === newAssignment.curatorId);
      const institute = institutes.find(
        (i) => i.$id === newAssignment.instituteId
      );

      toast.success(
        `✅ Куратор ${curator?.name} назначен на институт ${institute?.name}`
      );
      setShowCreateForm(false);
      setNewAssignment({ curatorId: "", instituteId: "" });
    } catch (error) {
      toast.error(
        `❌ Ошибка при создании назначения: ${(error as Error).message}`
      );
    }
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    const assignment = assignments.find((a) => a.$id === assignmentId);
    if (!assignment) return;

    const curator = curators.find((c) => c.$id === assignment.curatorId);
    const institute = institutes.find((i) => i.$id === assignment.instituteId);

    if (
      window.confirm(
        `Удалить назначение куратора ${curator?.name} с института ${institute?.name}?`
      )
    ) {
      try {
        // TODO: Заменить на реальный API вызов
        setAssignments((prev) => prev.filter((a) => a.$id !== assignmentId));
        toast.success("✅ Назначение удалено");
      } catch (error) {
        toast.error(
          `❌ Ошибка при удалении назначения: ${(error as Error).message}`
        );
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ru-RU", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (curatorsLoading || institutesLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="ml-3 text-gray-600">Загрузка данных...</span>
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
              <UserPlus className="h-8 w-8 text-teal-500" />
              <h1 className="text-3xl font-bold text-gray-900">
                Назначения кураторов
              </h1>
            </div>
            <p className="text-gray-600">
              Управление назначениями кураторов на институты
            </p>
          </div>

          <button
            onClick={() => setShowCreateForm(true)}
            disabled={curators.length === 0 || institutes.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="h-4 w-4" />
            Создать назначение
          </button>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UserCheck className="h-8 w-8 text-teal-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Всего назначений
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {assignments.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-blue-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Назначенные кураторы
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {new Set(assignments.map((a) => a.curatorId)).size}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Building className="h-8 w-8 text-green-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Покрытые институты
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {new Set(assignments.map((a) => a.instituteId)).size}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Без назначений
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {unassignedCurators.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Предупреждения */}
      {(unassignedCurators.length > 0 ||
        institutesWithoutCurators.length > 0) && (
        <div className="mb-6 space-y-4">
          {unassignedCurators.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-yellow-900 mb-2">
                    Кураторы без назначений ({unassignedCurators.length})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {unassignedCurators.slice(0, 5).map((curator) => (
                      <span
                        key={curator.$id}
                        className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded"
                      >
                        {curator.name}
                      </span>
                    ))}
                    {unassignedCurators.length > 5 && (
                      <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">
                        +{unassignedCurators.length - 5} еще
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {institutesWithoutCurators.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Building className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-blue-900 mb-2">
                    Институты без кураторов ({institutesWithoutCurators.length})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {institutesWithoutCurators.slice(0, 3).map((institute) => (
                      <span
                        key={institute.$id}
                        className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
                      >
                        {institute.name}
                      </span>
                    ))}
                    {institutesWithoutCurators.length > 3 && (
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                        +{institutesWithoutCurators.length - 3} еще
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Поиск */}
      <div className="bg-white rounded-lg shadow border p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Поиск по куратору или институту..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-80 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>

          <button
            onClick={() => {
              /* TODO: обновление данных */
            }}
            className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Обновить
          </button>
        </div>
      </div>

      {/* Список назначений */}
      <div className="bg-white rounded-lg shadow border">
        {assignments.length === 0 ? (
          <div className="text-center py-12">
            <UserPlus className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Нет назначений кураторов
            </h3>
            <p className="text-gray-500 mb-4">
              Создайте первое назначение куратора на институт
            </p>
            {curators.length > 0 && institutes.length > 0 && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Создать назначение
              </button>
            )}
          </div>
        ) : filteredAssignments.length === 0 ? (
          <div className="text-center py-12">
            <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Назначения не найдены
            </h3>
            <p className="text-gray-500">
              Попробуйте изменить параметры поиска
            </p>
          </div>
        ) : (
          <div className="overflow-hidden">
            {/* Заголовок таблицы */}
            <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">
                  Назначения ({filteredAssignments.length})
                </span>
                <span className="text-sm text-gray-500">Действия</span>
              </div>
            </div>

            {/* Список назначений */}
            <div className="divide-y divide-gray-200">
              {filteredAssignments.map((assignment) => {
                const curator = curators.find(
                  (c) => c.$id === assignment.curatorId
                );
                const institute = institutes.find(
                  (i) => i.$id === assignment.instituteId
                );

                return (
                  <div
                    key={assignment.$id}
                    className="px-6 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-blue-500" />
                            <span className="font-medium text-gray-900">
                              {curator?.name || "Куратор не найден"}
                            </span>
                          </div>

                          <div className="text-gray-400">→</div>

                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4 text-green-500" />
                            <span className="font-medium text-gray-900">
                              {institute?.name || "Институт не найден"}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>Email: {curator?.email}</span>
                          <span>Код института: {institute?.code}</span>
                          <span>
                            Назначено: {formatDate(assignment.$createdAt)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            /* TODO: просмотр деталей */
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                        >
                          <Eye className="h-3 w-3" />
                          Детали
                        </button>

                        <button
                          onClick={() => handleDeleteAssignment(assignment.$id)}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                        >
                          <Trash2 className="h-3 w-3" />
                          Удалить
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Модальное окно создания назначения */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Создать назначение
              </h3>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} className="space-y-4">
              <div>
                <label
                  htmlFor="curator"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Куратор
                </label>
                <select
                  id="curator"
                  value={newAssignment.curatorId}
                  onChange={(e) =>
                    setNewAssignment((prev) => ({
                      ...prev,
                      curatorId: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  required
                >
                  <option value="">Выберите куратора</option>
                  {curators.map((curator) => (
                    <option key={curator.$id} value={curator.$id}>
                      {curator.name} ({curator.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="institute"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Институт
                </label>
                <select
                  id="institute"
                  value={newAssignment.instituteId}
                  onChange={(e) =>
                    setNewAssignment((prev) => ({
                      ...prev,
                      instituteId: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  required
                >
                  <option value="">Выберите институт</option>
                  {institutes.map((institute) => (
                    <option key={institute.$id} value={institute.$id}>
                      {institute.name} ({institute.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-teal-50 border border-teal-200 rounded-lg p-3">
                <p className="text-sm text-teal-800">
                  <strong>Назначение куратора:</strong> Куратор получит доступ к
                  управлению тестами и абитуриентами выбранного института.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewAssignment({ curatorId: "", instituteId: "" });
                  }}
                  className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors"
                >
                  Создать назначение
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Информационная панель */}
      <div className="mt-6 bg-teal-50 border border-teal-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-teal-600 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-teal-900 mb-2">
              Назначения кураторов
            </h3>
            <ul className="text-sm text-teal-800 space-y-1">
              <li>
                • Один куратор может быть назначен на несколько институтов
              </li>
              <li>
                • Куратор получает доступ ко всем направлениям своего института
              </li>
              <li>
                • Назначение дает права на создание тестов и управление
                абитуриентами
              </li>
              <li>
                • Удаление назначения ограничивает доступ куратора к институту
              </li>
              <li>
                • Рекомендуется назначать кураторов на все активные институты
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
