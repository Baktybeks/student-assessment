// src/app/(dashboard)/applicant/tests/page.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useProfileByUserId } from "@/services/profileService";
import { usePublishedTests, useTestsByDirection } from "@/services/testService";
import { useActiveSession } from "@/services/testSessionService";
import { UserRole } from "@/types";
import {
  TestTube,
  Search,
  Filter,
  Clock,
  Target,
  BookOpen,
  User,
  AlertTriangle,
  CheckCircle,
  Play,
  Eye,
  RotateCcw,
  Star,
  Award,
  TrendingUp,
  FileText,
  Users,
  Zap,
  Activity,
  BarChart3,
  ChevronDown,
  ChevronRight,
  Edit,
  Calendar,
  Hash,
  Database,
} from "lucide-react";

export default function ApplicantTestsPage() {
  const { user } = useAuth();
  const { data: profile } = useProfileByUserId(user?.$id || "");
  const { data: allPublishedTests = [] } = usePublishedTests();
  const { data: directionTests = [] } = useTestsByDirection(
    profile?.directionId || ""
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "my-direction" | "available">("all");
  const [sortBy, setSortBy] = useState<"title" | "difficulty" | "questions" | "time">("title");
  const [showFilters, setShowFilters] = useState(false);

  // Фильтрация тестов
  const getFilteredTests = () => {
    let tests = allPublishedTests;

    // Фильтр по типу
    switch (filterType) {
      case "my-direction":
        tests = directionTests;
        break;
      case "available":
        tests = allPublishedTests.filter(test => {
          // Здесь можно добавить логику проверки уже пройденных тестов
          return true;
        });
        break;
      default:
        tests = allPublishedTests;
    }

    // Поиск
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      tests = tests.filter(test =>
        test.title.toLowerCase().includes(search) ||
        test.description?.toLowerCase().includes(search) ||
        test.direction?.name.toLowerCase().includes(search)
      );
    }

    // Сортировка
    tests.sort((a, b) => {
      switch (sortBy) {
        case "title":
          return a.title.localeCompare(b.title);
        case "questions":
          return (b.totalQuestions || 0) - (a.totalQuestions || 0);
        case "time":
          return (a.timeLimit || 0) - (b.timeLimit || 0);
        default:
          return a.title.localeCompare(b.title);
      }
    });

    return tests;
  };

  const filteredTests = getFilteredTests();

  const formatTimeLimit = (minutes?: number) => {
    if (!minutes) return "БЕЗ ОГРАНИЧЕНИЙ";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}Ч ${mins}М`;
    }
    return `${mins}М`;
  };

  const getDifficultyColor = (passingScore?: number) => {
    if (!passingScore) return "text-gray-400";
    if (passingScore >= 80) return "text-red-400";
    if (passingScore >= 65) return "text-yellow-400";
    return "text-green-400";
  };

  const getDifficultyText = (passingScore?: number) => {
    if (!passingScore) return "НЕ ЗАДАН";
    if (passingScore >= 80) return "ВЫСОКАЯ";
    if (passingScore >= 65) return "СРЕДНЯЯ";
    return "НИЗКАЯ";
  };

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

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Заголовок */}
        <div className="mb-8 border-b-2 border-slate-700 pb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <TestTube className="h-8 w-8 text-blue-400" />
                <h1 className="text-3xl font-mono font-bold text-white uppercase tracking-wide">
                  ДОСТУПНЫЕ ТЕСТЫ
                </h1>
              </div>
              <p className="text-slate-300 font-mono uppercase">
                ВЫБЕРИТЕ ТЕСТ ДЛЯ ПРОХОЖДЕНИЯ И ОЦЕНКИ ЗНАНИЙ
              </p>
              {profile?.direction && (
                <div className="mt-2 flex items-center gap-2 text-sm font-mono text-slate-400">
                  <Target className="h-4 w-4" />
                  <span>ВАШЕ НАПРАВЛЕНИЕ: {profile.direction.name}</span>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Link
                href="/applicant/results"
                className="flex items-center gap-2 px-4 py-2 text-slate-300 bg-slate-800 border-2 border-slate-600 font-mono font-bold uppercase"
              >
                <BarChart3 className="h-4 w-4" />
                МОИ РЕЗУЛЬТАТЫ
              </Link>

              <Link
                href="/applicant/dashboard"
                className="flex items-center gap-2 px-4 py-2 bg-blue-800 text-blue-200 border-2 border-blue-600 font-mono font-bold uppercase"
              >
                <User className="h-4 w-4" />
                ПРОФИЛЬ
              </Link>
            </div>
          </div>
        </div>

        {/* Предупреждение если профиль не заполнен */}
        {!profile?.isProfileComplete && (
          <div className="mb-8 bg-orange-900 border-2 border-orange-600 p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-400 mt-0.5" />
              <div>
                <h3 className="text-sm font-mono font-bold text-orange-200 mb-2 uppercase">
                  ПРОФИЛЬ НЕ ЗАПОЛНЕН
                </h3>
                <p className="text-sm text-orange-300 font-mono mb-3">
                  ДЛЯ ПРОХОЖДЕНИЯ ТЕСТОВ НЕОБХОДИМО ЗАПОЛНИТЬ ПЕРСОНАЛЬНУЮ АНКЕТУ.
                  БЕЗ ЗАПОЛНЕННОГО ПРОФИЛЯ ТЕСТИРОВАНИЕ НЕДОСТУПНО.
                </p>
                <Link
                  href="/applicant/profile"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-orange-800 text-orange-200 border border-orange-600 font-mono font-bold uppercase"
                >
                  <Edit className="h-4 w-4" />
                  ЗАПОЛНИТЬ АНКЕТУ
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Фильтры и поиск */}
        <div className="mb-8 bg-slate-800 border-2 border-slate-600 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-mono font-bold text-white uppercase flex items-center gap-2">
              <Filter className="h-5 w-5 text-green-400" />
              ФИЛЬТРЫ И ПОИСК
            </h3>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 text-slate-300 font-mono font-bold uppercase"
            >
              {showFilters ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              {showFilters ? "СКРЫТЬ" : "ПОКАЗАТЬ"}
            </button>
          </div>

          {showFilters && (
            <div className="space-y-4">
              {/* Поиск */}
              <div>
                <label className="block text-sm font-mono font-bold text-slate-300 mb-2 uppercase">
                  ПОИСК ПО НАЗВАНИЮ
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border-2 border-slate-600 bg-slate-700 text-white font-mono placeholder-slate-400 uppercase"
                    placeholder="ВВЕДИТЕ НАЗВАНИЕ ТЕСТА..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Фильтр по типу */}
                <div>
                  <label className="block text-sm font-mono font-bold text-slate-300 mb-2 uppercase">
                    ТИП ТЕСТОВ
                  </label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as any)}
                    className="w-full px-3 py-2 border-2 border-slate-600 bg-slate-700 text-white font-mono uppercase"
                  >
                    <option value="all">ВСЕ ТЕСТЫ</option>
                    <option value="my-direction">МОЁ НАПРАВЛЕНИЕ</option>
                    <option value="available">ДОСТУПНЫЕ ДЛЯ ПРОХОЖДЕНИЯ</option>
                  </select>
                </div>

                {/* Сортировка */}
                <div>
                  <label className="block text-sm font-mono font-bold text-slate-300 mb-2 uppercase">
                    СОРТИРОВКА
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="w-full px-3 py-2 border-2 border-slate-600 bg-slate-700 text-white font-mono uppercase"
                  >
                    <option value="title">ПО НАЗВАНИЮ</option>
                    <option value="questions">ПО КОЛИЧЕСТВУ ВОПРОСОВ</option>
                    <option value="time">ПО ВРЕМЕНИ</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Статистика */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-800 border-2 border-slate-600 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Database className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-mono font-bold text-slate-300 uppercase">
                  ВСЕГО ТЕСТОВ
                </p>
                <p className="text-lg font-mono font-bold text-white">
                  {allPublishedTests.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 border-2 border-slate-600 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Target className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-mono font-bold text-slate-300 uppercase">
                  МОЁ НАПРАВЛЕНИЕ
                </p>
                <p className="text-lg font-mono font-bold text-white">
                  {directionTests.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 border-2 border-slate-600 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Search className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-mono font-bold text-slate-300 uppercase">
                  НАЙДЕНО
                </p>
                <p className="text-lg font-mono font-bold text-white">
                  {filteredTests.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 border-2 border-slate-600 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-6 w-6 text-purple-400" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-mono font-bold text-slate-300 uppercase">
                  ДОСТУПНО
                </p>
                <p className="text-lg font-mono font-bold text-white">
                  {profile?.isProfileComplete ? filteredTests.length : 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Список тестов */}
        {profile?.isProfileComplete ? (
          filteredTests.length > 0 ? (
            <div className="space-y-6">
              {filteredTests.map((test) => (
                <TestCard key={test.$id} test={test} userProfile={profile} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <TestTube className="h-16 w-16 text-slate-500 mx-auto mb-4" />
              <h3 className="text-xl font-mono font-bold text-white mb-2 uppercase">
                ТЕСТЫ НЕ НАЙДЕНЫ
              </h3>
              <p className="text-slate-400 font-mono mb-4">
                ПО ВАШЕМУ ЗАПРОСУ НЕ НАЙДЕНО НИ ОДНОГО ТЕСТА
              </p>
              <button
                onClick={() => {
                  setSearchTerm("");
                  setFilterType("all");
                }}
                className="flex items-center gap-2 mx-auto px-4 py-2 bg-blue-800 text-blue-200 border-2 border-blue-600 font-mono font-bold uppercase"
              >
                <RotateCcw className="h-4 w-4" />
                СБРОСИТЬ ФИЛЬТРЫ
              </button>
            </div>
          )
        ) : (
          <div className="text-center py-12">
            <AlertTriangle className="h-16 w-16 text-orange-400 mx-auto mb-4" />
            <h3 className="text-xl font-mono font-bold text-white mb-2 uppercase">
              ТЕСТИРОВАНИЕ НЕДОСТУПНО
            </h3>
            <p className="text-slate-400 font-mono mb-4">
              ДЛЯ ПРОХОЖДЕНИЯ ТЕСТОВ НЕОБХОДИМО ЗАПОЛНИТЬ АНКЕТУ
            </p>
            <Link
              href="/applicant/profile"
              className="inline-flex items-center gap-2 px-6 py-3 bg-orange-800 text-orange-200 border-2 border-orange-600 font-mono font-bold uppercase"
            >
              <Edit className="h-4 w-4" />
              ЗАПОЛНИТЬ АНКЕТУ
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

// Компонент карточки теста
function TestCard({ test, userProfile }: { test: any; userProfile: any }) {
  const { data: activeSession } = useActiveSession(test.$id, userProfile.userId);

  return (
    <div className="bg-slate-800 border-2 border-slate-600 p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Заголовок теста */}
          <div className="mb-4">
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-xl font-mono font-bold text-white uppercase">
                {test.title}
              </h3>
              
              {activeSession && (
                <span className="px-3 py-1 text-xs font-mono font-bold bg-orange-800 text-orange-200 border border-orange-600 uppercase">
                  АКТИВНАЯ СЕССИЯ
                </span>
              )}
            </div>

            {test.description && (
              <p className="text-slate-300 font-mono mb-3 leading-relaxed">
                {test.description}
              </p>
            )}

            {/* Информация о направлении */}
            {test.direction && (
              <div className="flex items-center gap-2 text-sm text-slate-400 font-mono mb-3">
                <BookOpen className="h-4 w-4" />
                <span>{test.direction.name}</span>
                {test.institute && (
                  <>
                    <span>•</span>
                    <span>{test.institute.name}</span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Характеристики теста */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-blue-400" />
              <div>
                <div className="text-sm font-mono font-bold text-slate-300 uppercase">
                  ВОПРОСОВ
                </div>
                <div className="text-lg font-mono font-bold text-white">
                  {test.totalQuestions || 0}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-400" />
              <div>
                <div className="text-sm font-mono font-bold text-slate-300 uppercase">
                  ВРЕМЯ
                </div>
                <div className="text-lg font-mono font-bold text-white">
                  {formatTimeLimit(test.timeLimit)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-green-400" />
              <div>
                <div className="text-sm font-mono font-bold text-slate-300 uppercase">
                  МАКС. БАЛЛ
                </div>
                <div className="text-lg font-mono font-bold text-white">
                  {test.maxScore || 100}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-purple-400" />
              <div>
                <div className="text-sm font-mono font-bold text-slate-300 uppercase">
                  СЛОЖНОСТЬ
                </div>
                <div className={`text-lg font-mono font-bold ${getDifficultyColor(test.passingScore)}`}>
                  {getDifficultyText(test.passingScore)}
                </div>
              </div>
            </div>
          </div>

          {/* Требования для прохождения */}
          <div className="mb-6 p-4 bg-slate-700 border border-slate-600">
            <h4 className="text-sm font-mono font-bold text-slate-300 mb-2 uppercase">
              ТРЕБОВАНИЯ ДЛЯ ПРОХОЖДЕНИЯ:
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-slate-400 font-mono">
              <div>• ЗАПОЛНЕННЫЙ ПРОФИЛЬ АБИТУРИЕНТА</div>
              <div>• МИНИМАЛЬНЫЙ ПРОХОДНОЙ БАЛЛ: {test.passingScore || 60}%</div>
              {test.timeLimit && <div>• ЛИМИТ ВРЕМЕНИ: {formatTimeLimit(test.timeLimit)}</div>}
              <div>• ОДНА ПОПЫТКА НА ТЕСТ</div>
            </div>
          </div>
        </div>

        {/* Действия */}
        <div className="ml-6 flex flex-col gap-3">
          {activeSession ? (
            <Link
              href={`/applicant/tests/${test.$id}`}
              className="flex items-center gap-2 px-6 py-3 bg-orange-800 text-orange-200 border-2 border-orange-600 font-mono font-bold uppercase text-center"
            >
              <Play className="h-4 w-4" />
              ПРОДОЛЖИТЬ
            </Link>
          ) : (
            <Link
              href={`/applicant/tests/${test.$id}`}
              className="flex items-center gap-2 px-6 py-3 bg-green-800 text-green-200 border-2 border-green-600 font-mono font-bold uppercase text-center"
            >
              <Play className="h-4 w-4" />
              НАЧАТЬ ТЕСТ
            </Link>
          )}

          <button
            className="flex items-center gap-2 px-6 py-3 text-slate-300 bg-slate-700 border-2 border-slate-600 font-mono font-bold uppercase"
            onClick={() => {
              // Открыть модальное окно с подробной информацией о тесте
            }}
          >
            <Eye className="h-4 w-4" />
            ПОДРОБНЕЕ
          </button>
        </div>
      </div>
    </div>
  );
}

function formatTimeLimit(minutes?: number): string {
  if (!minutes) return "БЕЗ ОГРАНИЧЕНИЙ";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}Ч ${mins}М`;
  }
  return `${mins}М`;
}

function getDifficultyColor(passingScore?: number): string {
  if (!passingScore) return "text-gray-400";
  if (passingScore >= 80) return "text-red-400";
  if (passingScore >= 65) return "text-yellow-400";
  return "text-green-400";
}

function getDifficultyText(passingScore?: number): string {
  if (!passingScore) return "НЕ ЗАДАН";
  if (passingScore >= 80) return "ВЫСОКАЯ";
  if (passingScore >= 65) return "СРЕДНЯЯ";
  return "НИЗКАЯ";
}