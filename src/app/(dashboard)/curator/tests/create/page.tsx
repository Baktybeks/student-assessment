// src/app/(dashboard)/curator/tests/create/page.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useCreateTest } from "@/services/testService";
import { useActiveDirections } from "@/services/instituteService";
import { CreateTestDto } from "@/types";
import { toast } from "react-toastify";
import {
  TestTube,
  Save,
  ArrowLeft,
  Clock,
  Target,
  FileText,
  AlertTriangle,
  CheckCircle,
  GraduationCap,
  Building,
  Info,
  Lightbulb,
} from "lucide-react";

export default function CreateTestPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: allDirections = [] } = useActiveDirections();
  const createTestMutation = useCreateTest();

  // Фильтруем направления по институтам куратора
  // TODO: Когда будет готов сервис назначений кураторов,
  // заменить на реальную фильтрацию по назначенным институтам
  const curatorDirections = allDirections; // Пока показываем все направления

  const [formData, setFormData] = useState<CreateTestDto>({
    title: "",
    description: "",
    directionId: "",
    timeLimit: 60, // По умолчанию 60 минут
    passingScore: 60, // По умолчанию 60%
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.title.trim()) {
      newErrors.title = "Название теста обязательно";
    } else if (formData.title.length < 3) {
      newErrors.title = "Название должно содержать минимум 3 символа";
    }

    if (!formData.directionId) {
      newErrors.directionId = "Выберите направление подготовки";
    }

    if (
      formData.timeLimit &&
      (formData.timeLimit < 5 || formData.timeLimit > 300)
    ) {
      newErrors.timeLimit = "Время должно быть от 5 до 300 минут";
    }

    if (
      (formData.passingScore ?? 60) < 1 ||
      (formData.passingScore ?? 60) > 100
    ) {
      newErrors.passingScore = "Проходной балл должен быть от 1 до 100%";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Исправьте ошибки в форме");
      return;
    }

    if (!user) {
      toast.error("Ошибка аутентификации");
      return;
    }

    try {
      const test = await createTestMutation.mutateAsync({
        data: formData,
        curatorId: user.$id,
      });

      toast.success(`✅ Тест "${formData.title}" успешно создан`);
      router.push(`/curator/tests/${test.$id}/edit`);
    } catch (error) {
      toast.error(`❌ Ошибка при создании теста: ${(error as Error).message}`);
    }
  };

  const handleInputChange = (
    field: keyof CreateTestDto,
    value: string | number | undefined
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Очищаем ошибку для этого поля
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const selectedDirection = curatorDirections.find(
    (d) => d.$id === formData.directionId
  );

  if (!user) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
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

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Заголовок */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => router.back()}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div>
            <div className="flex items-center gap-3 mb-2">
              <TestTube className="h-8 w-8 text-blue-500" />
              <h1 className="text-3xl font-bold text-gray-900">
                Создание нового теста
              </h1>
            </div>
            <p className="text-gray-600">
              Создайте тест для абитуриентов по выбранному направлению
              подготовки
            </p>
          </div>
        </div>
      </div>

      {/* Предупреждение если нет направлений */}
      {curatorDirections.length === 0 && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-yellow-900 mb-1">
                Нет доступных направлений
              </h3>
              <p className="text-sm text-yellow-800">
                У вас нет назначений на институты. Обратитесь к администратору
                для получения доступа к созданию тестов.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Форма создания теста */}
      <div className="bg-white rounded-lg shadow border p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Основная информация */}
          <div className="space-y-6">
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Основная информация
              </h3>
              <p className="text-sm text-gray-600">
                Укажите название, описание и направление для теста
              </p>
            </div>

            {/* Название теста */}
            <div>
              <label
                htmlFor="testTitle"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Название теста *
              </label>
              <input
                id="testTitle"
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                className={`w-full px-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  errors.title ? "border-red-300" : "border-gray-300"
                }`}
                placeholder="Например: Математика - Алгебра и геометрия"
                maxLength={100}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Краткое и понятное название теста для абитуриентов
              </p>
            </div>

            {/* Направление подготовки */}
            <div>
              <label
                htmlFor="direction"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Направление подготовки *
              </label>
              <select
                id="direction"
                value={formData.directionId}
                onChange={(e) =>
                  handleInputChange("directionId", e.target.value)
                }
                className={`w-full px-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  errors.directionId ? "border-red-300" : "border-gray-300"
                }`}
                disabled={curatorDirections.length === 0}
              >
                <option value="">Выберите направление подготовки</option>
                {curatorDirections.map((direction) => (
                  <option key={direction.$id} value={direction.$id}>
                    {direction.name} ({direction.institute?.name})
                  </option>
                ))}
              </select>
              {errors.directionId && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.directionId}
                </p>
              )}

              {selectedDirection && (
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="text-blue-900 font-medium">
                        <GraduationCap className="h-4 w-4 inline mr-1" />
                        {selectedDirection.name}
                      </p>
                      <p className="text-blue-700 mt-1">
                        <Building className="h-4 w-4 inline mr-1" />
                        {selectedDirection.institute?.name}
                      </p>
                      {selectedDirection.description && (
                        <p className="text-blue-600 mt-1 text-xs">
                          {selectedDirection.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Описание теста */}
            <div>
              <label
                htmlFor="testDescription"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Описание теста
              </label>
              <textarea
                id="testDescription"
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                rows={4}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Опишите содержание теста, темы, которые будут затронуты..."
                maxLength={500}
              />
              <p className="mt-1 text-xs text-gray-500">
                Необязательное поле. Краткое описание поможет абитуриентам
                понять содержание теста
              </p>
            </div>
          </div>

          {/* Настройки тестирования */}
          <div className="space-y-6">
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Настройки тестирования
              </h3>
              <p className="text-sm text-gray-600">
                Настройте параметры прохождения теста
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Время на прохождение */}
              <div>
                <label
                  htmlFor="timeLimit"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  <Clock className="h-4 w-4 inline mr-1" />
                  Время на прохождение (минуты)
                </label>
                <input
                  id="timeLimit"
                  type="number"
                  value={formData.timeLimit || ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    handleInputChange(
                      "timeLimit",
                      value ? parseInt(value) : undefined
                    );
                  }}
                  className={`w-full px-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    errors.timeLimit ? "border-red-300" : "border-gray-300"
                  }`}
                  placeholder="60"
                  min="5"
                  max="300"
                />
                {errors.timeLimit && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.timeLimit}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Оставьте пустым для неограниченного времени. Рекомендуется:
                  1-2 минуты на вопрос
                </p>
              </div>

              {/* Проходной балл */}
              <div>
                <label
                  htmlFor="passingScore"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  <Target className="h-4 w-4 inline mr-1" />
                  Проходной балл (%)
                </label>
                <input
                  id="passingScore"
                  type="number"
                  value={formData.passingScore ?? 60}
                  onChange={(e) =>
                    handleInputChange("passingScore", parseInt(e.target.value))
                  }
                  className={`w-full px-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    errors.passingScore ? "border-red-300" : "border-gray-300"
                  }`}
                  min="1"
                  max="100"
                />
                {errors.passingScore && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.passingScore}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Минимальный процент правильных ответов для успешного
                  прохождения
                </p>
              </div>
            </div>
          </div>

          {/* Информация об оценивании */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Info className="h-4 w-4" />
              Шкала оценивания
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="text-center p-2 bg-red-100 rounded">
                <div className="font-bold text-red-800">0-60%</div>
                <div className="text-red-600">Неудовлетворительно</div>
              </div>
              <div className="text-center p-2 bg-yellow-100 rounded">
                <div className="font-bold text-yellow-800">61-73%</div>
                <div className="text-yellow-600">Удовлетворительно</div>
              </div>
              <div className="text-center p-2 bg-blue-100 rounded">
                <div className="font-bold text-blue-800">74-86%</div>
                <div className="text-blue-600">Хорошо</div>
              </div>
              <div className="text-center p-2 bg-green-100 rounded">
                <div className="font-bold text-green-800">87-100%</div>
                <div className="text-green-600">Отлично</div>
              </div>
            </div>
          </div>

          {/* Кнопки действий */}
          <div className="flex gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-6 py-3 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Отмена
            </button>

            <button
              type="submit"
              disabled={
                createTestMutation.isPending || curatorDirections.length === 0
              }
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {createTestMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Создание...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Создать тест
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Подсказки для куратора */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-blue-900 mb-2">
              Советы по созданию эффективных тестов
            </h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>
                • Используйте понятные и однозначные формулировки вопросов
              </li>
              <li>
                • Каждый вопрос должен иметь только один правильный ответ из 4
                вариантов
              </li>
              <li>
                • Устанавливайте реалистичное время: обычно 1-2 минуты на вопрос
              </li>
              <li>• Проходной балл 60% подходит для большинства тестов</li>
              <li>
                • После создания добавьте вопросы и опубликуйте тест для
                абитуриентов
              </li>
              <li>• Можете импортировать готовые вопросы из Excel файла</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
