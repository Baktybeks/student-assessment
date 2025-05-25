// src/app/(dashboard)/admin/institutes/page.tsx
"use client";

import React, { useState } from "react";
import {
  useInstitutes,
  useCreateInstitute,
  useUpdateInstitute,
  useDeleteInstitute,
  useDirections,
} from "@/services/instituteService";
import { useAuth } from "@/hooks/useAuth";
import { Institute, CreateInstituteDto, UpdateInstituteDto } from "@/types";
import { toast } from "react-toastify";
import {
  Building,
  Plus,
  Search,
  RefreshCw,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Users,
  GraduationCap,
  Calendar,
  Code,
  FileText,
  X,
  Save,
} from "lucide-react";

export default function InstitutesPage() {
  const { user: currentUser } = useAuth();
  const { data: institutes = [], isLoading, refetch } = useInstitutes();
  const { data: allDirections = [] } = useDirections();
  const createInstituteMutation = useCreateInstitute();
  const updateInstituteMutation = useUpdateInstitute();
  const deleteInstituteMutation = useDeleteInstitute();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "ACTIVE" | "INACTIVE"
  >("ALL");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingInstitute, setEditingInstitute] = useState<Institute | null>(
    null
  );
  const [formData, setFormData] = useState<CreateInstituteDto>({
    name: "",
    code: "",
    description: "",
  });

  const filteredInstitutes = institutes.filter((institute) => {
    const matchesSearch =
      institute.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      institute.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      institute.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" && institute.isActive) ||
      (statusFilter === "INACTIVE" && !institute.isActive);

    return matchesSearch && matchesStatus;
  });

  const instituteStats = {
    total: institutes.length,
    active: institutes.filter((i) => i.isActive).length,
    inactive: institutes.filter((i) => !i.isActive).length,
  };

  // Получаем статистику направлений для каждого института
  const getInstituteDirectionsCount = (instituteId: string) => {
    return allDirections.filter((d) => d.instituteId === instituteId).length;
  };

  const handleCreateInstitute = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.code) {
      toast.error("Заполните обязательные поля");
      return;
    }

    if (!currentUser) {
      toast.error("Ошибка аутентификации");
      return;
    }

    try {
      await createInstituteMutation.mutateAsync({
        data: formData,
        createdBy: currentUser.$id,
      });

      toast.success(`✅ Институт "${formData.name}" успешно создан`);
      setShowCreateForm(false);
      setFormData({ name: "", code: "", description: "" });
    } catch (error) {
      toast.error(
        `❌ Ошибка при создании института: ${(error as Error).message}`
      );
    }
  };

  const handleUpdateInstitute = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingInstitute || !formData.name || !formData.code) {
      toast.error("Заполните обязательные поля");
      return;
    }

    try {
      const updateData: UpdateInstituteDto = {
        name: formData.name,
        code: formData.code,
        description: formData.description,
      };

      await updateInstituteMutation.mutateAsync({
        id: editingInstitute.$id,
        data: updateData,
      });

      toast.success(`✅ Институт "${formData.name}" обновлен`);
      setEditingInstitute(null);
      setFormData({ name: "", code: "", description: "" });
    } catch (error) {
      toast.error(
        `❌ Ошибка при обновлении института: ${(error as Error).message}`
      );
    }
  };

  const handleToggleStatus = async (institute: Institute) => {
    const newStatus = !institute.isActive;
    const action = newStatus ? "активировать" : "деактивировать";

    if (
      window.confirm(
        `${action.charAt(0).toUpperCase() + action.slice(1)} институт "${
          institute.name
        }"?`
      )
    ) {
      try {
        await updateInstituteMutation.mutateAsync({
          id: institute.$id,
          data: { isActive: newStatus },
        });

        toast.success(
          `✅ Институт "${institute.name}" ${
            newStatus ? "активирован" : "деактивирован"
          }`
        );
      } catch (error) {
        toast.error(
          `❌ Ошибка при изменении статуса: ${(error as Error).message}`
        );
      }
    }
  };

  const handleDeleteInstitute = async (institute: Institute) => {
    const directionsCount = getInstituteDirectionsCount(institute.$id);

    if (directionsCount > 0) {
      toast.error(
        `Нельзя удалить институт с направлениями (${directionsCount} направлений)`
      );
      return;
    }

    if (
      window.confirm(
        `Удалить институт "${institute.name}"? Это действие нельзя отменить.`
      )
    ) {
      try {
        await deleteInstituteMutation.mutateAsync(institute.$id);
        toast.success(`✅ Институт "${institute.name}" удален`);
      } catch (error) {
        toast.error(
          `❌ Ошибка при удалении института: ${(error as Error).message}`
        );
      }
    }
  };

  const handleEditClick = (institute: Institute) => {
    setEditingInstitute(institute);
    setFormData({
      name: institute.name,
      code: institute.code,
      description: institute.description || "",
    });
  };

  const resetForm = () => {
    setFormData({ name: "", code: "", description: "" });
    setEditingInstitute(null);
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
          <span className="ml-3 text-gray-600">Загрузка институтов...</span>
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
              <Building className="h-8 w-8 text-blue-500" />
              <h1 className="text-3xl font-bold text-gray-900">
                Управление институтами
              </h1>
            </div>
            <p className="text-gray-600">
              Создание и управление институтами в системе тестирования
            </p>
          </div>

          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Создать институт
          </button>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Building className="h-8 w-8 text-blue-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Всего институтов
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {instituteStats.total}
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
                {instituteStats.active}
              </p>
            </div>
          </div>
        </div>

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
                {allDirections.length}
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
                placeholder="Поиск по названию или коду..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-80 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Фильтр по статусу */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ALL">Все статусы</option>
              <option value="ACTIVE">Активные</option>
              <option value="INACTIVE">Неактивные</option>
            </select>
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

      {/* Список институтов */}
      <div className="bg-white rounded-lg shadow border">
        {filteredInstitutes.length === 0 ? (
          <div className="text-center py-12">
            <Building className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {institutes.length === 0
                ? "Нет институтов"
                : "Институты не найдены"}
            </h3>
            <p className="text-gray-500 mb-4">
              {institutes.length === 0
                ? "Создайте первый институт для начала работы"
                : "Попробуйте изменить параметры поиска"}
            </p>
            {institutes.length === 0 && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Создать институт
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-hidden">
            {/* Заголовок таблицы */}
            <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
              <div className="grid grid-cols-12 gap-4 items-center text-sm font-medium text-gray-900">
                <div className="col-span-4">Институт</div>
                <div className="col-span-2">Код</div>
                <div className="col-span-2">Направления</div>
                <div className="col-span-2">Статус</div>
                <div className="col-span-2">Действия</div>
              </div>
            </div>

            {/* Список институтов */}
            <div className="divide-y divide-gray-200">
              {filteredInstitutes.map((institute) => {
                const directionsCount = getInstituteDirectionsCount(
                  institute.$id
                );

                return (
                  <div
                    key={institute.$id}
                    className="px-6 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="grid grid-cols-12 gap-4 items-center">
                      {/* Название и описание */}
                      <div className="col-span-4">
                        <div>
                          <h3 className="text-sm font-medium text-gray-900 mb-1">
                            {institute.name}
                          </h3>
                          {institute.description && (
                            <p className="text-xs text-gray-500 line-clamp-2">
                              {institute.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                            <Calendar className="h-3 w-3" />
                            <span>
                              Создан {formatDate(institute.$createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Код */}
                      <div className="col-span-2">
                        <div className="flex items-center gap-1">
                          <Code className="h-3 w-3 text-gray-400" />
                          <span className="text-sm font-mono text-gray-900">
                            {institute.code}
                          </span>
                        </div>
                      </div>

                      {/* Направления */}
                      <div className="col-span-2">
                        <div className="flex items-center gap-1">
                          <GraduationCap className="h-3 w-3 text-purple-500" />
                          <span className="text-sm text-gray-900">
                            {directionsCount}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">направлений</p>
                      </div>

                      {/* Статус */}
                      <div className="col-span-2">
                        {institute.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                            <CheckCircle className="h-3 w-3" />
                            Активен
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                            <XCircle className="h-3 w-3" />
                            Неактивен
                          </span>
                        )}
                      </div>

                      {/* Действия */}
                      <div className="col-span-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              /* TODO: просмотр направлений института */
                            }}
                            className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                            title="Просмотреть направления"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => handleEditClick(institute)}
                            className="p-1 text-gray-600 hover:text-gray-800 transition-colors"
                            title="Редактировать"
                          >
                            <Edit className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => handleToggleStatus(institute)}
                            disabled={updateInstituteMutation.isPending}
                            className={`p-1 transition-colors ${
                              institute.isActive
                                ? "text-yellow-600 hover:text-yellow-800"
                                : "text-green-600 hover:text-green-800"
                            }`}
                            title={
                              institute.isActive
                                ? "Деактивировать"
                                : "Активировать"
                            }
                          >
                            {institute.isActive ? (
                              <XCircle className="h-4 w-4" />
                            ) : (
                              <CheckCircle className="h-4 w-4" />
                            )}
                          </button>

                          <button
                            onClick={() => handleDeleteInstitute(institute)}
                            disabled={
                              deleteInstituteMutation.isPending ||
                              directionsCount > 0
                            }
                            className="p-1 text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            title={
                              directionsCount > 0
                                ? "Нельзя удалить институт с направлениями"
                                : "Удалить"
                            }
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

      {/* Модальное окно создания/редактирования */}
      {(showCreateForm || editingInstitute) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingInstitute
                  ? "Редактировать институт"
                  : "Создать институт"}
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
                editingInstitute ? handleUpdateInstitute : handleCreateInstitute
              }
              className="space-y-4"
            >
              <div>
                <label
                  htmlFor="instituteName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Название института *
                </label>
                <input
                  id="instituteName"
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Введите название института"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="instituteCode"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Код института *
                </label>
                <input
                  id="instituteCode"
                  type="text"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      code: e.target.value.toUpperCase(),
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                  placeholder="Например: INST001"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  Уникальный код для идентификации института
                </p>
              </div>

              <div>
                <label
                  htmlFor="instituteDescription"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Описание
                </label>
                <textarea
                  id="instituteDescription"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Краткое описание института"
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
                    createInstituteMutation.isPending ||
                    updateInstituteMutation.isPending
                  }
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  <Save className="h-4 w-4" />
                  {editingInstitute ? "Сохранить" : "Создать"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Информационная панель */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-blue-900 mb-2">
              Управление институтами
            </h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>
                • Институты являются основной структурной единицей системы
              </li>
              <li>• К институтам привязываются направления подготовки</li>
              <li>
                • Кураторы назначаются на институты для управления тестами
              </li>
              <li>• Код института должен быть уникальным в системе</li>
              <li>
                • Нельзя удалить институт, если к нему привязаны направления
              </li>
              <li>
                • Неактивные институты скрыты при регистрации абитуриентов
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
