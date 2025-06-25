// src/app/(dashboard)/applicant/tests/[id]/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useProfileByUserId } from "@/services/profileService";
import { useTest, useQuestionsByTest } from "@/services/testService";
import {
  useActiveSession,
  useCreateTestSession,
  useSubmitAnswer,
  useFinishTestSession,
} from "@/services/testSessionService";
import { UserRole } from "@/types";
import { toast } from "react-toastify";
import {
  Clock,
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Save,
  Send,
  Eye,
  EyeOff,
  Target,
  BookOpen,
  Hash,
  Award,
  Timer,
  List,
  Flag,
  Pause,
  Play,
  RotateCcw,
  User,
  FileText,
  Calendar,
  Zap,
  Activity,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Loader,
} from "lucide-react";

interface TimeRemaining {
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

export default function TestTakingPage() {
  const router = useRouter();
  const params = useParams();
  const testId = params.id as string;

  const { user } = useAuth();
  const { data: profile } = useProfileByUserId(user?.$id || "");
  const { data: test, isLoading: testLoading } = useTest(testId);
  const { data: questions = [], isLoading: questionsLoading } = useQuestionsByTest(testId);
  const { data: activeSession } = useActiveSession(testId, user?.$id || "");

  const createSessionMutation = useCreateTestSession();
  const submitAnswerMutation = useSubmitAnswer();
  const finishSessionMutation = useFinishTestSession();

  // Состояние теста
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(null);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [showConfirmFinish, setShowConfirmFinish] = useState(false);
  const [testStartTime, setTestStartTime] = useState<Date | null>(null);
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);

  // Инициализация теста
  useEffect(() => {
    if (activeSession) {
      setSessionId(activeSession.$id);
      setTestStartTime(new Date(activeSession.startedAt));
      
      // Загружаем существующие ответы если есть
      if (activeSession.answers && Array.isArray(activeSession.answers)) {
  const answersMap: Record<string, string> = {};
  activeSession.answers.forEach((answer: { questionId: string; selectedOption: string }) => {
    answersMap[answer.questionId] = answer.selectedOption;
  });
  setAnswers(answersMap);
}
    }
  }, [activeSession]);

  // Таймер
  useEffect(() => {
    if (!testStartTime || !test?.timeLimit) return;

    const interval = setInterval(() => {
      const now = new Date();
      const elapsed = Math.floor((now.getTime() - testStartTime.getTime()) / 1000);
      const totalTimeInSeconds = test.timeLimit && test.timeLimit * 60;
      const remaining = totalTimeInSeconds &&  Math.max(0, totalTimeInSeconds - elapsed);

      if (remaining === 0) {
        setIsTimeUp(true);
        handleAutoFinish();
        clearInterval(interval);
        return;
      }

      if(remaining  ) {
        setTimeRemaining({
          hours: Math.floor(remaining / 3600),
          minutes: Math.floor((remaining % 3600) / 60),
          seconds: remaining % 60,
          total: remaining,
        });
      }

    }, 1000);

    return () => clearInterval(interval);
  }, [testStartTime, test?.timeLimit]);

  // Начало теста
  const handleStartTest = async () => {
    if (!user || !profile?.isProfileComplete) {
      toast.error("❌ ЗАПОЛНИТЕ ПРОФИЛЬ ДЛЯ ПРОХОЖДЕНИЯ ТЕСТА");
      router.push("/applicant/profile");
      return;
    }

    try {
      const session = await createSessionMutation.mutateAsync({
        testId,
        applicantId: user.$id,
      });
      
      setSessionId(session.$id);
      setTestStartTime(new Date());
      toast.success("✅ ТЕСТ НАЧАТ! УДАЧИ!");
    } catch (error) {
      toast.error(`❌ ОШИБКА НАЧАЛА ТЕСТА: ${(error as Error).message}`);
    }
  };

  // Сохранение ответа
  const handleAnswerSelect = async (questionId: string, selectedOption: string) => {
    if (!sessionId) return;

    setIsSubmittingAnswer(true);
    
    try {
      await submitAnswerMutation.mutateAsync({
        sessionId,
        questionId,
        selectedOption,
      });

      setAnswers(prev => ({
        ...prev,
        [questionId]: selectedOption,
      }));

      toast.success("💾 ОТВЕТ СОХРАНЕН", { autoClose: 1000 });
    } catch (error) {
      toast.error(`❌ ОШИБКА СОХРАНЕНИЯ: ${(error as Error).message}`);
    } finally {
      setIsSubmittingAnswer(false);
    }
  };

  // Автоматическое завершение при истечении времени
  const handleAutoFinish = useCallback(async () => {
    if (!sessionId || !testStartTime) return;

    const timeSpent = Math.floor((new Date().getTime() - testStartTime.getTime()) / 1000);

    try {
      const result = await finishSessionMutation.mutateAsync({
        sessionId,
        data: {
          finishReason: "TIME_UP",
          timeSpent,
        },
      });

      toast.warn("⏰ ВРЕМЯ ВЫШЛО! ТЕСТ ЗАВЕРШЕН АВТОМАТИЧЕСКИ");
      router.push(`/applicant/results/${result.$id}`);
    } catch (error) {
      toast.error(`❌ ОШИБКА ЗАВЕРШЕНИЯ: ${(error as Error).message}`);
    }
  }, [sessionId, testStartTime, finishSessionMutation, router]);

  // Ручное завершение теста
  const handleFinishTest = async () => {
    if (!sessionId || !testStartTime) return;

    const timeSpent = Math.floor((new Date().getTime() - testStartTime.getTime()) / 1000);

    try {
      const result = await finishSessionMutation.mutateAsync({
        sessionId,
        data: {
          finishReason: "MANUAL",
          timeSpent,
        },
      });

      toast.success("✅ ТЕСТ УСПЕШНО ЗАВЕРШЕН!");
      router.push(`/applicant/results/${result.$id}`);
    } catch (error) {
      toast.error(`❌ ОШИБКА ЗАВЕРШЕНИЯ: ${(error as Error).message}`);
    }
  };

  // Навигация по вопросам
  const goToQuestion = (index: number) => {
    if (index >= 0 && index < questions.length) {
      setCurrentQuestionIndex(index);
    }
  };

  const currentQuestion = questions[currentQuestionIndex];
  const isAnswered = currentQuestion && answers[currentQuestion.$id];
  const answeredCount = Object.keys(answers).length;
  const progress = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;

  // Защита доступа
  if (!user || user.role !== UserRole.APPLICANT) {
    return (
      <div className="min-h-screen bg-slate-900 text-white">
        <div className="p-6 max-w-7xl mx-auto">
          <div className="text-center">
            <AlertTriangle className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-mono font-bold text-white mb-2 uppercase">
              ОШИБКА ДОСТУПА
            </h2>
            <p className="text-slate-300 font-mono">ДОСТУП ТОЛЬКО ДЛЯ АБИТУРИЕНТОВ</p>
          </div>
        </div>
      </div>
    );
  }

  if (testLoading || questionsLoading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white">
        <div className="p-6 max-w-7xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <Loader className="w-8 h-8 animate-spin text-blue-400 mr-3" />
            <span className="text-slate-300 font-mono">ЗАГРУЗКА ТЕСТА...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="min-h-screen bg-slate-900 text-white">
        <div className="p-6 max-w-7xl mx-auto">
          <div className="text-center">
            <AlertTriangle className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-mono font-bold text-white mb-2 uppercase">
              ТЕСТ НЕ НАЙДЕН
            </h2>
            <p className="text-slate-300 font-mono mb-4">
              ЗАПРАШИВАЕМЫЙ ТЕСТ НЕ СУЩЕСТВУЕТ ИЛИ БЫЛ УДАЛЕН
            </p>
            <button
              onClick={() => router.push("/applicant/tests")}
              className="flex items-center gap-2 mx-auto px-4 py-2 bg-blue-800 text-blue-200 border-2 border-blue-600 font-mono font-bold uppercase"
            >
              <ArrowLeft className="h-4 w-4" />
              ВЕРНУТЬСЯ К ТЕСТАМ
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Страница начала теста
  if (!sessionId) {
    return (
      <div className="min-h-screen bg-slate-900 text-white">
        <div className="p-6 max-w-4xl mx-auto">
          {/* Заголовок */}
          <div className="mb-8 border-b-2 border-slate-700 pb-6">
            <div className="flex items-center gap-3 mb-2">
              <FileText className="h-8 w-8 text-blue-400" />
              <h1 className="text-3xl font-mono font-bold text-white uppercase tracking-wide">
                {test.title}
              </h1>
            </div>
            <p className="text-slate-300 font-mono uppercase">
              ПОДГОТОВКА К ПРОХОЖДЕНИЮ ТЕСТА
            </p>
          </div>

          {/* Информация о тесте */}
          <div className="space-y-6 mb-8">
            {/* Описание */}
            {test.description && (
              <div className="bg-slate-800 border-2 border-slate-600 p-6">
                <h3 className="text-lg font-mono font-bold text-white mb-3 uppercase">
                  ОПИСАНИЕ ТЕСТА
                </h3>
                <p className="text-slate-300 font-mono leading-relaxed">
                  {test.description}
                </p>
              </div>
            )}

            {/* Характеристики */}
            <div className="bg-slate-800 border-2 border-slate-600 p-6">
              <h3 className="text-lg font-mono font-bold text-white mb-4 uppercase">
                ХАРАКТЕРИСТИКИ ТЕСТА
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex items-center gap-3">
                  <Hash className="h-6 w-6 text-blue-400" />
                  <div>
                    <div className="text-sm font-mono font-bold text-slate-300 uppercase">
                      ВОПРОСОВ
                    </div>
                    <div className="text-xl font-mono font-bold text-white">
                      {questions.length}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="h-6 w-6 text-yellow-400" />
                  <div>
                    <div className="text-sm font-mono font-bold text-slate-300 uppercase">
                      ВРЕМЯ
                    </div>
                    <div className="text-xl font-mono font-bold text-white">
                      {test.timeLimit ? `${test.timeLimit}М` : "∞"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Target className="h-6 w-6 text-green-400" />
                  <div>
                    <div className="text-sm font-mono font-bold text-slate-300 uppercase">
                      МАКС. БАЛЛ
                    </div>
                    <div className="text-xl font-mono font-bold text-white">
                      {test.maxScore}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Award className="h-6 w-6 text-purple-400" />
                  <div>
                    <div className="text-sm font-mono font-bold text-slate-300 uppercase">
                      ПРОХОДНОЙ
                    </div>
                    <div className="text-xl font-mono font-bold text-white">
                      {test.passingScore}%
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Правила */}
            <div className="bg-orange-900 border-2 border-orange-600 p-6">
              <h3 className="text-lg font-mono font-bold text-orange-200 mb-4 uppercase">
                ⚠️ ВАЖНЫЕ ПРАВИЛА
              </h3>
              <ul className="space-y-2 text-orange-300 font-mono">
                <li>• У ВАС ЕСТЬ ТОЛЬКО ОДНА ПОПЫТКА ПРОХОЖДЕНИЯ ЭТОГО ТЕСТА</li>
                <li>• ОТВЕТЫ СОХРАНЯЮТСЯ АВТОМАТИЧЕСКИ ПРИ ВЫБОРЕ ВАРИАНТА</li>
                {test.timeLimit && (
                  <li>• ПРИ ИСТЕЧЕНИИ ВРЕМЕНИ ТЕСТ ЗАВЕРШИТСЯ АВТОМАТИЧЕСКИ</li>
                )}
                <li>• МОЖНО ПЕРЕМЕЩАТЬСЯ МЕЖДУ ВОПРОСАМИ И ИЗМЕНЯТЬ ОТВЕТЫ</li>
                <li>• РЕКОМЕНДУЕТСЯ ПРОХОДИТЬ ТЕСТ БЕЗ ПЕРЕРЫВОВ</li>
                <li>• УБЕДИТЕСЬ В СТАБИЛЬНОСТИ ИНТЕРНЕТ-СОЕДИНЕНИЯ</li>
              </ul>
            </div>

            {/* Проверка готовности */}
            <div className="bg-slate-800 border-2 border-slate-600 p-6">
              <h3 className="text-lg font-mono font-bold text-white mb-4 uppercase">
                ПРОВЕРКА ГОТОВНОСТИ
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  {profile?.isProfileComplete ? (
                    <CheckCircle className="h-5 w-5 text-green-400" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-red-400" />
                  )}
                  <span className="font-mono text-white">
                    ПРОФИЛЬ ЗАПОЛНЕН: {profile?.isProfileComplete ? "ДА" : "НЕТ"}
                  </span>
                </div>
                
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <span className="font-mono text-white">
                    ТЕСТ ДОСТУПЕН: ДА
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <span className="font-mono text-white">
                    ВОПРОСЫ ЗАГРУЖЕНЫ: {questions.length > 0 ? "ДА" : "НЕТ"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Действия */}
          <div className="flex gap-4">
            <button
              onClick={() => router.push("/applicant/tests")}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-4 text-slate-300 bg-slate-700 border-2 border-slate-600 font-mono font-bold uppercase"
            >
              <ArrowLeft className="h-4 w-4" />
              НАЗАД К ТЕСТАМ
            </button>

            {profile?.isProfileComplete && questions.length > 0 ? (
              <button
                onClick={handleStartTest}
                disabled={createSessionMutation.isPending}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-green-800 text-green-200 border-2 border-green-600 disabled:opacity-50 font-mono font-bold uppercase"
              >
                <Play className="h-4 w-4" />
                {createSessionMutation.isPending ? "ПОДГОТОВКА..." : "НАЧАТЬ ТЕСТ"}
              </button>
            ) : (
              <button
                disabled
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 text-slate-400 bg-slate-700 border-2 border-slate-600 opacity-50 font-mono font-bold uppercase"
              >
                <AlertTriangle className="h-4 w-4" />
                НЕДОСТУПНО
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Интерфейс прохождения теста
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Верхняя панель с таймером и прогрессом */}
      <div className="bg-slate-800 border-b-2 border-slate-600 p-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-mono font-bold text-white uppercase">
              {test.title}
            </h1>
            <div className="flex items-center gap-2 text-sm font-mono text-slate-300">
              <Hash className="h-4 w-4" />
              <span>
                {currentQuestionIndex + 1} ИЗ {questions.length}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* Прогресс */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono font-bold text-slate-300 uppercase">
                ПРОГРЕСС:
              </span>
              <div className="w-32 h-2 bg-slate-700 border border-slate-600">
                <div 
                  className="h-full bg-green-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <span className="text-sm font-mono font-bold text-white">
                {Math.round(progress)}%
              </span>
            </div>

            {/* Таймер */}
            {timeRemaining && (
              <div className="flex items-center gap-2">
                <Timer className={`h-5 w-5 ${timeRemaining.total < 300 ? 'text-red-400' : 'text-yellow-400'}`} />
                <div className={`font-mono font-bold text-lg ${timeRemaining.total < 300 ? 'text-red-400' : 'text-white'}`}>
                  {timeRemaining.hours > 0 && `${timeRemaining.hours}:`}
                  {String(timeRemaining.minutes).padStart(2, '0')}:
                  {String(timeRemaining.seconds).padStart(2, '0')}
                </div>
              </div>
            )}

            {/* Кнопка завершения */}
            <button
              onClick={() => setShowConfirmFinish(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-800 text-red-200 border-2 border-red-600 font-mono font-bold uppercase"
            >
              <Send className="h-4 w-4" />
              ЗАВЕРШИТЬ
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Навигация по вопросам */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800 border-2 border-slate-600 p-4 sticky top-24">
              <h3 className="text-sm font-mono font-bold text-white mb-4 uppercase border-b border-slate-600 pb-2">
                НАВИГАЦИЯ ПО ВОПРОСАМ
              </h3>
              <div className="grid grid-cols-5 lg:grid-cols-4 gap-2">
                {questions.map((question, index) => (
                  <button
                    key={question.$id}
                    onClick={() => goToQuestion(index)}
                    className={`
                      w-10 h-10 font-mono font-bold text-sm border-2 transition-colors
                      ${index === currentQuestionIndex 
                        ? 'bg-blue-800 text-blue-200 border-blue-600' 
                        : answers[question.$id]
                        ? 'bg-green-800 text-green-200 border-green-600'
                        : 'bg-slate-700 text-slate-300 border-slate-600'
                      }
                    `}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>

              <div className="mt-4 space-y-2 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-800 border border-green-600"></div>
                  <span className="text-slate-300">ОТВЕЧЕНО</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-800 border border-blue-600"></div>
                  <span className="text-slate-300">ТЕКУЩИЙ</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-slate-700 border border-slate-600"></div>
                  <span className="text-slate-300">НЕ ОТВЕЧЕНО</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-600">
                <div className="text-xs font-mono text-slate-300 space-y-1">
                  <div>ОТВЕЧЕНО: {answeredCount}</div>
                  <div>ОСТАЛОСЬ: {questions.length - answeredCount}</div>
                  <div>ВСЕГО: {questions.length}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Основной контент - вопрос */}
          <div className="lg:col-span-3">
            {currentQuestion && (
              <div className="bg-slate-800 border-2 border-slate-600 p-6">
                {/* Заголовок вопроса */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-mono font-bold text-white uppercase">
                      ВОПРОС {currentQuestionIndex + 1}
                    </h2>
                    <div className="flex items-center gap-2">
                      {isAnswered && (
                        <span className="px-2 py-1 text-xs font-mono font-bold bg-green-800 text-green-200 border border-green-600 uppercase">
                          ОТВЕЧЕНО
                        </span>
                      )}
                      <div className="flex items-center gap-1 text-sm font-mono text-slate-400">
                        <Award className="h-4 w-4" />
                        <span>{currentQuestion.points} БАЛЛОВ</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-white font-mono text-lg leading-relaxed mb-6 p-4 bg-slate-700 border border-slate-600">
                    {currentQuestion.questionText}
                  </div>
                </div>

                {/* Варианты ответов */}
                <div className="space-y-3 mb-8">
                  {['A', 'B', 'C', 'D'].map((option) => {
                    const optionText = currentQuestion[`option${option}` as keyof typeof currentQuestion] as string;
                    if (!optionText) return null;

                    const isSelected = answers[currentQuestion.$id] === option;

                    return (
                      <button
                        key={option}
                        onClick={() => handleAnswerSelect(currentQuestion.$id, option)}
                        disabled={isSubmittingAnswer}
                        className={`
                          w-full p-4 text-left font-mono border-2 transition-all duration-200 
                          ${isSelected 
                            ? 'bg-blue-800 text-blue-200 border-blue-600' 
                            : 'bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600'
                          }
                          ${isSubmittingAnswer ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`
                            w-8 h-8 flex items-center justify-center font-bold text-sm border-2 flex-shrink-0
                            ${isSelected 
                              ? 'bg-blue-600 text-blue-200 border-blue-400' 
                              : 'bg-slate-600 text-slate-300 border-slate-500'
                            }
                          `}>
                            {option}
                          </div>
                          <div className="flex-1 text-white leading-relaxed">
                            {optionText}
                          </div>
                          {isSelected && (
                            <CheckCircle className="h-5 w-5 text-blue-400 flex-shrink-0 mt-1" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Навигация по вопросам */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => goToQuestion(currentQuestionIndex - 1)}
                    disabled={currentQuestionIndex === 0}
                    className="flex items-center gap-2 px-4 py-2 text-slate-300 bg-slate-700 border-2 border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed font-mono font-bold uppercase"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    ПРЕДЫДУЩИЙ
                  </button>

                  <div className="flex items-center gap-4 text-sm font-mono text-slate-400">
                    {isSubmittingAnswer && (
                      <div className="flex items-center gap-2">
                        <Loader className="h-4 w-4 animate-spin" />
                        <span>СОХРАНЕНИЕ...</span>
                      </div>
                    )}
                    <span>
                      ВОПРОС {currentQuestionIndex + 1} ИЗ {questions.length}
                    </span>
                  </div>

                  <button
                    onClick={() => goToQuestion(currentQuestionIndex + 1)}
                    disabled={currentQuestionIndex === questions.length - 1}
                    className="flex items-center gap-2 px-4 py-2 text-slate-300 bg-slate-700 border-2 border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed font-mono font-bold uppercase"
                  >
                    СЛЕДУЮЩИЙ
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Модальное окно подтверждения завершения */}
      {showConfirmFinish && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border-2 border-slate-600 p-6 max-w-md w-full">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
              <h3 className="text-lg font-mono font-bold text-white mb-4 uppercase">
                ЗАВЕРШИТЬ ТЕСТ?
              </h3>
              <p className="text-slate-300 font-mono mb-2">
                ВЫ УВЕРЕНЫ, ЧТО ХОТИТЕ ЗАВЕРШИТЬ ТЕСТ?
              </p>
              <p className="text-slate-400 font-mono text-sm mb-6">
                ОТВЕЧЕНО: {answeredCount} ИЗ {questions.length} ВОПРОСОВ
              </p>

              <div className="flex gap-4">
                <button
                  onClick={() => setShowConfirmFinish(false)}
                  className="flex-1 px-4 py-2 text-slate-300 bg-slate-700 border-2 border-slate-600 font-mono font-bold uppercase"
                >
                  ОТМЕНА
                </button>
                <button
                  onClick={handleFinishTest}
                  disabled={finishSessionMutation.isPending}
                  className="flex-1 px-4 py-2 bg-red-800 text-red-200 border-2 border-red-600 disabled:opacity-50 font-mono font-bold uppercase"
                >
                  {finishSessionMutation.isPending ? "ЗАВЕРШЕНИЕ..." : "ЗАВЕРШИТЬ"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Предупреждение об истечении времени */}
      {timeRemaining && timeRemaining.total < 300 && (
        <div className="fixed top-4 right-4 bg-red-900 border-2 border-red-600 p-4 z-40">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <div>
              <div className="font-mono font-bold text-red-200 uppercase">
                ВНИМАНИЕ!
              </div>
              <div className="text-sm font-mono text-red-300">
                ВРЕМЯ ЗАКАНЧИВАЕТСЯ!
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}