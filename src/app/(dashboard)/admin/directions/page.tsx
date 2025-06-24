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
      <div className="min-h-screen bg-slate-900 text-white">
        <div className="p-6 max-w-7xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent"></div>
            <span className="ml-3 text-slate-300 font-mono">ЗАГРУЗКА НАПРАВЛЕНИЙ...</span>
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
                <GraduationCap className="h-8 w-8 text-purple-400" />
                <h1 className="text-3xl font-mono font-bold text-white uppercase tracking-wide">
                  УПРАВЛЕНИЕ НАПРАВЛЕНИЯМИ
                </h1>
              </div>
              <p className="text-slate-300 font-mono">
                СОЗДАНИЕ И УПРАВЛЕНИЕ НАПРАВЛЕНИЯМИ ПОДГОТОВКИ
              </p>
            </div>

            <button
              onClick={() => setShowCreateForm(true)}
              disabled={institutes.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-purple-800 text-purple-200 border-2 border-purple-600 disabled:opacity-50 disabled:cursor-not-allowed font-mono font-bold uppercase"
            >
              <Plus className="h-4 w-4" />
              СОЗДАТЬ НАПРАВЛЕНИЕ
            </button>
          </div>
        </div>

        {/* Предупреждение если нет институтов */}
        {institutes.length === 0 && (
          <div className="mb-6 bg-yellow-900 border-2 border-yellow-600 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5" />
              <div>
                <h3 className="text-sm font-mono font-bold text-yellow-200 mb-1 uppercase">
                  НЕТ ДОСТУПНЫХ ИНСТИТУТОВ
                </h3>
                <p className="text-sm text-yellow-300 font-mono">
                  ДЛЯ СОЗДАНИЯ НАПРАВЛЕНИЙ СНАЧАЛА НЕОБХОДИМО СОЗДАТЬ ИНСТИТУТЫ.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Статистика */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
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
                  {directionStats.total}
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
                  {directionStats.active}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 border-2 border-slate-600 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Building className="h-8 w-8 text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-mono font-bold text-slate-300 uppercase">
                  ПОКРЫТЫХ ИНСТИТУТОВ
                </p>
                <p className="text-2xl font-mono font-bold text-white">
                  {new Set(directions.map((d) => d.instituteId)).size}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Статистика по институтам */}
        {directionsByInstitute.length > 0 && (
          <div className="mb-6 bg-slate-800 border-2 border-slate-600 p-6">
            <h3 className="text-lg font-mono font-bold text-white mb-4 flex items-center gap-2 uppercase">
              <Building className="h-5 w-5 text-blue-400" />
              РАСПРЕДЕЛЕНИЕ ПО ИНСТИТУТАМ
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {directionsByInstitute.map(
                ({ institute, directions: instDirections, activeDirections }) => (
                  <div key={institute.$id} className="bg-slate-700 border border-slate-600 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-mono font-bold text-white text-sm">
                        {institute.name}
                      </h4>
                      <span className="text-sm text-slate-300 font-mono">
                        {activeDirections}/{instDirections.length}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-mono mb-2">
                      КОД: {institute.code}
                    </p>
                    <div className="w-full bg-slate-600 h-2 border border-slate-500">
                      <div
                        className="bg-purple-500 h-full"
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
        <div className="bg-slate-800 border-2 border-slate-600 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            {/* Поиск */}
            <div>
              <label className="block text-sm font-mono font-bold text-slate-300 mb-1 uppercase">
                ПОИСК
              </label>
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="НАЗВАНИЕ, КОД, ИНСТИТУТ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border-2 border-slate-600 bg-slate-700 text-white font-mono placeholder-slate-400 uppercase"
                />
              </div>
            </div>

            {/* Фильтр по статусу */}
            <div>
              <label className="block text-sm font-mono font-bold text-slate-300 mb-1 uppercase">
                СТАТУС
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full px-3 py-2 border-2 border-slate-600 bg-slate-700 text-white font-mono"
              >
                <option value="ALL">ВСЕ СТАТУСЫ</option>
                <option value="ACTIVE">АКТИВНЫЕ</option>
                <option value="INACTIVE">НЕАКТИВНЫЕ</option>
              </select>
            </div>

            {/* Фильтр по институту */}
            <div>
              <label className="block text-sm font-mono font-bold text-slate-300 mb-1 uppercase">
                ИНСТИТУТ
              </label>
              <select
                value={instituteFilter}
                onChange={(e) => setInstituteFilter(e.target.value)}
                className="w-full px-3 py-2 border-2 border-slate-600 bg-slate-700 text-white font-mono"
              >
                <option value="ALL">ВСЕ ИНСТИТУТЫ</option>
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
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-slate-300 font-mono font-bold border border-slate-600 uppercase"
              >
                <RefreshCw className="h-4 w-4" />
                ОБНОВИТЬ
              </button>
            </div>
          </div>
        </div>

        {/* Список направлений */}
        <div className="bg-slate-800 border-2 border-slate-600">
          {filteredDirections.length === 0 ? (
            <div className="text-center py-12">
              <GraduationCap className="h-16 w-16 text-slate-500 mx-auto mb-4" />
              <h3 className="text-lg font-mono font-bold text-white mb-2 uppercase">
                {directions.length === 0
                  ? "НЕТ НАПРАВЛЕНИЙ"
                  : "НАПРАВЛЕНИЯ НЕ НАЙДЕНЫ"}
              </h3>
              <p className="text-slate-400 font-mono mb-4">
                {directions.length === 0
                  ? "СОЗДАЙТЕ ПЕРВОЕ НАПРАВЛЕНИЕ ПОДГОТОВКИ"
                  : "ПОПРОБУЙТЕ ИЗМЕНИТЬ ПАРАМЕТРЫ ПОИСКА"}
              </p>
              {directions.length === 0 && institutes.length > 0 && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-purple-800 text-purple-200 border-2 border-purple-600 font-mono font-bold uppercase"
                >
                  <Plus className="h-4 w-4" />
                  СОЗДАТЬ НАПРАВЛЕНИЕ
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-hidden">
              {/* Заголовок таблицы */}
              <div className="bg-slate-700 px-6 py-3 border-b-2 border-slate-600">
                <div className="grid grid-cols-12 gap-4 items-center text-sm font-mono font-bold text-white uppercase">
                  <div className="col-span-4">НАПРАВЛЕНИЕ</div>
                  <div className="col-span-2">КОД</div>
                  <div className="col-span-3">ИНСТИТУТ</div>
                  <div className="col-span-1">СТАТУС</div>
                  <div className="col-span-2">ДЕЙСТВИЯ</div>
                </div>
              </div>

              {/* Список направлений */}
              <div className="divide-y-2 divide-slate-700">
                {filteredDirections.map((direction) => (
                  <div
                    key={direction.$id}
                    className="px-6 py-4 bg-slate-800"
                  >
                    <div className="grid grid-cols-12 gap-4 items-center">
                      {/* Название и описание */}
                      <div className="col-span-4">
                        <div>
                          <h3 className="text-sm font-mono font-bold text-white mb-1">
                            {direction.name}
                          </h3>
                          {direction.description && (
                            <p className="text-xs text-slate-400 font-mono line-clamp-2">
                              {direction.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2 text-xs text-slate-500 font-mono">
                            <Calendar className="h-3 w-3" />
                            <span>
                              СОЗДАНО {formatDate(direction.$createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Код */}
                      <div className="col-span-2">
                        <div className="flex items-center gap-1">
                          <Code className="h-3 w-3 text-slate-400" />
                          <span className="text-sm font-mono font-bold text-white">
                            {direction.code}
                          </span>
                        </div>
                      </div>

                      {/* Институт */}
                      <div className="col-span-3">
                        <div className="flex items-center gap-1">
                          <Building className="h-3 w-3 text-blue-400" />
                          <span className="text-sm font-mono text-white">
                            {direction.institute?.name || "НЕ НАЙДЕН"}
                          </span>
                        </div>
                        {direction.institute?.code && (
                          <p className="text-xs text-slate-400 font-mono mt-1">
                            КОД: {direction.institute.code}
                          </p>
                        )}
                      </div>

                      {/* Статус */}
                      <div className="col-span-1">
                        {direction.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-mono font-bold bg-green-800 text-green-200 border border-green-600 uppercase">
                            <CheckCircle className="h-3 w-3" />
                            АКТИВНО
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-mono font-bold bg-gray-800 text-gray-200 border border-gray-600 uppercase">
                            <XCircle className="h-3 w-3" />
                            НЕАКТИВНО
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
                            className="p-1 text-indigo-400 border border-indigo-600 bg-indigo-900"
                            title="ПРОСМОТРЕТЬ ТЕСТЫ"
                          >
                            <TestTube className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => {
                              /* TODO: просмотр абитуриентов */
                            }}
                            className="p-1 text-green-400 border border-green-600 bg-green-900"
                            title="ПРОСМОТРЕТЬ АБИТУРИЕНТОВ"
                          >
                            <Users className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => handleEditClick(direction)}
                            className="p-1 text-gray-400 border border-gray-600 bg-gray-900"
                            title="РЕДАКТИРОВАТЬ"
                          >
                            <Edit className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => handleToggleStatus(direction)}
                            disabled={updateDirectionMutation.isPending}
                            className={`p-1 border disabled:opacity-50 ${
                              direction.isActive
                                ? "text-yellow-400 border-yellow-600 bg-yellow-900"
                                : "text-green-400 border-green-600 bg-green-900"
                            }`}
                            title={
                              direction.isActive
                                ? "ДЕАКТИВИРОВАТЬ"
                                : "АКТИВИРОВАТЬ"
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
                            className="p-1 text-red-400 border border-red-600 bg-red-900 disabled:opacity-50"
                            title="УДАЛИТЬ"
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
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-slate-800 border-2 border-slate-600 p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-mono font-bold text-white uppercase">
                  {editingDirection
                    ? "РЕДАКТИРОВАТЬ НАПРАВЛЕНИЕ"
                    : "СОЗДАТЬ НАПРАВЛЕНИЕ"}
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
                  editingDirection ? handleUpdateDirection : handleCreateDirection
                }
                className="space-y-4"
              >
                <div>
                  <label
                    htmlFor="directionName"
                    className="block text-sm font-mono font-bold text-slate-300 mb-1 uppercase"
                  >
                    НАЗВАНИЕ НАПРАВЛЕНИЯ *
                  </label>
                  <input
                    id="directionName"
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className="w-full px-3 py-2 border-2 border-slate-600 bg-slate-700 text-white font-mono placeholder-slate-400"
                    placeholder="ВВЕДИТЕ НАЗВАНИЕ НАПРАВЛЕНИЯ"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="directionCode"
                    className="block text-sm font-mono font-bold text-slate-300 mb-1 uppercase"
                  >
                    КОД НАПРАВЛЕНИЯ *
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
                    className="w-full px-3 py-2 border-2 border-slate-600 bg-slate-700 text-white font-mono placeholder-slate-400"
                    placeholder="НАПРИМЕР: 09.03.01"
                    required
                  />
                  <p className="mt-1 text-xs text-slate-400 font-mono">
                    КОД ФГОС ИЛИ ВНУТРЕННИЙ КОД НАПРАВЛЕНИЯ
                  </p>
                </div>

                {!editingDirection && (
                  <div>
                    <label
                      htmlFor="instituteSelect"
                      className="block text-sm font-mono font-bold text-slate-300 mb-1 uppercase"
                    >
                      ИНСТИТУТ *
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
                )}

                <div>
                  <label
                    htmlFor="directionDescription"
                    className="block text-sm font-mono font-bold text-slate-300 mb-1 uppercase"
                  >
                    ОПИСАНИЕ
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
                    className="w-full px-3 py-2 border-2 border-slate-600 bg-slate-700 text-white font-mono placeholder-slate-400"
                    placeholder="КРАТКОЕ ОПИСАНИЕ НАПРАВЛЕНИЯ ПОДГОТОВКИ"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 px-4 py-2 text-slate-300 bg-slate-700 border-2 border-slate-600 font-mono font-bold uppercase"
                  >
                    ОТМЕНА
                  </button>
                  <button
                    type="submit"
                    disabled={
                      createDirectionMutation.isPending ||
                      updateDirectionMutation.isPending
                    }
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-purple-200 bg-purple-800 border-2 border-purple-600 disabled:opacity-50 font-mono font-bold uppercase"
                  >
                    <Save className="h-4 w-4" />
                    {editingDirection ? "СОХРАНИТЬ" : "СОЗДАТЬ"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Информационная панель */}
        <div className="mt-6 bg-purple-900 border-2 border-purple-600 p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-purple-400 mt-0.5" />
            <div>
              <h3 className="text-sm font-mono font-bold text-purple-200 mb-2 uppercase">
                УПРАВЛЕНИЕ НАПРАВЛЕНИЯМИ ПОДГОТОВКИ
              </h3>
              <ul className="text-sm text-purple-300 font-mono space-y-1">
                <li>
                  • НАПРАВЛЕНИЯ ПРИВЯЗЫВАЮТСЯ К ИНСТИТУТАМ И ОПРЕДЕЛЯЮТ СПЕЦИАЛИЗАЦИЮ
                </li>
                <li>• АБИТУРИЕНТЫ РЕГИСТРИРУЮТСЯ НА КОНКРЕТНЫЕ НАПРАВЛЕНИЯ</li>
                <li>• ТЕСТЫ СОЗДАЮТСЯ КУРАТОРАМИ ДЛЯ ОПРЕДЕЛЕННЫХ НАПРАВЛЕНИЙ</li>
                <li>
                  • КОД НАПРАВЛЕНИЯ МОЖЕТ БЫТЬ КОДОМ ФГОС ИЛИ ВНУТРЕННИМ КОДОМ
                </li>
                <li>
                  • НЕАКТИВНЫЕ НАПРАВЛЕНИЯ СКРЫТЫ ПРИ РЕГИСТРАЦИИ АБИТУРИЕНТОВ
                </li>
                <li>• НЕЛЬЗЯ ИЗМЕНИТЬ ИНСТИТУТ У СУЩЕСТВУЮЩЕГО НАПРАВЛЕНИЯ</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}