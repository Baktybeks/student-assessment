// src/app/(dashboard)/admin/directions/page.tsx
"use client";

import React, { useState } from "react";
import {
  useDirections,
  useCreateDirection,
  useUpdateDirection,
  useDeleteDirection,
  useActiveInstitutes,
} from "@/services/instituteService";
import { useAuth } from "@/hooks/useAuth";
import {
  DirectionWithInstitute,
  CreateDirectionDto,
  UpdateDirectionDto,
} from "@/types";
import { toast } from "react-toastify";
import {
  GraduationCap,
  Plus,
  Search,
  RefreshCw,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Building,
  Code,
  FileText,
  X,
  Save,
  Filter,
  Calendar,
  TestTube,
  Users,
} from "lucide-react";

export default function DirectionsPage() {
  const { user: currentUser } = useAuth();
  const { data: directions = [], isLoading, refetch } = useDirections();
  const { data: institutes = [] } = useActiveInstitutes();
  const createDirectionMutation = useCreateDirection();
  const updateDirectionMutation = useUpdateDirection();
  const deleteDirectionMutation = useDeleteDirection();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "ACTIVE" | "INACTIVE"
  >("ALL");
  const [instituteFilter, setInstituteFilter] = useState<string>("ALL");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingDirection, setEditingDirection] =
    useState<DirectionWithInstitute | null>(null);
  const [formData, setFormData] = useState<CreateDirectionDto>({
    name: "",
    code: "",
    instituteId: "",
    description: "",
  });

  const filteredDirections = directions.filter((direction) => {
    const matchesSearch =
      direction.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      direction.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      direction.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      direction.institute?.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" && direction.isActive) ||
      (statusFilter === "INACTIVE" && !direction.isActive);

    const matchesInstitute =
      instituteFilter === "ALL" || direction.instituteId === instituteFilter;

    return matchesSearch && matchesStatus && matchesInstitute;
  });

  const directionStats = {
    total: directions.length,
    active: directions.filter((d) => d.isActive).length,
    inactive: directions.filter((d) => !d.isActive).length,
  };

  // Группировка по институтам
  const directionsByInstitute = institutes.map((institute) => ({
    institute,
    directions: directions.filter((d) => d.instituteId === institute.$id),
    activeDirections: directions.filter(
      (d) => d.instituteId === institute.$id && d.isActive
    ).length,
  }));

  const handleCreateDirection = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.code || !formData.instituteId) {
      toast.error("Заполните обязательные поля");
      return;
    }

    if (!currentUser) {
      toast.error("Ошибка аутентификации");
      return;
    }

    try {
      await createDirectionMutation.mutateAsync({
        data: formData,
        createdBy: currentUser.$id,
      });

      toast.success(`✅ Направление "${formData.name}" успешно создано`);
      setShowCreateForm(false);
      setFormData({ name: "", code: "", instituteId: "", description: "" });
    } catch (error) {
      toast.error(
        `❌ Ошибка при создании направления: ${(error as Error).message}`
      );
    }
  };

  const handleUpdateDirection = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingDirection || !formData.name || !formData.code) {
      toast.error("Заполните обязательные поля");
      return;
    }

    try {
      const updateData: UpdateDirectionDto = {
        name: formData.name,
        code: formData.code,
        description: formData.description,
      };

      await updateDirectionMutation.mutateAsync({
        id: editingDirection.$id,
        data: updateData,
      });

      toast.success(`✅ Направление "${formData.name}" обновлено`);
      setEditingDirection(null);
      setFormData({ name: "", code: "", instituteId: "", description: "" });
    } catch (error) {
      toast.error(
        `❌ Ошибка при обновлении направления: ${(error as Error).message}`
      );
    }
  };

  const handleToggleStatus = async (direction: DirectionWithInstitute) => {
    const newStatus = !direction.isActive;
    const action = newStatus ? "активировать" : "деактивировать";

    if (
      window.confirm(
        `${action.charAt(0).toUpperCase() + action.slice(1)} направление "${
          direction.name
        }"?`
      )
    ) {
      try {
        await updateDirectionMutation.mutateAsync({
          id: direction.$id,
          data: { isActive: newStatus },
        });

        toast.success(
          `✅ Направление "${direction.name}" ${
            newStatus ? "активировано" : "деактивировано"
          }`
        );
      } catch (error) {
        toast.error(
          `❌ Ошибка при изменении статуса: ${(error as Error).message}`
        );
      }
    }
  };

  const handleDeleteDirection = async (direction: DirectionWithInstitute) => {
    // TODO: Проверить, есть ли тесты или абитуриенты для этого направления

    if (
      window.confirm(
        `Удалить направление "${direction.name}"? Это действие нельзя отменить.`
      )
    ) {
      try {
        await deleteDirectionMutation.mutateAsync(direction.$id);
        toast.success(`✅ Направление "${direction.name}" удалено`);
      } catch (error) {
        toast.error(
          `❌ Ошибка при удалении направления: ${(error as Error).message}`
        );
      }
    }
  };

  const handleEditClick = (direction: DirectionWithInstitute) => {
    setEditingDirection(direction);
    setFormData({
      name: direction.name,
      code: direction.code,
      instituteId: direction.instituteId,
      description: direction.description || "",
    });
  };

  const resetForm = () => {
    setFormData({ name: "", code: "", instituteId: "", description: "" });
    setEditingDirection(null);
    setShowCreateForm(false);
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
          <span className="ml-3 text-gray-600">Загрузка направлений...</span>
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
              <GraduationCap className="h-8 w-8 text-purple-500" />
              <h1 className="text-3xl font-bold text-gray-900">
                Управление направлениями
              </h1>
            </div>
            <p className="text-gray-600">
              Создание и управление направлениями подготовки
            </p>
          </div>

          <button
            onClick={() => setShowCreateForm(true)}
            disabled={institutes.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="h-4 w-4" />
            Создать направление
          </button>
        </div>
      </div>

      {/* Предупреждение если нет институтов */}
      {institutes.length === 0 && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-yellow-900 mb-1">
                Нет доступных институтов
              </h3>
              <p className="text-sm text-yellow-800">
                Для создания направлений сначала необходимо создать институты.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <GraduationCap className="h-8 w-8 text-purple-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Всего направлений
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {directionStats.total}
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
                {directionStats.active}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Building className="h-8 w-8 text-blue-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Покрытых институтов
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {new Set(directions.map((d) => d.instituteId)).size}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Статистика по институтам */}
      {directionsByInstitute.length > 0 && (
        <div className="mb-6 bg-white rounded-lg shadow border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Building className="h-5 w-5" />
            Распределение по институтам
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {directionsByInstitute.map(
              ({ institute, directions: instDirections, activeDirections }) => (
                <div key={institute.$id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900 text-sm">
                      {institute.name}
                    </h4>
                    <span className="text-sm text-gray-500">
                      {activeDirections}/{instDirections.length}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">
                    Код: {institute.code}
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                      style={{
                        width:
                          instDirections.length > 0
                            ? `${
                                (activeDirections / instDirections.length) * 100
                              }%`
                            : "0%",
                      }}
                    ></div>
                  </div>
                </div>
              )
            )}
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
                placeholder="Название, код, институт..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="ALL">Все статусы</option>
              <option value="ACTIVE">Активные</option>
              <option value="INACTIVE">Неактивные</option>
            </select>
          </div>

          {/* Фильтр по институту */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Институт
            </label>
            <select
              value={instituteFilter}
              onChange={(e) => setInstituteFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="ALL">Все институты</option>
              {institutes.map((institute) => (
                <option key={institute.$id} value={institute.$id}>
                  {institute.name}
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

      {/* Список направлений */}
      <div className="bg-white rounded-lg shadow border">
        {filteredDirections.length === 0 ? (
          <div className="text-center py-12">
            <GraduationCap className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {directions.length === 0
                ? "Нет направлений"
                : "Направления не найдены"}
            </h3>
            <p className="text-gray-500 mb-4">
              {directions.length === 0
                ? "Создайте первое направление подготовки"
                : "Попробуйте изменить параметры поиска"}
            </p>
            {directions.length === 0 && institutes.length > 0 && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Создать направление
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-hidden">
            {/* Заголовок таблицы */}
            <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
              <div className="grid grid-cols-12 gap-4 items-center text-sm font-medium text-gray-900">
                <div className="col-span-4">Направление</div>
                <div className="col-span-2">Код</div>
                <div className="col-span-3">Институт</div>
                <div className="col-span-1">Статус</div>
                <div className="col-span-2">Действия</div>
              </div>
            </div>

            {/* Список направлений */}
            <div className="divide-y divide-gray-200">
              {filteredDirections.map((direction) => (
                <div
                  key={direction.$id}
                  className="px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="grid grid-cols-12 gap-4 items-center">
                    {/* Название и описание */}
                    <div className="col-span-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 mb-1">
                          {direction.name}
                        </h3>
                        {direction.description && (
                          <p className="text-xs text-gray-500 line-clamp-2">
                            {direction.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                          <Calendar className="h-3 w-3" />
                          <span>
                            Создано {formatDate(direction.$createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Код */}
                    <div className="col-span-2">
                      <div className="flex items-center gap-1">
                        <Code className="h-3 w-3 text-gray-400" />
                        <span className="text-sm font-mono text-gray-900">
                          {direction.code}
                        </span>
                      </div>
                    </div>

                    {/* Институт */}
                    <div className="col-span-3">
                      <div className="flex items-center gap-1">
                        <Building className="h-3 w-3 text-blue-500" />
                        <span className="text-sm text-gray-900">
                          {direction.institute?.name || "Не найден"}
                        </span>
                      </div>
                      {direction.institute?.code && (
                        <p className="text-xs text-gray-500 mt-1">
                          Код: {direction.institute.code}
                        </p>
                      )}
                    </div>

                    {/* Статус */}
                    <div className="col-span-1">
                      {direction.isActive ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                          <CheckCircle className="h-3 w-3" />
                          Активно
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                          <XCircle className="h-3 w-3" />
                          Неактивно
                        </span>
                      )}
                    </div>

                    {/* Действия */}
                    <div className="col-span-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            /* TODO: просмотр тестов направления */
                          }}
                          className="p-1 text-indigo-600 hover:text-indigo-800 transition-colors"
                          title="Просмотреть тесты"
                        >
                          <TestTube className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => {
                            /* TODO: просмотр абитуриентов */
                          }}
                          className="p-1 text-green-600 hover:text-green-800 transition-colors"
                          title="Просмотреть абитуриентов"
                        >
                          <Users className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => handleEditClick(direction)}
                          className="p-1 text-gray-600 hover:text-gray-800 transition-colors"
                          title="Редактировать"
                        >
                          <Edit className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => handleToggleStatus(direction)}
                          disabled={updateDirectionMutation.isPending}
                          className={`p-1 transition-colors ${
                            direction.isActive
                              ? "text-yellow-600 hover:text-yellow-800"
                              : "text-green-600 hover:text-green-800"
                          }`}
                          title={
                            direction.isActive
                              ? "Деактивировать"
                              : "Активировать"
                          }
                        >
                          {direction.isActive ? (
                            <XCircle className="h-4 w-4" />
                          ) : (
                            <CheckCircle className="h-4 w-4" />
                          )}
                        </button>

                        <button
                          onClick={() => handleDeleteDirection(direction)}
                          disabled={deleteDirectionMutation.isPending}
                          className="p-1 text-red-600 hover:text-red-800 disabled:opacity-50 transition-colors"
                          title="Удалить"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Модальное окно создания/редактирования */}
      {(showCreateForm || editingDirection) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingDirection
                  ? "Редактировать направление"
                  : "Создать направление"}
              </h3>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={
                editingDirection ? handleUpdateDirection : handleCreateDirection
              }
              className="space-y-4"
            >
              <div>
                <label
                  htmlFor="directionName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Название направления *
                </label>
                <input
                  id="directionName"
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Введите название направления"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="directionCode"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Код направления *
                </label>
                <input
                  id="directionCode"
                  type="text"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      code: e.target.value.toUpperCase(),
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-mono"
                  placeholder="Например: 09.03.01"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  Код ФГОС или внутренний код направления
                </p>
              </div>

              {!editingDirection && (
                <div>
                  <label
                    htmlFor="instituteSelect"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Институт *
                  </label>
                  <select
                    id="instituteSelect"
                    value={formData.instituteId}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        instituteId: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
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
              )}

              <div>
                <label
                  htmlFor="directionDescription"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Описание
                </label>
                <textarea
                  id="directionDescription"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Краткое описание направления подготовки"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={
                    createDirectionMutation.isPending ||
                    updateDirectionMutation.isPending
                  }
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
                >
                  <Save className="h-4 w-4" />
                  {editingDirection ? "Сохранить" : "Создать"}
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
              Управление направлениями подготовки
            </h3>
            <ul className="text-sm text-purple-800 space-y-1">
              <li>
                • Направления привязываются к институтам и определяют
                специализацию
              </li>
              <li>• Абитуриенты регистрируются на конкретные направления</li>
              <li>• Тесты создаются кураторами для определенных направлений</li>
              <li>
                • Код направления может быть кодом ФГОС или внутренним кодом
              </li>
              <li>
                • Неактивные направления скрыты при регистрации абитуриентов
              </li>
              <li>• Нельзя изменить институт у существующего направления</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
