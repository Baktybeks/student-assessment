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
      <div className="min-h-screen bg-slate-900 text-white">
        <div className="p-6 max-w-7xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent"></div>
            <span className="ml-3 text-slate-300 font-mono">ЗАГРУЗКА ДАННЫХ...</span>
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
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <UserPlus className="h-8 w-8 text-teal-400" />
                <h1 className="text-3xl font-mono font-bold text-white uppercase tracking-wide">
                  НАЗНАЧЕНИЯ КУРАТОРОВ
                </h1>
              </div>
              <p className="text-slate-300 font-mono">
                УПРАВЛЕНИЕ НАЗНАЧЕНИЯМИ КУРАТОРОВ НА ИНСТИТУТЫ
              </p>
            </div>

            <button
              onClick={() => setShowCreateForm(true)}
              disabled={curators.length === 0 || institutes.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-teal-800 text-teal-200 border-2 border-teal-600 disabled:opacity-50 disabled:cursor-not-allowed font-mono font-bold uppercase"
            >
              <Plus className="h-4 w-4" />
              СОЗДАТЬ НАЗНАЧЕНИЕ
            </button>
          </div>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800 border-2 border-slate-600 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserCheck className="h-8 w-8 text-teal-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-mono font-bold text-slate-300 uppercase">
                  ВСЕГО НАЗНАЧЕНИЙ
                </p>
                <p className="text-2xl font-mono font-bold text-white">
                  {assignments.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 border-2 border-slate-600 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-mono font-bold text-slate-300 uppercase">
                  НАЗНАЧЕННЫЕ КУРАТОРЫ
                </p>
                <p className="text-2xl font-mono font-bold text-white">
                  {new Set(assignments.map((a) => a.curatorId)).size}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 border-2 border-slate-600 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Building className="h-8 w-8 text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-mono font-bold text-slate-300 uppercase">
                  ПОКРЫТЫЕ ИНСТИТУТЫ
                </p>
                <p className="text-2xl font-mono font-bold text-white">
                  {new Set(assignments.map((a) => a.instituteId)).size}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 border-2 border-slate-600 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-8 w-8 text-orange-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-mono font-bold text-slate-300 uppercase">
                  БЕЗ НАЗНАЧЕНИЙ
                </p>
                <p className="text-2xl font-mono font-bold text-white">
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
              <div className="bg-yellow-900 border-2 border-yellow-600 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-mono font-bold text-yellow-200 mb-2 uppercase">
                      КУРАТОРЫ БЕЗ НАЗНАЧЕНИЙ ({unassignedCurators.length})
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {unassignedCurators.slice(0, 5).map((curator) => (
                        <span
                          key={curator.$id}
                          className="px-2 py-1 text-xs bg-yellow-800 text-yellow-200 border border-yellow-600 font-mono font-bold uppercase"
                        >
                          {curator.name}
                        </span>
                      ))}
                      {unassignedCurators.length > 5 && (
                        <span className="px-2 py-1 text-xs bg-yellow-800 text-yellow-200 border border-yellow-600 font-mono font-bold uppercase">
                          +{unassignedCurators.length - 5} ЕЩЕ
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {institutesWithoutCurators.length > 0 && (
              <div className="bg-blue-900 border-2 border-blue-600 p-4">
                <div className="flex items-start gap-3">
                  <Building className="h-5 w-5 text-blue-400 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-mono font-bold text-blue-200 mb-2 uppercase">
                      ИНСТИТУТЫ БЕЗ КУРАТОРОВ ({institutesWithoutCurators.length})
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {institutesWithoutCurators.slice(0, 3).map((institute) => (
                        <span
                          key={institute.$id}
                          className="px-2 py-1 text-xs bg-blue-800 text-blue-200 border border-blue-600 font-mono font-bold uppercase"
                        >
                          {institute.name}
                        </span>
                      ))}
                      {institutesWithoutCurators.length > 3 && (
                        <span className="px-2 py-1 text-xs bg-blue-800 text-blue-200 border border-blue-600 font-mono font-bold uppercase">
                          +{institutesWithoutCurators.length - 3} ЕЩЕ
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
        <div className="bg-slate-800 border-2 border-slate-600 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="ПОИСК ПО КУРАТОРУ ИЛИ ИНСТИТУТУ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-80 border-2 border-slate-600 bg-slate-700 text-white font-mono placeholder-slate-400 uppercase"
              />
            </div>

            <button
              onClick={() => {
                /* TODO: обновление данных */
              }}
              className="flex items-center gap-2 px-3 py-2 text-slate-300 font-mono font-bold border border-slate-600 uppercase"
            >
              <RefreshCw className="h-4 w-4" />
              ОБНОВИТЬ
            </button>
          </div>
        </div>

        {/* Список назначений */}
        <div className="bg-slate-800 border-2 border-slate-600">
          {assignments.length === 0 ? (
            <div className="text-center py-12">
              <UserPlus className="h-16 w-16 text-slate-500 mx-auto mb-4" />
              <h3 className="text-lg font-mono font-bold text-white mb-2 uppercase">
                НЕТ НАЗНАЧЕНИЙ КУРАТОРОВ
              </h3>
              <p className="text-slate-400 font-mono mb-4">
                СОЗДАЙТЕ ПЕРВОЕ НАЗНАЧЕНИЕ КУРАТОРА НА ИНСТИТУТ
              </p>
              {curators.length > 0 && institutes.length > 0 && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-teal-800 text-teal-200 border-2 border-teal-600 font-mono font-bold uppercase"
                >
                  <Plus className="h-4 w-4" />
                  СОЗДАТЬ НАЗНАЧЕНИЕ
                </button>
              )}
            </div>
          ) : filteredAssignments.length === 0 ? (
            <div className="text-center py-12">
              <Search className="h-16 w-16 text-slate-500 mx-auto mb-4" />
              <h3 className="text-lg font-mono font-bold text-white mb-2 uppercase">
                НАЗНАЧЕНИЯ НЕ НАЙДЕНЫ
              </h3>
              <p className="text-slate-400 font-mono">
                ПОПРОБУЙТЕ ИЗМЕНИТЬ ПАРАМЕТРЫ ПОИСКА
              </p>
            </div>
          ) : (
            <div className="overflow-hidden">
              {/* Заголовок таблицы */}
              <div className="bg-slate-700 px-6 py-3 border-b-2 border-slate-600">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-mono font-bold text-white uppercase">
                    НАЗНАЧЕНИЯ ({filteredAssignments.length})
                  </span>
                  <span className="text-sm text-slate-300 font-mono font-bold uppercase">
                    ДЕЙСТВИЯ
                  </span>
                </div>
              </div>

              {/* Список назначений */}
              <div className="divide-y-2 divide-slate-700">
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
                      className="px-6 py-4 bg-slate-800"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-2">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-blue-400" />
                              <span className="font-mono font-bold text-white">
                                {curator?.name || "КУРАТОР НЕ НАЙДЕН"}
                              </span>
                            </div>

                            <div className="text-slate-400 font-mono">→</div>

                            <div className="flex items-center gap-2">
                              <Building className="h-4 w-4 text-green-400" />
                              <span className="font-mono font-bold text-white">
                                {institute?.name || "ИНСТИТУТ НЕ НАЙДЕН"}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-xs text-slate-400 font-mono">
                            <span>EMAIL: {curator?.email}</span>
                            <span>КОД ИНСТИТУТА: {institute?.code}</span>
                            <span>
                              НАЗНАЧЕНО: {formatDate(assignment.$createdAt)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              /* TODO: просмотр деталей */
                            }}
                            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-800 text-blue-200 border border-blue-600 font-mono font-bold uppercase"
                          >
                            <Eye className="h-3 w-3" />
                            ДЕТАЛИ
                          </button>

                          <button
                            onClick={() => handleDeleteAssignment(assignment.$id)}
                            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-800 text-red-200 border border-red-600 font-mono font-bold uppercase"
                          >
                            <Trash2 className="h-3 w-3" />
                            УДАЛИТЬ
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
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-slate-800 border-2 border-slate-600 p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-mono font-bold text-white uppercase">
                  СОЗДАТЬ НАЗНАЧЕНИЕ
                </h3>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="text-slate-400"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreateAssignment} className="space-y-4">
                <div>
                  <label
                    htmlFor="curator"
                    className="block text-sm font-mono font-bold text-slate-300 mb-1 uppercase"
                  >
                    КУРАТОР
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
                    className="w-full px-3 py-2 border-2 border-slate-600 bg-slate-700 text-white font-mono"
                    required
                  >
                    <option value="">ВЫБЕРИТЕ КУРАТОРА</option>
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
                    className="block text-sm font-mono font-bold text-slate-300 mb-1 uppercase"
                  >
                    ИНСТИТУТ
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
                    className="w-full px-3 py-2 border-2 border-slate-600 bg-slate-700 text-white font-mono"
                    required
                  >
                    <option value="">ВЫБЕРИТЕ ИНСТИТУТ</option>
                    {institutes.map((institute) => (
                      <option key={institute.$id} value={institute.$id}>
                        {institute.name} ({institute.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="bg-teal-900 border-2 border-teal-600 p-3">
                  <p className="text-sm text-teal-200 font-mono">
                    <strong className="font-bold uppercase">НАЗНАЧЕНИЕ КУРАТОРА:</strong> КУРАТОР ПОЛУЧИТ ДОСТУП К
                    УПРАВЛЕНИЮ ТЕСТАМИ И АБИТУРИЕНТАМИ ВЫБРАННОГО ИНСТИТУТА.
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      setNewAssignment({ curatorId: "", instituteId: "" });
                    }}
                    className="flex-1 px-4 py-2 text-slate-300 bg-slate-700 border border-slate-600 font-mono font-bold uppercase"
                  >
                    ОТМЕНА
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 text-teal-200 bg-teal-800 border-2 border-teal-600 font-mono font-bold uppercase"
                  >
                    СОЗДАТЬ НАЗНАЧЕНИЕ
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Информационная панель */}
        <div className="mt-6 bg-teal-900 border-2 border-teal-600 p-6">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-teal-400 mt-0.5" />
            <div>
              <h3 className="text-sm font-mono font-bold text-teal-200 mb-2 uppercase">
                НАЗНАЧЕНИЯ КУРАТОРОВ
              </h3>
              <ul className="text-sm text-teal-300 font-mono space-y-1">
                <li>
                  • ОДИН КУРАТОР МОЖЕТ БЫТЬ НАЗНАЧЕН НА НЕСКОЛЬКО ИНСТИТУТОВ
                </li>
                <li>
                  • КУРАТОР ПОЛУЧАЕТ ДОСТУП КО ВСЕМ НАПРАВЛЕНИЯМ СВОЕГО ИНСТИТУТА
                </li>
                <li>
                  • НАЗНАЧЕНИЕ ДАЕТ ПРАВА НА СОЗДАНИЕ ТЕСТОВ И УПРАВЛЕНИЕ
                  АБИТУРИЕНТАМИ
                </li>
                <li>
                  • УДАЛЕНИЕ НАЗНАЧЕНИЯ ОГРАНИЧИВАЕТ ДОСТУП КУРАТОРА К ИНСТИТУТУ
                </li>
                <li>
                  • РЕКОМЕНДУЕТСЯ НАЗНАЧАТЬ КУРАТОРОВ НА ВСЕ АКТИВНЫЕ ИНСТИТУТЫ
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}