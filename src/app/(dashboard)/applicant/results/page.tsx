// src/app/(dashboard)/applicant/results/page.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useApplicantResults } from "@/services/testSessionService";
import { UserRole } from "@/types";
import {
  BarChart3,
  Trophy,
  Clock,
  Target,
  TrendingUp,
  Calendar,
  Eye,
  Download,
  Filter,
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  User,
  FileText,
  Award,
  Hash,
  Timer,
  Percent,
  RefreshCw,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Star,
  Zap,
  Activity,
  PieChart,
  BookOpen,
  Database,
  TrendingDown,
} from "lucide-react";

export default function ApplicantResultsPage() {
  const { user } = useAuth();
  const { data: results = [], isLoading, refetch } = useApplicantResults(user?.$id || "");

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "passed" | "failed">("all");
  const [sortBy, setSortBy] = useState<"date" | "score" | "test">("date");
  const [showFilters, setShowFilters] = useState(false);

  // Фильтрация и сортировка результатов
  const getFilteredResults = () => {
    let filteredResults = results;

    // Поиск
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filteredResults = filteredResults.filter(result => 
        result.test?.title.toLowerCase().includes(search) ||
        result.test?.description?.toLowerCase().includes(search)
      );
    }

    // Фильтр по статусу
    switch (filterStatus) {
      case "passed":
        filteredResults = filteredResults.filter(result => result.isPassed);
        break;
      case "failed":
        filteredResults = filteredResults.filter(result => !result.isPassed);
        break;
    }

    // Сортировка
    filteredResults.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime();
        case "score":
          return b.scorePercentage - a.scorePercentage;
        case "test":
          return (a.test?.title || "").localeCompare(b.test?.title || "");
        default:
          return new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime();
      }
    });

    return filteredResults;
  };

  const filteredResults = getFilteredResults();

  // Статистика
  const statistics = {
    totalTests: results.length,
    passedTests: results.filter(r => r.isPassed).length,
    failedTests: results.filter(r => !r.isPassed).length,
    averageScore: results.length > 0 
      ? Math.round((results.reduce((sum, r) => sum + r.scorePercentage, 0) / results.length) * 10) / 10
      : 0,
    bestScore: results.length > 0 
      ? Math.max(...results.map(r => r.scorePercentage))
      : 0,
    totalTimeSpent: results.reduce((sum, r) => sum + r.timeSpent, 0),
    passRate: results.length > 0 
      ? Math.round((results.filter(r => r.isPassed).length / results.length) * 100)
      : 0,
  };

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

  const formatTimeSpent = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}ч ${minutes}м`;
    } else if (minutes > 0) {
      return `${minutes}м ${secs}с`;
    } else {
      return `${secs}с`;
    }
  };

  const getGrade = (scorePercentage: number) => {
    if (scorePercentage >= 90) return "ОТЛИЧНО";
    if (scorePercentage >= 75) return "ХОРОШО"; 
    if (scorePercentage >= 60) return "УДОВЛЕТВОРИТЕЛЬНО";
    return "НЕУДОВЛЕТВОРИТЕЛЬНО";
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case "ОТЛИЧНО":
        return "text-green-400 bg-green-800 border-green-600";
      case "ХОРОШО":
        return "text-blue-400 bg-blue-800 border-blue-600";
      case "УДОВЛЕТВОРИТЕЛЬНО":
        return "text-yellow-400 bg-yellow-800 border-yellow-600";
      case "НЕУДОВЛЕТВОРИТЕЛЬНО":
        return "text-red-400 bg-red-800 border-red-600";
      default:
        return "text-slate-400 bg-slate-800 border-slate-600";
    }
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
                <BarChart3 className="h-8 w-8 text-green-400" />
                <h1 className="text-3xl font-mono font-bold text-white uppercase tracking-wide">
                  МОИ РЕЗУЛЬТАТЫ
                </h1>
              </div>
              <p className="text-slate-300 font-mono uppercase">
                ИСТОРИЯ ПРОХОЖДЕНИЯ ТЕСТОВ И СТАТИСТИКА УСПЕВАЕМОСТИ
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => refetch()}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 text-slate-300 bg-slate-800 border-2 border-slate-600 font-mono font-bold uppercase"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                ОБНОВИТЬ
              </button>

              <Link
                href="/applicant/tests"
                className="flex items-center gap-2 px-4 py-2 bg-blue-800 text-blue-200 border-2 border-blue-600 font-mono font-bold uppercase"
              >
                <FileText className="h-4 w-4" />
                ПРОЙТИ ТЕСТ
              </Link>

              <Link
                href="/applicant/dashboard"
                className="flex items-center gap-2 px-4 py-2 text-slate-300 bg-slate-800 border-2 border-slate-600 font-mono font-bold uppercase"
              >
                <ArrowLeft className="h-4 w-4" />
                НАЗАД
              </Link>
            </div>
          </div>
        </div>

        {/* Общая статистика */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-800 border-2 border-slate-600 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Hash className="h-8 w-8 text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-mono font-bold text-slate-300 uppercase">
                  ВСЕГО ТЕСТОВ
                </p>
                <p className="text-2xl font-mono font-bold text-white">
                  {statistics.totalTests}
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
                  {statistics.averageScore}%
                </p>
                <p className="text-xs text-slate-400 font-mono">
                  ЛУЧШИЙ: {statistics.bestScore}%
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
                  ПРОЦЕНТ УСПЕХА
                </p>
                <p className="text-2xl font-mono font-bold text-white">
                  {statistics.passRate}%
                </p>
                <p className="text-xs text-slate-400 font-mono">
                  {statistics.passedTests} ИЗ {statistics.totalTests}
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
                  {Math.floor(statistics.totalTimeSpent / 3600)}Ч
                </p>
                <p className="text-xs text-slate-400 font-mono">
                  ОБЩЕЕ ВРЕМЯ
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Детальная статистика */}
        <div className="mb-8 bg-slate-800 border-2 border-slate-600 p-6">
          <h3 className="text-lg font-mono font-bold text-white mb-6 uppercase border-b border-slate-600 pb-2 flex items-center gap-2">
            <PieChart className="h-5 w-5 text-orange-400" />
            ДЕТАЛЬНАЯ СТАТИСТИКА
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <h4 className="font-mono font-bold text-white uppercase border-b border-slate-600 pb-2">
                РАСПРЕДЕЛЕНИЕ ОЦЕНОК:
              </h4>
              <div className="space-y-2">
                {["ОТЛИЧНО", "ХОРОШО", "УДОВЛЕТВОРИТЕЛЬНО", "НЕУДОВЛЕТВОРИТЕЛЬНО"].map((grade) => {
                  const count = results.filter(r => getGrade(r.scorePercentage) === grade).length;
                  const percentage = results.length > 0 ? Math.round((count / results.length) * 100) : 0;
                  
                  return (
                    <div key={grade} className="flex items-center justify-between text-sm font-mono">
                      <span className={`px-2 py-1 border ${getGradeColor(grade)} text-xs uppercase`}>
                        {grade}
                      </span>
                      <span className="text-white">{count} ({percentage}%)</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-mono font-bold text-white uppercase border-b border-slate-600 pb-2">
                СТАТУС ПРОХОЖДЕНИЯ:
              </h4>
              <div className="space-y-2 text-sm font-mono">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="text-slate-300">ПРОЙДЕНО</span>
                  </div>
                  <span className="text-white font-bold">{statistics.passedTests}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-400" />
                    <span className="text-slate-300">НЕ ПРОЙДЕНО</span>
                  </div>
                  <span className="text-white font-bold">{statistics.failedTests}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-blue-400" />
                    <span className="text-slate-300">УСПЕШНОСТЬ</span>
                  </div>
                  <span className="text-white font-bold">{statistics.passRate}%</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-mono font-bold text-white uppercase border-b border-slate-600 pb-2">
                ВРЕМЕННЫЕ ПОКАЗАТЕЛИ:
              </h4>
              <div className="space-y-2 text-sm font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">ОБЩЕЕ ВРЕМЯ:</span>
                  <span className="text-white font-bold">{formatTimeSpent(statistics.totalTimeSpent)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">СРЕДНЕЕ ВРЕМЯ:</span>
                  <span className="text-white font-bold">
                    {results.length > 0 ? formatTimeSpent(Math.round(statistics.totalTimeSpent / results.length)) : "0с"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">ВСЕГО ТЕСТОВ:</span>
                  <span className="text-white font-bold">{statistics.totalTests}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Фильтры */}
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    placeholder="ВВЕДИТЕ НАЗВАНИЕ..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-mono font-bold text-slate-300 mb-2 uppercase">
                  СТАТУС
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="w-full px-3 py-2 border-2 border-slate-600 bg-slate-700 text-white font-mono uppercase"
                >
                  <option value="all">ВСЕ РЕЗУЛЬТАТЫ</option>
                  <option value="passed">ТОЛЬКО ПРОЙДЕННЫЕ</option>
                  <option value="failed">ТОЛЬКО НЕПРОЙДЕННЫЕ</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-mono font-bold text-slate-300 mb-2 uppercase">
                  СОРТИРОВКА
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full px-3 py-2 border-2 border-slate-600 bg-slate-700 text-white font-mono uppercase"
                >
                  <option value="date">ПО ДАТЕ</option>
                  <option value="score">ПО БАЛЛУ</option>
                  <option value="test">ПО НАЗВАНИЮ ТЕСТА</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Список результатов */}
        {isLoading ? (
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-400 mx-auto mb-4" />
            <p className="text-slate-300 font-mono">ЗАГРУЗКА РЕЗУЛЬТАТОВ...</p>
          </div>
        ) : filteredResults.length > 0 ? (
          <div className="space-y-6">
            {filteredResults.map((result) => (
              <div key={result.$id} className="bg-slate-800 border-2 border-slate-600 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Заголовок */}
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-mono font-bold text-white uppercase">
                        {result.test?.title || "НЕИЗВЕСТНЫЙ ТЕСТ"}
                      </h3>
                      
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 text-sm font-mono font-bold border-2 uppercase ${getGradeColor(getGrade(result.scorePercentage))}`}>
                          {getGrade(result.scorePercentage)}
                        </span>
                        
                        {result.isPassed ? (
                          <CheckCircle className="h-5 w-5 text-green-400" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-400" />
                        )}
                      </div>
                    </div>

                    {/* Основные показатели */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <Percent className="h-4 w-4 text-blue-400" />
                        <div>
                          <div className="text-sm font-mono font-bold text-slate-300 uppercase">
                            РЕЗУЛЬТАТ
                          </div>
                          <div className="text-lg font-mono font-bold text-white">
                            {result.scorePercentage}%
                          </div>
                          <div className="text-xs text-slate-400 font-mono">
                            {result.totalScore} ИЗ {result.maxPossibleScore}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-green-400" />
                        <div>
                          <div className="text-sm font-mono font-bold text-slate-300 uppercase">
                            ПРАВИЛЬНЫХ
                          </div>
                          <div className="text-lg font-mono font-bold text-white">
                            {result.correctAnswers}
                          </div>
                          <div className="text-xs text-slate-400 font-mono">
                            ИЗ {result.totalQuestions}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Timer className="h-4 w-4 text-yellow-400" />
                        <div>
                          <div className="text-sm font-mono font-bold text-slate-300 uppercase">
                            ВРЕМЯ
                          </div>
                          <div className="text-lg font-mono font-bold text-white">
                            {formatTimeSpent(result.timeSpent)}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-purple-400" />
                        <div>
                          <div className="text-sm font-mono font-bold text-slate-300 uppercase">
                            ДАТА
                          </div>
                          <div className="text-lg font-mono font-bold text-white">
                            {formatDate(result.$createdAt)}
                          </div>
                          <div className="text-xs text-slate-400 font-mono">
                            {formatTime(result.$createdAt)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Дополнительная информация */}
                    <div className="flex items-center gap-4 text-sm text-slate-400 font-mono">
                      <span>ОТВЕЧЕНО: {result.answeredQuestions} ВОПРОСОВ</span>
                      <span>•</span>
                      <span>СТАТУС: {result.isPassed ? "ПРОЙДЕН" : "НЕ ПРОЙДЕН"}</span>
                      {result.test?.direction && (
                        <>
                          <span>•</span>
                          <span>НАПРАВЛЕНИЕ: {result.test.direction.name}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Действия */}
                  <div className="ml-6 flex flex-col gap-2">
                    <Link
                      href={`/applicant/results/${result.$id}`}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-800 text-blue-200 border-2 border-blue-600 font-mono font-bold uppercase text-center"
                    >
                      <Eye className="h-4 w-4" />
                      ПОДРОБНО
                    </Link>
                    
                    <button
                      className="flex items-center gap-2 px-4 py-2 text-slate-300 bg-slate-700 border-2 border-slate-600 font-mono font-bold uppercase"
                      onClick={() => {
                        // Логика экспорта результата в PDF или другой формат
                      }}
                    >
                      <Download className="h-4 w-4" />
                      ЭКСПОРТ
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <BarChart3 className="h-16 w-16 text-slate-500 mx-auto mb-4" />
            <h3 className="text-xl font-mono font-bold text-white mb-2 uppercase">
              {results.length === 0 ? "НЕТ РЕЗУЛЬТАТОВ" : "РЕЗУЛЬТАТЫ НЕ НАЙДЕНЫ"}
            </h3>
            <p className="text-slate-400 font-mono mb-4">
              {results.length === 0 
                ? "ВЫ ЕЩЕ НЕ ПРОХОДИЛИ НИ ОДНОГО ТЕСТА" 
                : "ПО ВАШЕМУ ЗАПРОСУ НЕ НАЙДЕНО НИ ОДНОГО РЕЗУЛЬТАТА"
              }
            </p>
            {results.length === 0 ? (
              <Link
                href="/applicant/tests"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-800 text-blue-200 border-2 border-blue-600 font-mono font-bold uppercase"
              >
                <FileText className="h-4 w-4" />
                ПРОЙТИ ПЕРВЫЙ ТЕСТ
              </Link>
            ) : (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setFilterStatus("all");
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700 text-slate-300 border-2 border-slate-600 font-mono font-bold uppercase"
              >
                <RefreshCw className="h-4 w-4" />
                СБРОСИТЬ ФИЛЬТРЫ
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}