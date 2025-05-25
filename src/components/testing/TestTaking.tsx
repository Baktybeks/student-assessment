// src/components/testing/TestTaking.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  TestWithDetails,
  Question,
  QuestionOption,
  TestAnswerDto,
  formatTimeRemaining,
} from "@/types";
import { useQuestionsByTest } from "@/services/testService";
import { toast } from "react-toastify";
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  AlertTriangle,
  Play,
  Flag,
  Send,
  Eye,
  SkipForward,
  ArrowLeft,
  Timer,
} from "lucide-react";

interface TestTakingProps {
  test: TestWithDetails;
  onComplete: (answers: TestAnswerDto[]) => void;
  onExit: () => void;
}

export default function TestTaking({
  test,
  onComplete,
  onExit,
}: TestTakingProps) {
  const { data: questions = [], isLoading } = useQuestionsByTest(test.$id);
  const router = useRouter();

  // Состояния теста
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, TestAnswerDto>>(new Map());
  const [skippedQuestions, setSkippedQuestions] = useState<Set<number>>(
    new Set()
  );
  const [timeRemaining, setTimeRemaining] = useState<number | null>(
    test.timeLimit ? test.timeLimit * 60 : null
  );
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [testStartTime] = useState(new Date());

  // Таймер
  useEffect(() => {
    if (!isTimerRunning || timeRemaining === null || timeRemaining <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 1) {
          // Время истекло - автоматически завершаем тест
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isTimerRunning, timeRemaining]);

  // Автоматическое завершение при истечении времени
  const handleAutoSubmit = useCallback(() => {
    toast.warning(
      "⏰ Время тестирования истекло! Тест завершен автоматически.",
      {
        position: "top-center",
        autoClose: 5000,
      }
    );
    submitTest();
  }, [answers]);

  // Обработка ответа на вопрос
  const handleAnswerSelect = (option: QuestionOption) => {
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return;

    const newAnswer: TestAnswerDto = {
      questionId: currentQuestion.$id,
      selectedOption: option,
      isSkipped: false,
    };

    setAnswers((prev) => new Map(prev.set(currentQuestion.$id, newAnswer)));
    setSkippedQuestions((prev) => {
      const newSet = new Set(prev);
      newSet.delete(currentQuestionIndex);
      return newSet;
    });
  };

  // Пропуск вопроса
  const handleSkipQuestion = () => {
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return;

    setSkippedQuestions((prev) => new Set(prev.add(currentQuestionIndex)));

    // Переходим к следующему вопросу или завершаем
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      // Это был последний вопрос
      toast.info(
        "📝 Это был последний вопрос. Вы можете вернуться к пропущенным или завершить тест."
      );
    }
  };

  // Навигация между вопросами
  const goToQuestion = (index: number) => {
    if (index >= 0 && index < questions.length) {
      setCurrentQuestionIndex(index);
    }
  };

  const goToNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  // Завершение теста
  const submitTest = () => {
    const answersArray = Array.from(answers.values());

    // Добавляем пропущенные вопросы как неотвеченные
    questions.forEach((question, index) => {
      if (skippedQuestions.has(index) && !answers.has(question.$id)) {
        answersArray.push({
          questionId: question.$id,
          selectedOption: "A", // Заглушка для пропущенных
          isSkipped: true,
        });
      }
    });

    onComplete(answersArray);
  };

  const handleSubmitClick = () => {
    const unansweredCount = questions.length - answers.size;
    const skippedCount = skippedQuestions.size;

    if (unansweredCount > 0 || skippedCount > 0) {
      setShowSubmitConfirm(true);
    } else {
      submitTest();
    }
  };

  // Выход из теста
  const handleExitClick = () => {
    setShowExitConfirm(true);
  };

  const confirmExit = () => {
    setIsTimerRunning(false);
    onExit();
  };

  // Получение статуса вопроса
  const getQuestionStatus = (index: number, questionId: string) => {
    if (answers.has(questionId)) return "answered";
    if (skippedQuestions.has(index)) return "skipped";
    if (index === currentQuestionIndex) return "current";
    return "unanswered";
  };

  const getQuestionStatusColor = (status: string) => {
    switch (status) {
      case "answered":
        return "bg-green-500 text-white";
      case "skipped":
        return "bg-yellow-500 text-white";
      case "current":
        return "bg-blue-500 text-white";
      default:
        return "bg-gray-200 text-gray-700 hover:bg-gray-300";
    }
  };

  // Статистика
  const answeredCount = answers.size;
  const skippedCount = skippedQuestions.size;
  const remainingCount = questions.length - answeredCount;
  const progress =
    questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">Загрузка вопросов...</div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="text-center p-8">
        <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Тест недоступен
        </h2>
        <p className="text-gray-600 mb-4">В данном тесте отсутствуют вопросы</p>
        <button
          onClick={onExit}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
        >
          Вернуться назад
        </button>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Заголовок теста */}
      <div className="bg-white rounded-lg shadow-md border p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {test.title}
            </h1>
            <p className="text-gray-600">
              {test.direction?.name} • {test.institute?.name}
            </p>
          </div>

          {timeRemaining !== null && (
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                timeRemaining < 300
                  ? "bg-red-100 text-red-800"
                  : timeRemaining < 900
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-blue-100 text-blue-800"
              }`}
            >
              <Timer className="h-5 w-5" />
              <span className="font-mono text-lg">
                {formatTimeRemaining(timeRemaining)}
              </span>
            </div>
          )}
        </div>

        {/* Прогресс бар */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        {/* Статистика */}
        <div className="flex gap-6 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>Отвечено: {answeredCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <Flag className="h-4 w-4 text-yellow-500" />
            <span>Пропущено: {skippedCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4 text-gray-500" />
            <span>Осталось: {remainingCount}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Навигация по вопросам */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md border p-4 sticky top-6">
            <h3 className="font-semibold text-gray-900 mb-4">
              Навигация по вопросам
            </h3>
            <div className="grid grid-cols-5 lg:grid-cols-4 gap-2">
              {questions.map((question, index) => {
                const status = getQuestionStatus(index, question.$id);
                return (
                  <button
                    key={question.$id}
                    onClick={() => goToQuestion(index)}
                    className={`w-8 h-8 text-sm font-medium rounded transition-colors ${getQuestionStatusColor(
                      status
                    )}`}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>

            {/* Легенда */}
            <div className="mt-4 space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span>Отвечено</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                <span>Пропущено</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span>Текущий</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-200 rounded"></div>
                <span>Не отвечено</span>
              </div>
            </div>
          </div>
        </div>

        {/* Основная область с вопросом */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow-md border p-6">
            {/* Заголовок вопроса */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Вопрос {currentQuestionIndex + 1} из {questions.length}
              </h2>
              <div className="text-sm text-gray-500">
                {currentQuestion.points}{" "}
                {currentQuestion.points === 1 ? "балл" : "баллов"}
              </div>
            </div>

            {/* Текст вопроса */}
            <div className="mb-8">
              <p className="text-gray-900 text-lg leading-relaxed">
                {currentQuestion.questionText}
              </p>
            </div>

            {/* Варианты ответов */}
            <div className="space-y-4 mb-8">
              {[
                {
                  option: "A" as QuestionOption,
                  text: currentQuestion.optionA,
                },
                {
                  option: "B" as QuestionOption,
                  text: currentQuestion.optionB,
                },
                {
                  option: "C" as QuestionOption,
                  text: currentQuestion.optionC,
                },
                {
                  option: "D" as QuestionOption,
                  text: currentQuestion.optionD,
                },
              ].map(({ option, text }) => {
                const isSelected =
                  answers.get(currentQuestion.$id)?.selectedOption === option;
                return (
                  <button
                    key={option}
                    onClick={() => handleAnswerSelect(option)}
                    className={`w-full p-4 text-left border-2 rounded-lg transition-all ${
                      isSelected
                        ? "border-blue-500 bg-blue-50 text-blue-900"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm font-medium ${
                          isSelected
                            ? "border-blue-500 bg-blue-500 text-white"
                            : "border-gray-300 text-gray-600"
                        }`}
                      >
                        {option}
                      </div>
                      <span className="text-gray-900">{text}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Навигационные кнопки */}
            <div className="flex justify-between items-center">
              <div className="flex gap-3">
                <button
                  onClick={goToPreviousQuestion}
                  disabled={currentQuestionIndex === 0}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Назад
                </button>

                <button
                  onClick={handleSkipQuestion}
                  className="flex items-center gap-2 px-4 py-2 text-yellow-600 bg-yellow-100 rounded-lg hover:bg-yellow-200 transition-colors"
                >
                  <SkipForward className="h-4 w-4" />
                  Пропустить
                </button>
              </div>

              <div className="flex gap-3">
                {currentQuestionIndex < questions.length - 1 ? (
                  <button
                    onClick={goToNextQuestion}
                    className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Далее
                    <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmitClick}
                    className="flex items-center gap-2 px-6 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Send className="h-4 w-4" />
                    Завершить тест
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Кнопка выхода */}
          <div className="mt-4 text-center">
            <button
              onClick={handleExitClick}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Выйти из теста
            </button>
          </div>
        </div>
      </div>

      {/* Модальное окно подтверждения завершения */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Завершить тестирование?
            </h3>

            <div className="mb-6 space-y-2 text-sm text-gray-600">
              <p>Статистика прохождения:</p>
              <ul className="space-y-1">
                <li>
                  • Отвечено на вопросов: {answeredCount} из {questions.length}
                </li>
                {skippedCount > 0 && (
                  <li>• Пропущено вопросов: {skippedCount}</li>
                )}
                {remainingCount > 0 && (
                  <li className="text-orange-600">
                    • Не отвечено: {remainingCount}
                  </li>
                )}
              </ul>

              {remainingCount > 0 && (
                <p className="text-orange-600 font-medium mt-3">
                  ⚠️ У вас есть неотвеченные вопросы. После завершения теста
                  изменить ответы будет невозможно.
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowSubmitConfirm(false)}
                className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Продолжить тест
              </button>
              <button
                onClick={() => {
                  setShowSubmitConfirm(false);
                  submitTest();
                }}
                className="flex-1 px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
              >
                Завершить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно подтверждения выхода */}
      {showExitConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-red-500" />
              <h3 className="text-lg font-semibold text-gray-900">
                Выйти из теста?
              </h3>
            </div>

            <div className="mb-6 text-sm text-gray-600">
              <p className="mb-3">
                Вы уверены, что хотите выйти из теста? Все ваши ответы будут
                потеряны.
              </p>
              <p className="text-red-600 font-medium">
                ⚠️ Это действие нельзя отменить. Вам придется начать тест
                заново.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Остаться
              </button>
              <button
                onClick={confirmExit}
                className="flex-1 px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                Выйти
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Предупреждение о времени */}
      {timeRemaining !== null && timeRemaining < 300 && timeRemaining > 0 && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-200 text-red-800 px-4 py-3 rounded-lg shadow-lg z-40">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            <span className="font-medium">Осталось менее 5 минут!</span>
          </div>
        </div>
      )}
    </div>
  );
}
