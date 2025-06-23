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
      <div className="min-h-screen bg-slate-900 text-white">
        <div className="p-6 max-w-7xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="border-2 border-blue-400 border-t-transparent w-8 h-8"></div>
            <span className="ml-3 font-mono text-slate-300 uppercase">ЗАГРУЗКА ИНСТИТУТОВ...</span>
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
                <Building className="h-8 w-8 text-blue-400" />
                <h1 className="text-3xl font-mono font-bold text-white uppercase tracking-wide">
                  УПРАВЛЕНИЕ ИНСТИТУТАМИ
                </h1>
              </div>
              <p className="text-slate-300 font-mono">
                СОЗДАНИЕ И УПРАВЛЕНИЕ ИНСТИТУТАМИ В СИСТЕМЕ ТЕСТИРОВАНИЯ
              </p>
            </div>

            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-700 text-white border-2 border-blue-500 font-mono font-bold uppercase"
            >
              <Plus className="h-4 w-4" />
              СОЗДАТЬ ИНСТИТУТ
            </button>
          </div>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-800 border-2 border-slate-600 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Building className="h-8 w-8 text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-mono font-bold text-slate-300 uppercase">
                  ВСЕГО ИНСТИТУТОВ
                </p>
                <p className="text-2xl font-mono font-bold text-white">
                  {instituteStats.total}
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
                  {instituteStats.active}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 border-2 border-slate-600 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <GraduationCap className="h-8 w-8 text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-mono font-bold text-slate-300 uppercase">
                  ВСЕГО НАПРАВЛЕНИЙ
                </p>
                <p className="text-2xl font-mono font-bold text-white">
                  {allDirections.length}
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
                <label className="block text-sm font-mono font-bold text-slate-300 uppercase mb-1">
                  ПОИСК
                </label>
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="ПОИСК ПО НАЗВАНИЮ ИЛИ КОДУ..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 w-80 border-2 border-slate-600 bg-slate-700 text-white font-mono placeholder-slate-400 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Фильтр по статусу */}
              <div>
                <label className="block text-sm font-mono font-bold text-slate-300 uppercase mb-1">
                  СТАТУС
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-3 py-2 border-2 border-slate-600 bg-slate-700 text-white font-mono focus:border-blue-500"
                >
                  <option value="ALL">ВСЕ СТАТУСЫ</option>
                  <option value="ACTIVE">АКТИВНЫЕ</option>
                  <option value="INACTIVE">НЕАКТИВНЫЕ</option>
                </select>
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

        {/* Список институтов */}
        <div className="bg-slate-800 border-2 border-slate-600">
          {filteredInstitutes.length === 0 ? (
            <div className="text-center py-12">
              <Building className="h-16 w-16 text-slate-500 mx-auto mb-4" />
              <h3 className="text-lg font-mono font-bold text-white mb-2 uppercase">
                {institutes.length === 0
                  ? "НЕТ ИНСТИТУТОВ"
                  : "ИНСТИТУТЫ НЕ НАЙДЕНЫ"}
              </h3>
              <p className="text-slate-400 font-mono mb-4">
                {institutes.length === 0
                  ? "Создайте первый институт для начала работы"
                  : "Попробуйте изменить параметры поиска"}
              </p>
              {institutes.length === 0 && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 text-white border-2 border-blue-500 font-mono font-bold uppercase"
                >
                  <Plus className="h-4 w-4" />
                  СОЗДАТЬ ИНСТИТУТ
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-hidden">
              {/* Заголовок таблицы */}
              <div className="bg-slate-700 px-6 py-3 border-b-2 border-slate-600">
                <div className="grid grid-cols-12 gap-4 items-center text-sm font-mono font-bold text-white uppercase">
                  <div className="col-span-4">ИНСТИТУТ</div>
                  <div className="col-span-2">КОД</div>
                  <div className="col-span-2">НАПРАВЛЕНИЯ</div>
                  <div className="col-span-2">СТАТУС</div>
                  <div className="col-span-2">ДЕЙСТВИЯ</div>
                </div>
              </div>

              {/* Список институтов */}
              <div className="divide-y-2 divide-slate-600">
                {filteredInstitutes.map((institute) => {
                  const directionsCount = getInstituteDirectionsCount(
                    institute.$id
                  );

                  return (
                    <div
                      key={institute.$id}
                      className="px-6 py-4 bg-slate-800"
                    >
                      <div className="grid grid-cols-12 gap-4 items-center">
                        {/* Название и описание */}
                        <div className="col-span-4">
                          <div>
                            <h3 className="text-sm font-mono font-bold text-white mb-1">
                              {institute.name}
                            </h3>
                            {institute.description && (
                              <p className="text-xs text-slate-400 font-mono line-clamp-2">
                                {institute.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-2 text-xs text-slate-500 font-mono">
                              <Calendar className="h-3 w-3" />
                              <span>
                                СОЗДАН {formatDate(institute.$createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Код */}
                        <div className="col-span-2">
                          <div className="flex items-center gap-1">
                            <Code className="h-3 w-3 text-slate-400" />
                            <span className="text-sm font-mono font-bold text-white border border-slate-600 px-2 py-1">
                              {institute.code}
                            </span>
                          </div>
                        </div>

                        {/* Направления */}
                        <div className="col-span-2">
                          <div className="flex items-center gap-1">
                            <GraduationCap className="h-3 w-3 text-purple-400" />
                            <span className="text-sm font-mono font-bold text-white">
                              {directionsCount}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 font-mono uppercase">
                            НАПРАВЛЕНИЙ
                          </p>
                        </div>

                        {/* Статус */}
                        <div className="col-span-2">
                          {institute.isActive ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-mono font-bold bg-green-800 text-green-200 border border-green-600 uppercase">
                              <CheckCircle className="h-3 w-3" />
                              АКТИВЕН
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-mono font-bold bg-gray-800 text-gray-200 border border-gray-600 uppercase">
                              <XCircle className="h-3 w-3" />
                              НЕАКТИВЕН
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
                              className="p-1 text-blue-400 border border-blue-600 bg-blue-900"
                              title="Просмотреть направления"
                            >
                              <Eye className="h-4 w-4" />
                            </button>

                            <button
                              onClick={() => handleEditClick(institute)}
                              className="p-1 text-slate-300 border border-slate-600 bg-slate-700"
                              title="Редактировать"
                            >
                              <Edit className="h-4 w-4" />
                            </button>

                            <button
                              onClick={() => handleToggleStatus(institute)}
                              disabled={updateInstituteMutation.isPending}
                              className={`p-1 border-2 ${
                                institute.isActive
                                  ? "text-yellow-400 border-yellow-600 bg-yellow-900"
                                  : "text-green-400 border-green-600 bg-green-900"
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
                              className="p-1 text-red-400 border border-red-600 bg-red-900 disabled:opacity-50"
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
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-slate-800 border-2 border-slate-600 p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-4 border-b border-slate-600 pb-4">
                <h3 className="text-lg font-mono font-bold text-white uppercase">
                  {editingInstitute
                    ? "РЕДАКТИРОВАТЬ ИНСТИТУТ"
                    : "СОЗДАТЬ ИНСТИТУТ"}
                </h3>
                <button
                  onClick={resetForm}
                  className="text-slate-400 border border-slate-600 p-1"
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
                    className="block text-sm font-mono font-bold text-slate-300 mb-1 uppercase"
                  >
                    НАЗВАНИЕ ИНСТИТУТА *
                  </label>
                  <input
                    id="instituteName"
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className="w-full px-3 py-2 border-2 border-slate-600 bg-slate-700 text-white font-mono placeholder-slate-400 focus:border-blue-500"
                    placeholder="ВВЕДИТЕ НАЗВАНИЕ ИНСТИТУТА"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="instituteCode"
                    className="block text-sm font-mono font-bold text-slate-300 mb-1 uppercase"
                  >
                    КОД ИНСТИТУТА *
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
                    className="w-full px-3 py-2 border-2 border-slate-600 bg-slate-700 text-white font-mono placeholder-slate-400 focus:border-blue-500"
                    placeholder="НАПРИМЕР: INST001"
                    required
                  />
                  <p className="mt-1 text-xs text-slate-400 font-mono uppercase">
                    УНИКАЛЬНЫЙ КОД ДЛЯ ИДЕНТИФИКАЦИИ ИНСТИТУТА
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="instituteDescription"
                    className="block text-sm font-mono font-bold text-slate-300 mb-1 uppercase"
                  >
                    ОПИСАНИЕ
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
                    className="w-full px-3 py-2 border-2 border-slate-600 bg-slate-700 text-white font-mono placeholder-slate-400 focus:border-blue-500"
                    placeholder="КРАТКОЕ ОПИСАНИЕ ИНСТИТУТА"
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-600">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 px-4 py-2 text-slate-300 bg-slate-700 border border-slate-600 font-mono font-bold uppercase"
                  >
                    ОТМЕНА
                  </button>
                  <button
                    type="submit"
                    disabled={
                      createInstituteMutation.isPending ||
                      updateInstituteMutation.isPending
                    }
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-white bg-blue-700 border-2 border-blue-500 font-mono font-bold uppercase disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    {editingInstitute ? "СОХРАНИТЬ" : "СОЗДАТЬ"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Информационная панель */}
        <div className="mt-6 bg-slate-800 border-2 border-slate-600 p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-blue-400 mt-0.5" />
            <div>
              <h3 className="text-sm font-mono font-bold text-white mb-2 uppercase">
                УПРАВЛЕНИЕ ИНСТИТУТАМИ
              </h3>
              <ul className="text-sm text-slate-300 font-mono space-y-1">
                <li>
                  • ИНСТИТУТЫ ЯВЛЯЮТСЯ ОСНОВНОЙ СТРУКТУРНОЙ ЕДИНИЦЕЙ СИСТЕМЫ
                </li>
                <li>• К ИНСТИТУТАМ ПРИВЯЗЫВАЮТСЯ НАПРАВЛЕНИЯ ПОДГОТОВКИ</li>
                <li>
                  • КУРАТОРЫ НАЗНАЧАЮТСЯ НА ИНСТИТУТЫ ДЛЯ УПРАВЛЕНИЯ ТЕСТАМИ
                </li>
                <li>• КОД ИНСТИТУТА ДОЛЖЕН БЫТЬ УНИКАЛЬНЫМ В СИСТЕМЕ</li>
                <li>
                  • НЕЛЬЗЯ УДАЛИТЬ ИНСТИТУТ, ЕСЛИ К НЕМУ ПРИВЯЗАНЫ НАПРАВЛЕНИЯ
                </li>
                <li>
                  • НЕАКТИВНЫЕ ИНСТИТУТЫ СКРЫТЫ ПРИ РЕГИСТРАЦИИ АБИТУРИЕНТОВ
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}