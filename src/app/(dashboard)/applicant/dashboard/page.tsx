// src/app/(dashboard)/applicant/dashboard/page.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useActiveDirections } from "@/services/instituteService";
import { usePublishedTests } from "@/services/testService";
import { useProfileByUserId } from "@/services/profileService";
import {
  getTestGrade,
  getGradeColor,
  formatTimeSpent,
  TestWithDetails,
  ApplicantProgress,
} from "@/types";
import {
  GraduationCap,
  User,
  TestTube,
  Award,
  Clock,
  Target,
  BookOpen,
  CheckCircle,
  AlertTriangle,
  Eye,
  Play,
  FileText,
  Calendar,
  TrendingUp,
  Activity,
  Star,
  Zap,
  BarChart3,
  ChevronRight,
  MapPin,
  Phone,
  Mail,
  Edit,
  Trophy,
  PieChart,
  RefreshCw,
} from "lucide-react";

export default function ApplicantDashboard() {
  const { user } = useAuth();
  const { data: directions = [] } = useActiveDirections();
  const { data: publishedTests = [] } = usePublishedTests();
  
  // РЕАЛЬНЫЕ данные профиля вместо моковых
  const { 
    data: profile, 
    isLoading: profileLoading, 
    refetch: refetchProfile 
  } = useProfileByUserId(user?.$id || "");

  // TODO: Заменить на реальные сервисы когда будут готовы
  // const { data: testSessions } = useTestSessions(user?.$id);
  // const { data: testResults } = useTestResults(user?.$id);

  // Получаем направление и институт для профиля
  const getProfileDirection = () => {
    if (!profile?.directionId) return null;
    return directions.find(d => d.$id === profile.directionId);
  };

  const profileDirection = getProfileDirection();

  // Данные профиля абитуриента - теперь РЕАЛЬНЫЕ
  const applicantProfile = {
    isProfileComplete: profile?.isProfileComplete || false,
    firstName: profile?.firstName || "",
    lastName: profile?.lastName || "",
    middleName: profile?.middleName || "",
    birthDate: profile?.birthDate || "",
    phone: profile?.phone || "",
    directionId: profile?.directionId || "",
    direction: profileDirection,
    institute: profileDirection?.institute,
  };

  // Моковые данные результатов тестирования (пока нет реального API)
  const testingStats = {
    testsAvailable: publishedTests.filter(t => t.directionId === applicantProfile.directionId).length,
    testsCompleted: Math.floor(Math.random() * 8) + 2,
    averageScore: Math.floor(Math.random() * 30) + 65,
    bestScore: Math.floor(Math.random() * 20) + 80,
    totalTimeSpent: Math.floor(Math.random() * 3600) + 1800, // в секундах
    lastTestDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
  };

  // Моковые данные последних результатов
  const recentResults = [
    {
      testTitle: "МАТЕМАТИКА - АЛГЕБРА",
      score: 92,
      completedAt: "2024-01-15T14:30:00Z",
      timeSpent: 2400, // 40 минут
      grade: getTestGrade(92),
    },
    {
      testTitle: "ФИЗИКА - МЕХАНИКА", 
      score: 78,
      completedAt: "2024-01-12T11:15:00Z",
      timeSpent: 3600, // 60 минут
      grade: getTestGrade(78),
    },
    {
      testTitle: "ИНФОРМАТИКА - АЛГОРИТМЫ",
      score: 85,
      completedAt: "2024-01-10T16:45:00Z", 
      timeSpent: 2100, // 35 минут
      grade: getTestGrade(85),
    },
  ];

  // Доступные тесты для прохождения
  const availableTests = publishedTests
    .filter(test => test.directionId === applicantProfile.directionId)
    .slice(0, 5);

  // Достижения и бейджи
  const achievements = [
    {
      title: "ПЕРВЫЙ ТЕСТ",
      description: "ПРОШЕЛ ПЕРВЫЙ ТЕСТ",
      icon: Trophy,
      earned: testingStats.testsCompleted > 0,
      color: "text-yellow-400 bg-yellow-800",
    },
    {
      title: "ОТЛИЧНИК",
      description: "ПОЛУЧИЛ ОЦЕНКУ 'ОТЛИЧНО'",
      icon: Star,
      earned: testingStats.bestScore >= 87,
      color: "text-green-400 bg-green-800",
    },
    {
      title: "АКТИВНЫЙ",
      description: "ПРОШЕЛ 5+ ТЕСТОВ",
      icon: Zap,
      earned: testingStats.testsCompleted >= 5,
      color: "text-blue-400 bg-blue-800",
    },
    {
      title: "ПРОФИЛЬ ЗАПОЛНЕН",
      description: "ЗАПОЛНИЛ АНКЕТУ ПОЛНОСТЬЮ",
      icon: CheckCircle,
      earned: applicantProfile.isProfileComplete,
      color: "text-purple-400 bg-purple-800",
    },
  ];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getProgressPercentage = () => {
  if (testingStats.testsAvailable === 0) return 0;
  const percentage = (testingStats.testsCompleted / testingStats.testsAvailable) * 100;
  return Math.min(100, Math.round(percentage)); // Не больше 100%
};

  // Функция обновления всех данных
  const refreshAllData = async () => {
    await refetchProfile();
    // Здесь можно добавить обновление других данных когда будут готовы API
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 text-white">
        <div className="p-6 max-w-7xl mx-auto">
          <div className="text-center">
            <AlertTriangle className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-mono font-bold text-white mb-2 uppercase">
              ОШИБКА ДОСТУПА
            </h2>
            <p className="text-slate-300 font-mono">ПОЛЬЗОВАТЕЛЬ НЕ АВТОРИЗОВАН</p>
          </div>
        </div>
      </div>
    );
  }

  // Показываем загрузку только если профиль загружается в первый раз
  if (profileLoading && !profile) {
    return (
      <div className="min-h-screen bg-slate-900 text-white">
        <div className="p-6 max-w-7xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent animate-spin rounded-full"></div>
            <span className="ml-3 text-slate-300 font-mono">ЗАГРУЗКА ПРОФИЛЯ...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Приветствие */}
        <div className="mb-8 border-b border-slate-700 pb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-mono font-bold text-white mb-2 uppercase tracking-wide">
                ДОБРО ПОЖАЛОВАТЬ, {user.name}!
              </h1>
              <p className="text-slate-300 font-mono">
                ЛИЧНЫЙ КАБИНЕТ АБИТУРИЕНТА • ПРОХОДИТЕ ТЕСТЫ И ОТСЛЕЖИВАЙТЕ СВОЙ ПРОГРЕСС
              </p>
              {applicantProfile.direction && (
                <div className="mt-3 flex items-center gap-2 text-sm font-mono text-slate-400">
                  <GraduationCap className="h-4 w-4" />
                  <span>{applicantProfile.direction.name}</span>
                  <span>•</span>
                  <span>{applicantProfile.institute?.name}</span>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={refreshAllData}
                disabled={profileLoading}
                className="flex items-center gap-2 px-4 py-2 text-slate-300 bg-slate-800 border-2 border-slate-600 font-mono font-bold uppercase disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${profileLoading ? 'animate-spin' : ''}`} />
                ОБНОВИТЬ
              </button>

              {!applicantProfile.isProfileComplete && (
                <Link
                  href="/applicant/profile"
                  className="flex items-center gap-2 px-4 py-2 bg-orange-800 text-orange-200 border-2 border-orange-600 font-mono font-bold uppercase"
                >
                  <Edit className="h-4 w-4" />
                  ЗАПОЛНИТЬ АНКЕТУ
                </Link>
              )}

              <Link
                href="/applicant/tests"
                className="flex items-center gap-2 px-4 py-2 bg-blue-800 text-blue-200 border-2 border-blue-600 font-mono font-bold uppercase"
              >
                <TestTube className="h-4 w-4" />
                ПРОЙТИ ТЕСТ
              </Link>
            </div>
          </div>
        </div>

        {/* Уведомление об отсутствии профиля */}
        {!profile && (
          <div className="mb-8 bg-red-900 border-2 border-red-600 p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5" />
              <div>
                <h3 className="text-sm font-mono font-bold text-red-200 mb-2 uppercase">
                  ПРОФИЛЬ НЕ СОЗДАН
                </h3>
                <p className="text-sm text-red-300 font-mono mb-3">
                  ДЛЯ РАБОТЫ С СИСТЕМОЙ НЕОБХОДИМО СОЗДАТЬ И ЗАПОЛНИТЬ ПРОФИЛЬ АБИТУРИЕНТА.
                </p>
                <Link
                  href="/applicant/profile"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-800 text-red-200 border border-red-600 font-mono font-bold uppercase"
                >
                  <FileText className="h-4 w-4" />
                  СОЗДАТЬ ПРОФИЛЬ
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Предупреждение о незаполненном профиле */}
        {profile && !applicantProfile.isProfileComplete && (
          <div className="mb-8 bg-orange-900 border-2 border-orange-600 p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-400 mt-0.5" />
              <div>
                <h3 className="text-sm font-mono font-bold text-orange-200 mb-2 uppercase">
                  ВНИМАНИЕ: АНКЕТА НЕ ЗАПОЛНЕНА
                </h3>
                <p className="text-sm text-orange-300 font-mono mb-3">
                  ДЛЯ ПРОХОЖДЕНИЯ ТЕСТОВ НЕОБХОДИМО ЗАПОЛНИТЬ ПЕРСОНАЛЬНУЮ АНКЕТУ С ПАСПОРТНЫМИ ДАННЫМИ.
                </p>
                <div className="text-xs text-orange-400 font-mono mb-3">
                  СТАТУС ПРОФИЛЯ: {profile.isProfileComplete ? 'ЗАПОЛНЕН' : 'ТРЕБУЕТ ЗАПОЛНЕНИЯ'}
                  {profile.updatedAt && (
                    <span className="ml-2">
                      • ОБНОВЛЕН: {formatDate(profile.updatedAt)}
                    </span>
                  )}
                </div>
                <Link
                  href="/applicant/profile"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-orange-800 text-orange-200 border border-orange-600 font-mono font-bold uppercase"
                >
                  <FileText className="h-4 w-4" />
                  ЗАПОЛНИТЬ АНКЕТУ
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Уведомление о полном профиле */}
        {profile && applicantProfile.isProfileComplete && (
          <div className="mb-8 bg-green-900 border-2 border-green-600 p-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-400 mt-0.5" />
              <div>
                <h3 className="text-sm font-mono font-bold text-green-200 mb-2 uppercase">
                  ПРОФИЛЬ ЗАПОЛНЕН
                </h3>
                <p className="text-sm text-green-300 font-mono mb-2">
                  ВАША АНКЕТА ПОЛНОСТЬЮ ЗАПОЛНЕНА. ВЫ МОЖЕТЕ ПРОХОДИТЬ ТЕСТЫ.
                </p>
                <div className="text-xs text-green-400 font-mono">
                  ИМЯ: {applicantProfile.firstName} {applicantProfile.lastName}
                  {applicantProfile.middleName && ` ${applicantProfile.middleName}`}
                  {profile.updatedAt && (
                    <span className="ml-2">
                      • ОБНОВЛЕН: {formatDate(profile.updatedAt)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Основные метрики */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800 border-2 border-slate-600 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TestTube className="h-8 w-8 text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-mono font-bold text-slate-300 uppercase">
                  ТЕСТЫ ПРОЙДЕНО
                </p>
                <p className="text-2xl font-mono font-bold text-white">
                  {testingStats.testsCompleted}
                </p>
                <p className="text-xs text-slate-400 font-mono">
                  ИЗ {testingStats.testsAvailable} ДОСТУПНЫХ
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 border-2 border-slate-600 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Target className="h-8 w-8 text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-mono font-bold text-slate-300 uppercase">
                  СРЕДНИЙ БАЛЛ
                </p>
                <p className="text-2xl font-mono font-bold text-white">
                  {testingStats.averageScore}%
                </p>
                <p className="text-xs text-slate-400 font-mono">
                  ЛУЧШИЙ: {testingStats.bestScore}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 border-2 border-slate-600 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Award className="h-8 w-8 text-yellow-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-mono font-bold text-slate-300 uppercase">
                  ОЦЕНКА
                </p>
                <p className="text-2xl font-mono font-bold text-white">
                  {getTestGrade(testingStats.averageScore).toUpperCase()}
                </p>
                <p className="text-xs text-slate-400 font-mono">
                  ПО СРЕДНЕМУ БАЛЛУ
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 border-2 border-slate-600 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-8 w-8 text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-mono font-bold text-slate-300 uppercase">
                  ВРЕМЯ В ТЕСТАХ
                </p>
                <p className="text-2xl font-mono font-bold text-white">
                  {Math.floor(testingStats.totalTimeSpent / 3600)}Ч
                </p>
                <p className="text-xs text-slate-400 font-mono">
                  ОБЩЕЕ ВРЕМЯ
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Статус профиля */}
        <div className="mb-8 bg-slate-800 border-2 border-slate-600 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-mono font-bold text-white flex items-center gap-2 uppercase">
              <User className="h-5 w-5 text-blue-400" />
              СТАТУС ПРОФИЛЯ
            </h3>
            <div className="flex items-center gap-2">
              {applicantProfile.isProfileComplete ? (
                <span className="px-3 py-1 text-sm font-mono font-bold bg-green-800 text-green-200 border-2 border-green-600 uppercase">
                  <CheckCircle className="inline h-4 w-4 mr-1" />
                  ЗАПОЛНЕН
                </span>
              ) : (
                <span className="px-3 py-1 text-sm font-mono font-bold bg-yellow-800 text-yellow-200 border-2 border-yellow-600 uppercase">
                  <AlertTriangle className="inline h-4 w-4 mr-1" />
                  ТРЕБУЕТ ЗАПОЛНЕНИЯ
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-mono font-bold text-white uppercase border-b border-slate-600 pb-2 mb-3">
                ОСНОВНЫЕ ДАННЫЕ:
              </h4>
              <div className="space-y-2 text-sm text-slate-300 font-mono">
                <div className="flex justify-between">
                  <span>ИМЯ:</span>
                  <span className="font-bold text-white">
                    {applicantProfile.firstName || "НЕ УКАЗАНО"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>ФАМИЛИЯ:</span>
                  <span className="font-bold text-white">
                    {applicantProfile.lastName || "НЕ УКАЗАНО"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>ТЕЛЕФОН:</span>
                  <span className="font-bold text-white">
                    {applicantProfile.phone || "НЕ УКАЗАН"}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-mono font-bold text-white uppercase border-b border-slate-600 pb-2 mb-3">
                НАПРАВЛЕНИЕ:
              </h4>
              <div className="space-y-2 text-sm text-slate-300 font-mono">
                <div className="flex flex-col">
                  <span>СПЕЦИАЛЬНОСТЬ:</span>
                  <span className="font-bold text-white">
                    {applicantProfile.direction?.name || "НЕ ВЫБРАНО"}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span>ИНСТИТУТ:</span>
                  <span className="font-bold text-white">
                    {applicantProfile.institute?.name || "НЕ УКАЗАН"}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-mono font-bold text-white uppercase border-b border-slate-600 pb-2 mb-3">
                ДЕЙСТВИЯ:
              </h4>
              <div className="space-y-2">
                <Link
                  href="/applicant/profile"
                  className="block w-full text-center px-3 py-2 bg-blue-800 text-blue-200 border border-blue-600 font-mono font-bold text-xs uppercase"
                >
                  {applicantProfile.isProfileComplete ? "РЕДАКТИРОВАТЬ" : "ЗАПОЛНИТЬ"} ПРОФИЛЬ
                </Link>
                {profile && (
                  <div className="text-xs text-slate-400 font-mono text-center">
                    ID: {profile.$id.substring(0, 8)}...
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Прогресс обучения */}
        <div className="mb-8 bg-slate-800 border-2 border-slate-600 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-mono font-bold text-white flex items-center gap-2 uppercase">
              <TrendingUp className="h-5 w-5 text-green-400" />
              ПРОГРЕСС ОБУЧЕНИЯ
            </h3>
            <span className="text-sm font-mono font-bold text-white">
              {getProgressPercentage()}% ЗАВЕРШЕНО
            </span>
          </div>

          <div className="mb-4">
            <div className="w-full bg-slate-700 h-4 border-2 border-slate-600">
              <div
                className="bg-green-500 h-full transition-all duration-300"
                style={{ width: `${getProgressPercentage()}%` }}
              ></div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm font-mono">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {testingStats.testsCompleted}
              </div>
              <div className="text-slate-300 uppercase">ЗАВЕРШЕНО</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">
                {testingStats.testsAvailable - testingStats.testsCompleted}
              </div>
              <div className="text-slate-300 uppercase">ОСТАЛОСЬ</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">
                {testingStats.testsAvailable}
              </div>
              <div className="text-slate-300 uppercase">ВСЕГО</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Доступные тесты */}
          <div className="bg-slate-800 border-2 border-slate-600 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-mono font-bold text-white flex items-center gap-2 uppercase">
                <TestTube className="h-5 w-5 text-blue-400" />
                ДОСТУПНЫЕ ТЕСТЫ
              </h3>
              <Link
                href="/applicant/tests"
                className="text-blue-400 font-mono font-bold text-sm uppercase"
              >
                ПОСМОТРЕТЬ ВСЕ
              </Link>
            </div>

            {applicantProfile.isProfileComplete ? (
              availableTests.length > 0 ? (
                <div className="space-y-4">
                  {availableTests.slice(0, 3).map((test) => (
                    <div
                      key={test.$id}
                      className="flex items-center justify-between p-4 bg-slate-700 border border-slate-600"
                    >
                      <div className="flex-1">
                        <h4 className="font-mono font-bold text-white mb-1">
                          {test.title}
                        </h4>
                        <div className="flex items-center gap-4 text-sm text-slate-400 font-mono">
                          <span className="flex items-center gap-1">
                            <BookOpen className="h-3 w-3" />
                            {test.totalQuestions} ВОПРОСОВ
                          </span>
                          {test.timeLimit && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {test.timeLimit} МИН
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Target className="h-3 w-3" />
                            {test.maxScore} БАЛЛОВ
                          </span>
                        </div>
                      </div>

                      <Link
                        href={`/applicant/tests/${test.$id}`}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-800 text-blue-200 border border-blue-600 font-mono font-bold uppercase"
                      >
                        <Play className="h-4 w-4" />
                        ПРОЙТИ
                      </Link>
                    </div>
                  ))}

                  {availableTests.length > 3 && (
                    <div className="text-center pt-4">
                      <Link
                        href="/applicant/tests"
                        className="text-blue-400 font-mono font-bold text-sm uppercase"
                      >
                        ПОКАЗАТЬ ЕЩЕ {availableTests.length - 3} ТЕСТОВ
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <TestTube className="h-12 w-12 text-slate-500 mx-auto mb-3" />
                  <p className="text-slate-400 font-mono uppercase">
                    НЕТ ДОСТУПНЫХ ТЕСТОВ
                  </p>
                  <p className="text-slate-500 text-sm font-mono mt-1">
                    ТЕСТЫ ПОЯВЯТСЯ ПОСЛЕ ПУБЛИКАЦИИ КУРАТОРАМИ
                  </p>
                </div>
              )
            ) : (
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 text-orange-400 mx-auto mb-3" />
                <p className="text-orange-300 font-mono uppercase mb-2">
                  ЗАПОЛНИТЕ АНКЕТУ
                </p>
                <p className="text-slate-500 text-sm font-mono mb-4">
                  ДЛЯ ДОСТУПА К ТЕСТАМ НЕОБХОДИМО ЗАПОЛНИТЬ ПРОФИЛЬ
                </p>
                <Link
                  href="/applicant/profile"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-orange-800 text-orange-200 border border-orange-600 font-mono font-bold uppercase"
                >
                  <Edit className="h-4 w-4" />
                  ЗАПОЛНИТЬ АНКЕТУ
                </Link>
              </div>
            )}
          </div>

          {/* Последние результаты */}
          <div className="bg-slate-800 border-2 border-slate-600 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-mono font-bold text-white flex items-center gap-2 uppercase">
                <BarChart3 className="h-5 w-5 text-green-400" />
                ПОСЛЕДНИЕ РЕЗУЛЬТАТЫ
              </h3>
              <Link
                href="/applicant/results"
                className="text-green-400 font-mono font-bold text-sm uppercase"
              >
                ВСЕ РЕЗУЛЬТАТЫ
              </Link>
            </div>

            {testingStats.testsCompleted > 0 ? (
              <div className="space-y-4">
                {recentResults.slice(0, 3).map((result, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-slate-700 border border-slate-600"
                  >
                    <div className="flex-1">
                      <h4 className="font-mono font-bold text-white mb-1">
                        {result.testTitle}
                      </h4>
                      <div className="flex items-center gap-4 text-sm text-slate-400 font-mono">
                        <span>{formatDate(result.completedAt)}</span>
                        <span>{formatTime(result.completedAt)}</span>
                        <span>{formatTimeSpent(result.timeSpent)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-lg font-mono font-bold text-white">
                          {result.score}%
                        </div>
                        <div
                          className={`text-xs font-mono font-bold px-2 py-1 border ${getGradeColor(
                            result.grade
                          )} uppercase`}
                        >
                          {result.grade}
                        </div>
                      </div>

                      <button className="p-2 text-slate-400 border border-slate-600">
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 text-slate-500 mx-auto mb-3" />
                <p className="text-slate-400 font-mono uppercase">
                  НЕТ РЕЗУЛЬТАТОВ
                </p>
                <p className="text-slate-500 text-sm font-mono mt-1">
                  ПРОЙДИТЕ ПЕРВЫЙ ТЕСТ ЧТОБЫ УВИДЕТЬ РЕЗУЛЬТАТЫ
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Достижения */}
        <div className="mb-8 bg-slate-800 border-2 border-slate-600 p-6">
          <h3 className="text-lg font-mono font-bold text-white mb-6 flex items-center gap-2 uppercase">
            <Trophy className="h-5 w-5 text-yellow-400" />
            ДОСТИЖЕНИЯ
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {achievements.map((achievement, index) => (
              <div
                key={index}
                className={`p-4 border-2 ${
                  achievement.earned
                    ? "bg-slate-700 border-slate-600"
                    : "bg-slate-800 border-slate-700 opacity-50"
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className={`p-2 border ${
                      achievement.earned
                        ? achievement.color + " border-current"
                        : "text-slate-500 bg-slate-800 border-slate-600"
                    }`}
                  >
                    <achievement.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-mono font-bold text-white text-sm">
                      {achievement.title}
                    </h4>
                    <p className="text-xs text-slate-400 font-mono">
                      {achievement.description}
                    </p>
                  </div>
                </div>
                {achievement.earned && (
                  <div className="text-xs text-green-400 font-mono font-bold uppercase">
                    ✓ ПОЛУЧЕНО
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Информационные блоки */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Информация о профиле */}
          <div className="bg-blue-900 border-2 border-blue-600 p-6">
            <h3 className="text-lg font-mono font-bold text-blue-200 mb-4 flex items-center gap-2 uppercase">
              <User className="h-5 w-5" />
              ВАША ИНФОРМАЦИЯ
            </h3>
            <div className="space-y-3 text-blue-300 text-sm font-mono">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-blue-400" />
                <span>{user.email}</span>
              </div>
              {applicantProfile.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-blue-400" />
                  <span>{applicantProfile.phone}</span>
                </div>
              )}
              {applicantProfile.direction && (
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-blue-400" />
                  <span>{applicantProfile.direction.name}</span>
                </div>
              )}
              {applicantProfile.institute && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-blue-400" />
                  <span>{applicantProfile.institute.name}</span>
                </div>
              )}
              <div className="pt-3 border-t border-blue-700">
                <Link
                  href="/applicant/profile"
                  className="inline-flex items-center gap-2 text-blue-200 font-mono font-bold uppercase"
                >
                  <Edit className="h-4 w-4" />
                  РЕДАКТИРОВАТЬ ПРОФИЛЬ
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* Быстрые действия */}
          <div className="bg-green-900 border-2 border-green-600 p-6">
            <h3 className="text-lg font-mono font-bold text-green-200 mb-4 flex items-center gap-2 uppercase">
              <Zap className="h-5 w-5" />
              БЫСТРЫЕ ДЕЙСТВИЯ
            </h3>
            <div className="space-y-3">
              <Link
                href="/applicant/tests"
                className="flex items-center justify-between p-3 bg-green-800 border border-green-600"
              >
                <div className="flex items-center gap-2">
                  <TestTube className="h-4 w-4 text-green-200" />
                  <span className="text-green-200 font-mono font-bold uppercase">
                    ПРОЙТИ ТЕСТ
                  </span>
                </div>
                <ChevronRight className="h-4 w-4 text-green-400" />
              </Link>

              <Link
                href="/applicant/results"
                className="flex items-center justify-between p-3 bg-green-800 border border-green-600"
              >
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-green-200" />
                  <span className="text-green-200 font-mono font-bold uppercase">
                    МОИ РЕЗУЛЬТАТЫ
                  </span>
                </div>
                <ChevronRight className="h-4 w-4 text-green-400" />
              </Link>

              <Link
                href="/applicant/profile"
                className="flex items-center justify-between p-3 bg-green-800 border border-green-600"
              >
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-green-200" />
                  <span className="text-green-200 font-mono font-bold uppercase">
                    {applicantProfile.isProfileComplete ? "ПРОФИЛЬ" : "ЗАПОЛНИТЬ АНКЕТУ"}
                  </span>
                </div>
                <ChevronRight className="h-4 w-4 text-green-400" />
              </Link>

              {testingStats.lastTestDate && (
                <div className="pt-3 border-t border-green-700 text-xs text-green-300 font-mono">
                  ПОСЛЕДНЯЯ АКТИВНОСТЬ: {formatDate(testingStats.lastTestDate)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}