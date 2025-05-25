// src/app/(dashboard)/curator/tests/[testId]/edit/page.tsx
"use client";

// Добавляем импорт React
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
  useTest,
  useUpdateTest,
  useQuestionsByTest,
  useCreateQuestion,
  useUpdateQuestion,
  useDeleteQuestion,
  usePublishTest,
} from "@/services/testService";
import {
  Question,
  UpdateTestDto,
  CreateQuestionDto,
  QuestionOption,
} from "@/types";
import { toast } from "react-toastify";
import {
  TestTube,
  Save,
  ArrowLeft,
  Plus,
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
  Upload,
  Download,
  Settings,
  HelpCircle,
  X,
  Check,
  Move,
} from "lucide-react";

interface EditTestPageProps {
  params: Promise<{
    testId: string;
  }>;
}

export default function EditTestPage({ params }: EditTestPageProps) {
  const router = useRouter();
  const { user } = useAuth();

  // Извлекаем testId из промиса params
  const [testId, setTestId] = React.useState<string>("");

  React.useEffect(() => {
    params.then((resolvedParams) => {
      setTestId(resolvedParams.testId);
    });
  }, [params]);

  const { data: test, isLoading: testLoading } = useTest(testId);
  const { data: questions = [], isLoading: questionsLoading } =
    useQuestionsByTest(testId);
  const updateTestMutation = useUpdateTest();
  const createQuestionMutation = useCreateQuestion();
  const updateQuestionMutation = useUpdateQuestion();
  const deleteQuestionMutation = useDeleteQuestion();
  const publishTestMutation = usePublishTest();

  const [showTestSettings, setShowTestSettings] = useState(false);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  const [testData, setTestData] = useState({
    title: "",
    description: "",
    timeLimit: 60,
    passingScore: 60,
  });

  const [questionData, setQuestionData] = useState<CreateQuestionDto>({
    testId: "",
    questionText: "",
    optionA: "",
    optionB: "",
    optionC: "",
    optionD: "",
    correctAnswer: "A" as QuestionOption,
    points: 1,
  });

  // Обновляем testId в questionData когда он становится доступным
  useEffect(() => {
    if (testId) {
      setQuestionData((prev) => ({ ...prev, testId }));
    }
  }, [testId]);

  // Инициализация данных теста
  useEffect(() => {
    if (test) {
      setTestData({
        title: test.title,
        description: test.description || "",
        timeLimit: test.timeLimit || 60,
        passingScore: test.passingScore,
      });
    }
  }, [test]);

  // Проверка доступа
  useEffect(() => {
    if (test && user && test.curatorId !== user.$id) {
      toast.error("У вас нет прав для редактирования этого теста");
      router.push("/curator/tests");
    }
  }, [test, user, router]);

  const handleUpdateTest = async () => {
    if (!test) return;

    try {
      const updateData: UpdateTestDto = {
        title: testData.title,
        description: testData.description,
        timeLimit: testData.timeLimit,
        passingScore: testData.passingScore,
      };

      await updateTestMutation.mutateAsync({
        id: test.$id,
        data: updateData,
      });

      toast.success("Настройки теста обновлены");
      setShowTestSettings(false);
    } catch (error) {
      toast.error(`Ошибка при обновлении теста: ${(error as Error).message}`);
    }
  };

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!questionData.questionText.trim()) {
      toast.error("Введите текст вопроса");
      return;
    }

    if (
      !questionData.optionA.trim() ||
      !questionData.optionB.trim() ||
      !questionData.optionC.trim() ||
      !questionData.optionD.trim()
    ) {
      toast.error("Заполните все варианты ответов");
      return;
    }

    try {
      await createQuestionMutation.mutateAsync(questionData);
      toast.success("Вопрос добавлен");

      // Сброс формы
      setQuestionData({
        testId: testId,
        questionText: "",
        optionA: "",
        optionB: "",
        optionC: "",
        optionD: "",
        correctAnswer: "A" as QuestionOption,
        points: 1,
      });
      setShowQuestionForm(false);
    } catch (error) {
      toast.error(`Ошибка при создании вопроса: ${(error as Error).message}`);
    }
  };

  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question);
    setQuestionData({
      testId: testId,
      questionText: question.questionText,
      optionA: question.optionA,
      optionB: question.optionB,
      optionC: question.optionC,
      optionD: question.optionD,
      correctAnswer: question.correctAnswer,
      points: question.points,
    });
    setShowQuestionForm(true);
  };

  const handleUpdateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingQuestion) return;

    try {
      await updateQuestionMutation.mutateAsync({
        id: editingQuestion.$id,
        data: {
          questionText: questionData.questionText,
          optionA: questionData.optionA,
          optionB: questionData.optionB,
          optionC: questionData.optionC,
          optionD: questionData.optionD,
          correctAnswer: questionData.correctAnswer,
          points: questionData.points,
        },
      });

      toast.success("Вопрос обновлен");
      setEditingQuestion(null);
      setShowQuestionForm(false);
    } catch (error) {
      toast.error(`Ошибка при обновлении вопроса: ${(error as Error).message}`);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (window.confirm("Удалить этот вопрос? Это действие нельзя отменить.")) {
      try {
        await deleteQuestionMutation.mutateAsync(questionId);
        toast.success("Вопрос удален");
      } catch (error) {
        toast.error(`Ошибка при удалении вопроса: ${(error as Error).message}`);
      }
    }
  };

  const handlePublishTest = async () => {
    if (!test) return;

    if (questions.length === 0) {
      toast.error("Нельзя опубликовать тест без вопросов");
      return;
    }

    try {
      await publishTestMutation.mutateAsync(test.$id);
      toast.success("Тест опубликован и доступен абитуриентам");
    } catch (error) {
      toast.error(`Ошибка при публикации теста: ${(error as Error).message}`);
    }
  };

  const resetQuestionForm = () => {
    setQuestionData({
      testId: testId,
      questionText: "",
      optionA: "",
      optionB: "",
      optionC: "",
      optionD: "",
      correctAnswer: "A" as QuestionOption,
      points: 1,
    });
    setEditingQuestion(null);
    setShowQuestionForm(false);
  };

  const getOptionLetter = (option: QuestionOption) => {
    const letters = { A: "А", B: "Б", C: "В", D: "Г" };
    return letters[option];
  };

  if (testLoading || questionsLoading || !testId) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Загрузка теста...</span>
        </div>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Тест не найден
          </h2>
          <p className="text-gray-600">
            Возможно, тест был удален или у вас нет прав доступа
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Заголовок */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => router.back()}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <TestTube className="h-8 w-8 text-blue-500" />
              <h1 className="text-3xl font-bold text-gray-900">{test.title}</h1>
              <div className="flex items-center gap-2">
                {test.isPublished ? (
                  <span className="px-3 py-1 text-sm font-medium bg-green-100 text-green-800 rounded-full">
                    Опубликован
                  </span>
                ) : (
                  <span className="px-3 py-1 text-sm font-medium bg-yellow-100 text-yellow-800 rounded-full">
                    Черновик
                  </span>
                )}
              </div>
            </div>
            <p className="text-gray-600">
              {test.direction?.name} • {test.institute?.name}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowTestSettings(true)}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Settings className="h-4 w-4" />
              Настройки
            </button>

            {!test.isPublished && questions.length > 0 && (
              <button
                onClick={handlePublishTest}
                disabled={publishTestMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                <Play className="h-4 w-4" />
                Опубликовать
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Статистика теста */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BookOpen className="h-8 w-8 text-blue-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Вопросы</p>
              <p className="text-2xl font-bold text-gray-900">
                {questions.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Target className="h-8 w-8 text-purple-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Макс. баллов</p>
              <p className="text-2xl font-bold text-gray-900">
                {test.maxScore}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Время</p>
              <p className="text-2xl font-bold text-gray-900">
                {test.timeLimit ? `${test.timeLimit}м` : "∞"}
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
                Проходной балл
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {test.passingScore}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Управление вопросами */}
      <div className="bg-white rounded-lg shadow border">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Вопросы теста ({questions.length})
            </h3>
            <button
              onClick={() => setShowQuestionForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Добавить вопрос
            </button>
          </div>
        </div>

        {questions.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              В тесте пока нет вопросов
            </h3>
            <p className="text-gray-500 mb-4">
              Добавьте вопросы, чтобы абитуриенты могли проходить тест
            </p>
            <button
              onClick={() => setShowQuestionForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Добавить первый вопрос
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {questions.map((question, index) => (
              <div key={question.$id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-gray-500">
                        Вопрос {index + 1}
                      </span>
                      <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">
                        {question.points}{" "}
                        {question.points === 1 ? "балл" : "баллов"}
                      </span>
                    </div>
                    <h4 className="text-lg font-medium text-gray-900 mb-4">
                      {question.questionText}
                    </h4>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEditQuestion(question)}
                      className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Редактировать"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteQuestion(question.$id)}
                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg transition-colors"
                      title="Удалить"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { option: "A" as QuestionOption, text: question.optionA },
                    { option: "B" as QuestionOption, text: question.optionB },
                    { option: "C" as QuestionOption, text: question.optionC },
                    { option: "D" as QuestionOption, text: question.optionD },
                  ].map(({ option, text }) => (
                    <div
                      key={option}
                      className={`p-3 border-2 rounded-lg ${
                        question.correctAnswer === option
                          ? "border-green-500 bg-green-50"
                          : "border-gray-200 bg-gray-50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm font-medium ${
                            question.correctAnswer === option
                              ? "border-green-500 bg-green-500 text-white"
                              : "border-gray-300 text-gray-600"
                          }`}
                        >
                          {getOptionLetter(option)}
                        </div>
                        <span className="text-sm text-gray-900">{text}</span>
                        {question.correctAnswer === option && (
                          <Check className="h-4 w-4 text-green-600 ml-auto" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Модальное окно настроек теста */}
      {showTestSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Настройки теста
              </h3>
              <button
                onClick={() => setShowTestSettings(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Название теста
                </label>
                <input
                  type="text"
                  value={testData.title}
                  onChange={(e) =>
                    setTestData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Описание
                </label>
                <textarea
                  value={testData.description}
                  onChange={(e) =>
                    setTestData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Время (минуты)
                  </label>
                  <input
                    type="number"
                    value={testData.timeLimit}
                    onChange={(e) =>
                      setTestData((prev) => ({
                        ...prev,
                        timeLimit: parseInt(e.target.value) || 0,
                      }))
                    }
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    0 = без ограничений
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Проходной балл (%)
                  </label>
                  <input
                    type="number"
                    value={testData.passingScore}
                    onChange={(e) =>
                      setTestData((prev) => ({
                        ...prev,
                        passingScore: parseInt(e.target.value) || 60,
                      }))
                    }
                    min="1"
                    max="100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t">
              <button
                onClick={() => setShowTestSettings(false)}
                className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleUpdateTest}
                disabled={updateTestMutation.isPending}
                className="flex-1 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно создания/редактирования вопроса */}
      {showQuestionForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingQuestion ? "Редактировать вопрос" : "Добавить вопрос"}
              </h3>
              <button
                onClick={resetQuestionForm}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={
                editingQuestion ? handleUpdateQuestion : handleCreateQuestion
              }
              className="space-y-6"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Текст вопроса *
                </label>
                <textarea
                  value={questionData.questionText}
                  onChange={(e) =>
                    setQuestionData((prev) => ({
                      ...prev,
                      questionText: e.target.value,
                    }))
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Введите текст вопроса..."
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    option: "A" as QuestionOption,
                    label: "Вариант А",
                    field: "optionA",
                  },
                  {
                    option: "B" as QuestionOption,
                    label: "Вариант Б",
                    field: "optionB",
                  },
                  {
                    option: "C" as QuestionOption,
                    label: "Вариант В",
                    field: "optionC",
                  },
                  {
                    option: "D" as QuestionOption,
                    label: "Вариант Г",
                    field: "optionD",
                  },
                ].map(({ option, label, field }) => (
                  <div key={option}>
                    <div className="flex items-center gap-2 mb-2">
                      <label className="text-sm font-medium text-gray-700">
                        {label} *
                      </label>
                      <input
                        type="radio"
                        name="correctAnswer"
                        value={option}
                        checked={questionData.correctAnswer === option}
                        onChange={(e) =>
                          setQuestionData((prev) => ({
                            ...prev,
                            correctAnswer: e.target.value as QuestionOption,
                          }))
                        }
                        className="text-green-600"
                      />
                      <span className="text-xs text-green-600">правильный</span>
                    </div>
                    <input
                      type="text"
                      value={(questionData as any)[field]}
                      onChange={(e) =>
                        setQuestionData((prev) => ({
                          ...prev,
                          [field]: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder={`Введите ${label.toLowerCase()}...`}
                      required
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Баллы за вопрос
                </label>
                <input
                  type="number"
                  value={questionData.points}
                  onChange={(e) =>
                    setQuestionData((prev) => ({
                      ...prev,
                      points: parseInt(e.target.value) || 1,
                    }))
                  }
                  min="1"
                  max="10"
                  className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">От 1 до 10 баллов</p>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={resetQuestionForm}
                  className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={
                    createQuestionMutation.isPending ||
                    updateQuestionMutation.isPending
                  }
                  className="flex-1 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {editingQuestion ? "Сохранить изменения" : "Добавить вопрос"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Подсказки */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <HelpCircle className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-blue-900 mb-2">
              Советы по созданию качественных вопросов
            </h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Формулируйте вопросы четко и однозначно</li>
              <li>• Все варианты ответов должны быть правдоподобными</li>
              <li>• Избегайте подсказок в тексте вопроса</li>
              <li>• Используйте простой и понятный язык</li>
              <li>
                • Проверьте, что правильный ответ действительно правильный
              </li>
              <li>• Тест можно опубликовать только при наличии вопросов</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
