// src/app/(dashboard)/curator/tests/create/page.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useCreateTest, useCreateQuestion } from "@/services/testService";
import { useActiveDirections } from "@/services/instituteService";
import { CreateTestDto, CreateQuestionDto, QuestionOption } from "@/types";
import { toast } from "react-toastify";
import {
  TestTube,
  ArrowLeft,
  Save,
  Clock,
  Target,
  BookOpen,
  FileText,
  AlertTriangle,
  Building,
  GraduationCap,
  Info,
  Plus,
  X,
  HelpCircle,
  Check,
  Edit,
  Trash2,
} from "lucide-react";

interface FormData {
  title: string;
  description: string;
  directionId: string;
  timeLimit: string;
  passingScore: string;
}

interface QuestionFormData {
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: QuestionOption;
  points: string;
}

interface FormErrors {
  title?: string;
  directionId?: string;
  timeLimit?: string;
  passingScore?: string;
}

interface QuestionErrors {
  questionText?: string;
  optionA?: string;
  optionB?: string;
  optionC?: string;
  optionD?: string;
  correctAnswer?: string;
  points?: string;
}

export default function CreateTestPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  // Получаем данные
  const { data: directions = [], isLoading: directionsLoading } = useActiveDirections();
  const createTestMutation = useCreateTest();
  const createQuestionMutation = useCreateQuestion();

  // Состояние основной формы
  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    directionId: "",
    timeLimit: "",
    passingScore: "60",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Состояние модального окна и вопросов
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [createdTestId, setCreatedTestId] = useState<string | null>(null);
  const [createdTestTitle, setCreatedTestTitle] = useState<string>("");
  const [questions, setQuestions] = useState<Array<CreateQuestionDto & { id: string }>>([]);
  
  // Состояние формы вопроса
  const [questionForm, setQuestionForm] = useState<QuestionFormData>({
    questionText: "",
    optionA: "",
    optionB: "",
    optionC: "",
    optionD: "",
    correctAnswer: "A",
    points: "1",
  });

  const [questionErrors, setQuestionErrors] = useState<QuestionErrors>({});
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);

  // Валидация основной формы
  const validateField = (name: string, value: string): string | undefined => {
    switch (name) {
      case "title":
        if (!value.trim()) return "Название теста обязательно";
        if (value.trim().length < 3) return "Название должно содержать минимум 3 символа";
        if (value.trim().length > 200) return "Название слишком длинное (максимум 200 символов)";
        break;
      
      case "directionId":
        if (!value) return "Выберите направление подготовки";
        break;
      
      case "timeLimit":
        if (value && (isNaN(Number(value)) || Number(value) < 1 || Number(value) > 480)) {
          return "Время должно быть от 1 до 480 минут";
        }
        break;
      
      case "passingScore":
        const score = Number(value);
        if (isNaN(score) || score < 1 || score > 100) {
          return "Проходной балл должен быть от 1 до 100";
        }
        break;
    }
    return undefined;
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    Object.keys(formData).forEach((key) => {
      const error = validateField(key, formData[key as keyof FormData]);
      if (error) {
        newErrors[key as keyof FormErrors] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Валидация формы вопроса
  const validateQuestion = (): boolean => {
    const newErrors: QuestionErrors = {};

    if (!questionForm.questionText.trim()) {
      newErrors.questionText = "Текст вопроса обязателен";
    }
    
    if (!questionForm.optionA.trim()) newErrors.optionA = "Вариант A обязателен";
    if (!questionForm.optionB.trim()) newErrors.optionB = "Вариант B обязателен";
    if (!questionForm.optionC.trim()) newErrors.optionC = "Вариант C обязателен";
    if (!questionForm.optionD.trim()) newErrors.optionD = "Вариант D обязателен";

    const points = Number(questionForm.points);
    if (isNaN(points) || points < 1 || points > 10) {
      newErrors.points = "Баллы должны быть от 1 до 10";
    }

    setQuestionErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Обработчики основной формы
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setTouched(prev => ({ ...prev, [name]: true }));
    
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  // Обработчики формы вопроса
  const handleQuestionChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setQuestionForm(prev => ({ ...prev, [name]: value }));
    
    // Очищаем ошибку при изменении
    if (questionErrors[name as keyof QuestionErrors]) {
      setQuestionErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const resetQuestionForm = () => {
    setQuestionForm({
      questionText: "",
      optionA: "",
      optionB: "",
      optionC: "",
      optionD: "",
      correctAnswer: "A",
      points: "1",
    });
    setQuestionErrors({});
    setEditingQuestionId(null);
  };

  const handleAddQuestion = () => {
    if (!validateQuestion()) return;

    const newQuestion = {
      id: editingQuestionId || `temp-${Date.now()}`,
      testId: createdTestId!,
      questionText: questionForm.questionText.trim(),
      optionA: questionForm.optionA.trim(),
      optionB: questionForm.optionB.trim(),
      optionC: questionForm.optionC.trim(),
      optionD: questionForm.optionD.trim(),
      correctAnswer: questionForm.correctAnswer,
      points: Number(questionForm.points),
    };

    if (editingQuestionId) {
      setQuestions(prev => prev.map(q => q.id === editingQuestionId ? newQuestion : q));
      toast.success("Вопрос обновлен");
    } else {
      setQuestions(prev => [...prev, newQuestion]);
      toast.success("Вопрос добавлен");
    }

    resetQuestionForm();
  };

  const handleEditQuestion = (question: CreateQuestionDto & { id: string }) => {
    setQuestionForm({
      questionText: question.questionText,
      optionA: question.optionA,
      optionB: question.optionB,
      optionC: question.optionC,
      optionD: question.optionD,
      correctAnswer: question.correctAnswer,
      points: question.points?.toString() || "1",
    });
    setEditingQuestionId(question.id);
  };

  const handleDeleteQuestion = (questionId: string) => {
    setQuestions(prev => prev.filter(q => q.id !== questionId));
    if (editingQuestionId === questionId) {
      resetQuestionForm();
    }
    toast.success("Вопрос удален");
  };

  // Создание теста
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("Ошибка авторизации");
      return;
    }

    const allTouched = Object.keys(formData).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {} as Record<string, boolean>);
    setTouched(allTouched);

    if (!validateForm()) {
      toast.error("Пожалуйста, исправьте ошибки в форме");
      return;
    }

    try {
      const testData: CreateTestDto = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        directionId: formData.directionId,
        timeLimit: formData.timeLimit ? Number(formData.timeLimit) : undefined,
        passingScore: Number(formData.passingScore),
      };

      const newTest = await createTestMutation.mutateAsync({
        data: testData,
        curatorId: user.$id,
      });

      setCreatedTestId(newTest.$id);
      setCreatedTestTitle(newTest.title);
      setIsModalOpen(true);
      
      toast.success(`Тест "${newTest.title}" создан! Добавьте вопросы.`);
    } catch (error) {
      toast.error(`Ошибка при создании теста: ${(error as Error).message}`);
    }
  };

  // Сохранение вопросов и завершение
  const handleSaveQuestions = async () => {
    if (questions.length === 0) {
      toast.warning("Добавьте хотя бы один вопрос");
      return;
    }

    try {
      for (const question of questions) {
        if (!question.id.startsWith('saved-')) {
          await createQuestionMutation.mutateAsync({
            testId: question.testId,
            questionText: question.questionText,
            optionA: question.optionA,
            optionB: question.optionB,
            optionC: question.optionC,
            optionD: question.optionD,
            correctAnswer: question.correctAnswer,
            points: question.points,
          });
        }
      }

      toast.success(`Тест "${createdTestTitle}" создан с ${questions.length} вопросами!`);
      router.push("/curator/tests");
    } catch (error) {
      toast.error(`Ошибка при сохранении вопросов: ${(error as Error).message}`);
    }
  };

  const handleCancel = () => {
    const hasChanges = Object.values(formData).some(value => value.trim() !== "");
    
    if (hasChanges) {
      if (window.confirm("Вы уверены, что хотите отменить создание теста? Все введенные данные будут потеряны.")) {
        router.push("/curator/tests");
      }
    } else {
      router.push("/curator/tests");
    }
  };

  const selectedDirection = directions.find(d => d.$id === formData.directionId);

  if (!user) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Ошибка доступа</h2>
          <p className="text-gray-600">Пользователь не авторизован</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-6 max-w-4xl mx-auto">
        {/* Хлебные крошки */}
        <div className="mb-6">
          <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
            <button
              onClick={() => router.push("/curator/tests")}
              className="hover:text-blue-600 transition-colors"
            >
              Мои тесты
            </button>
            <span>/</span>
            <span className="text-gray-900">Создание теста</span>
          </nav>

          <div className="flex items-center gap-3 mb-2">
            <TestTube className="h-8 w-8 text-blue-500" />
            <h1 className="text-3xl font-bold text-gray-900">Создание нового теста</h1>
          </div>
          <p className="text-gray-600">
            Заполните основную информацию о тесте. После создания вы сможете добавить вопросы.
          </p>
        </div>

        {/* Форма создания */}
        <div className="bg-white rounded-lg shadow border">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Основная информация */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-500" />
                Основная информация
              </h3>

              <div className="space-y-4">
                {/* Название теста */}
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                    Название теста <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Введите название теста"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.title ? "border-red-300" : "border-gray-300"
                    }`}
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                  )}
                </div>

                {/* Описание */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Описание теста
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    rows={3}
                    placeholder="Краткое описание содержания и целей теста"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Направление подготовки */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-blue-500" />
                Направление подготовки
              </h3>

              <div>
                <label htmlFor="directionId" className="block text-sm font-medium text-gray-700 mb-1">
                  Выберите направление <span className="text-red-500">*</span>
                </label>
                <select
                  id="directionId"
                  name="directionId"
                  value={formData.directionId}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={directionsLoading}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.directionId ? "border-red-300" : "border-gray-300"
                  }`}
                >
                  <option value="">Выберите направление подготовки</option>
                  {directions.map((direction) => (
                    <option key={direction.$id} value={direction.$id}>
                      {direction.name} ({direction.code})
                    </option>
                  ))}
                </select>
                {errors.directionId && (
                  <p className="mt-1 text-sm text-red-600">{errors.directionId}</p>
                )}
                
                {selectedDirection && (
                  <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-blue-800">
                      <Building className="h-4 w-4" />
                      <span className="font-medium">Институт:</span>
                      <span>{selectedDirection.institute?.name}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Настройки теста */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-blue-500" />
                Настройки теста
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Ограничение по времени */}
                <div>
                  <label htmlFor="timeLimit" className="block text-sm font-medium text-gray-700 mb-1">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Ограничение по времени (минуты)
                    </div>
                  </label>
                  <input
                    type="number"
                    id="timeLimit"
                    name="timeLimit"
                    value={formData.timeLimit}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    min="1"
                    max="480"
                    placeholder="Не ограничено"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.timeLimit ? "border-red-300" : "border-gray-300"
                    }`}
                  />
                  {errors.timeLimit && (
                    <p className="mt-1 text-sm text-red-600">{errors.timeLimit}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Оставьте пустым для неограниченного времени
                  </p>
                </div>

                {/* Проходной балл */}
                <div>
                  <label htmlFor="passingScore" className="block text-sm font-medium text-gray-700 mb-1">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Проходной балл (%)
                    </div>
                  </label>
                  <input
                    type="number"
                    id="passingScore"
                    name="passingScore"
                    value={formData.passingScore}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    min="1"
                    max="100"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.passingScore ? "border-red-300" : "border-gray-300"
                    }`}
                  />
                  {errors.passingScore && (
                    <p className="mt-1 text-sm text-red-600">{errors.passingScore}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Минимальный процент правильных ответов для зачета
                  </p>
                </div>
              </div>
            </div>

            {/* Информационное сообщение */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                <div className="text-sm">
                  <p className="text-blue-800 font-medium mb-1">Что дальше?</p>
                  <p className="text-blue-700">
                    После создания теста откроется модальное окно, где вы сможете добавить вопросы. 
                    Тест будет сохранен как черновик и станет доступен для публикации только после добавления вопросов.
                  </p>
                </div>
              </div>
            </div>

            {/* Кнопки действий */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleCancel}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Отменить
              </button>

              <button
                type="submit"
                disabled={createTestMutation.isPending || directionsLoading}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
      </div>

      {/* Модальное окно добавления вопросов */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <HelpCircle className="h-6 w-6 text-blue-500" />
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Добавление вопросов</h2>
                    <p className="text-sm text-gray-600">Тест: {createdTestTitle}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    Вопросов: {questions.length}
                  </span>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6">
              {/* Форма добавления вопроса */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {editingQuestionId ? "Редактирование вопроса" : "Новый вопрос"}
                </h3>

                <div className="space-y-4">
                  {/* Текст вопроса */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Текст вопроса <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={questionForm.questionText}
                      onChange={handleQuestionChange}
                      name="questionText"
                      rows={3}
                      placeholder="Введите текст вопроса"
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        questionErrors.questionText ? "border-red-300" : "border-gray-300"
                      }`}
                    />
                    {questionErrors.questionText && (
                      <p className="mt-1 text-sm text-red-600">{questionErrors.questionText}</p>
                    )}
                  </div>

                  {/* Варианты ответов */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {['A', 'B', 'C', 'D'].map((option) => (
                      <div key={option}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Вариант {option} <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={questionForm[`option${option}` as keyof QuestionFormData]}
                          onChange={handleQuestionChange}
                          name={`option${option}`}
                          placeholder={`Введите вариант ${option}`}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            questionErrors[`option${option}` as keyof QuestionErrors] ? "border-red-300" : "border-gray-300"
                          }`}
                        />
                        {questionErrors[`option${option}` as keyof QuestionErrors] && (
                          <p className="mt-1 text-sm text-red-600">
                            {questionErrors[`option${option}` as keyof QuestionErrors]}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Правильный ответ и баллы */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Правильный ответ <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={questionForm.correctAnswer}
                        onChange={handleQuestionChange}
                        name="correctAnswer"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                        <option value="D">D</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Баллы за вопрос <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={questionForm.points}
                        onChange={handleQuestionChange}
                        name="points"
                        min="1"
                        max="10"
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          questionErrors.points ? "border-red-300" : "border-gray-300"
                        }`}
                      />
                      {questionErrors.points && (
                        <p className="mt-1 text-sm text-red-600">{questionErrors.points}</p>
                      )}
                    </div>
                  </div>

                  {/* Кнопки управления вопросом */}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleAddQuestion}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      {editingQuestionId ? "Обновить вопрос" : "Добавить вопрос"}
                    </button>

                    {editingQuestionId && (
                      <button
                        type="button"
                        onClick={resetQuestionForm}
                        className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Отменить
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Список добавленных вопросов */}
              {questions.length > 0 && (
                <div className="space-y-4 mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Добавленные вопросы ({questions.length})
                  </h3>

                  {questions.map((question, index) => (
                    <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-bold text-gray-600">
                              Вопрос {index + 1}
                            </span>
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              {question.points} {question.points === 1 ? 'балл' : 'балла'}
                            </span>
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                              Ответ: {question.correctAnswer}
                            </span>
                          </div>
                          <p className="text-gray-900 mb-2">{question.questionText}</p>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <span><strong>A:</strong> {question.optionA}</span>
                            <span><strong>B:</strong> {question.optionB}</span>
                            <span><strong>C:</strong> {question.optionC}</span>
                            <span><strong>D:</strong> {question.optionD}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <button
                            onClick={() => handleEditQuestion(question)}
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                            title="Редактировать"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteQuestion(question.id)}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                            title="Удалить"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Кнопки действий */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    if (window.confirm("Закрыть окно? Несохраненные вопросы будут потеряны.")) {
                      setIsModalOpen(false);
                      router.push("/curator/tests");
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Отменить
                </button>

                <button
                  onClick={handleSaveQuestions}
                  disabled={questions.length === 0 || createQuestionMutation.isPending}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {createQuestionMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Сохранение...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Сохранить тест ({questions.length} вопросов)
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}