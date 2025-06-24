// src/app/(dashboard)/curator/dashboard/page.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useTestsByCurator } from "@/services/testService";
import { useActiveApplicants } from "@/services/authService";
import { useActiveDirections } from "@/services/instituteService";
import {
  TestWithDetails,
  formatTimeSpent,
  getTestGrade,
  getGradeColor,
} from "@/types";
import {
  TestTube,
  Users,
  GraduationCap,
  Plus,
  BarChart3,
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Activity,
  Eye,
  Edit,
  Play,
  FileText,
  Download,
  Upload,
  Target,
  Calendar,
  PieChart,
  Award,
  BookOpen,
  Zap,
} from "lucide-react";

export default function CuratorDashboard() {
  const { user } = useAuth();
  const { data: myTests = [], isLoading: testsLoading } = useTestsByCurator(
    user?.$id || ""
  );
  const { data: applicants = [] } = useActiveApplicants();
  const { data: directions = [] } = useActiveDirections();

  // Статистика по тестам
  const testStats = React.useMemo(() => {
    const published = myTests.filter((t) => t.isPublished && t.isActive);
    const drafts = myTests.filter((t) => !t.isPublished && t.isActive);
    const totalQuestions = myTests.reduce(
      (sum, t) => sum + (t.totalQuestions || 0),
      0
    );
    const averageQuestions =
      myTests.length > 0 ? Math.round(totalQuestions / myTests.length) : 0;

    return {
      total: myTests.length,
      published: published.length,
      drafts: drafts.length,
      totalQuestions,
      averageQuestions,
    };
  }, [myTests]);

  // TODO: Получить реальную статистику прохождений когда будет готов сервис
  const sessionStats = {
    totalSessions: 45,
    completedSessions: 38,
    averageScore: 76.8,
    passRate: 84.2,
  };

  // Последние активности (моковые данные)
  const recentActivities = [
    {
      type: "test_created",
      title: "СОЗДАН ТЕСТ",
      description: "МАТЕМАТИКА - АЛГЕБРА",
      time: "2 ЧАСА НАЗАД",
      icon: TestTube,
      color: "text-blue-400 bg-blue-800",
    },
    {
      type: "test_published",
      title: "ТЕСТ ОПУБЛИКОВАН",
      description: "ФИЗИКА - МЕХАНИКА",
      time: "5 ЧАСОВ НАЗАД",
      icon: Play,
      color: "text-green-400 bg-green-800",
    },
    {
      type: "applicant_completed",
      title: "ТЕСТ ЗАВЕРШЕН",
      description: "ИВАНОВ И.И. - 89 БАЛЛОВ",
      time: "1 ДЕНЬ НАЗАД",
      icon: CheckCircle,
      color: "text-emerald-400 bg-emerald-800",
    },
    {
      type: "test_edited",
      title: "ТЕСТ ОТРЕДАКТИРОВАН",
      description: "ДОБАВЛЕНО 5 ВОПРОСОВ",
      time: "2 ДНЯ НАЗАД",
      icon: Edit,
      color: "text-purple-400 bg-purple-800",
    },
  ];

  // Быстрые действия
  const quickActions = [
    {
      title: "СОЗДАТЬ ТЕСТ",
      description: "СОЗДАТЬ НОВЫЙ ТЕСТ ДЛЯ АБИТУРИЕНТОВ",
      href: "/curator/tests/create",
      icon: Plus,
    },
    {
      title: "ИМПОРТ ТЕСТОВ",
      description: "ИМПОРТИРОВАТЬ ТЕСТЫ ИЗ EXCEL ФАЙЛА",
      href: "/curator/tests/import",
      icon: Upload,
    },
    {
      title: "СТАТИСТИКА",
      description: "ПРОСМОТРЕТЬ ДЕТАЛЬНУЮ СТАТИСТИКУ",
      href: "/curator/statistics",
      icon: BarChart3,
    },
    {
      title: "ОТЧЕТЫ",
      description: "СГЕНЕРИРОВАТЬ ОТЧЕТЫ ПО ТЕСТИРОВАНИЮ",
      href: "/curator/reports",
      icon: FileText,
    },
  ];

  // Моковые данные для графиков успеваемости
  const performanceData = [
    { subject: "МАТЕМАТИКА", average: 78.5, sessions: 25 },
    { subject: "ФИЗИКА", average: 72.3, sessions: 18 },
    { subject: "ХИМИЯ", average: 81.2, sessions: 22 },
    { subject: "ИНФОРМАТИКА", average: 85.7, sessions: 15 },
  ];

  const getGradeDistribution = () => {
    // Моковые данные распределения оценок
    return [
      { grade: "ОТЛИЧНО", count: 15, percentage: 39.5, color: "bg-green-500" },
      { grade: "ХОРОШО", count: 12, percentage: 31.6, color: "bg-blue-500" },
      {
        grade: "УДОВЛЕТВОРИТЕЛЬНО",
        count: 8,
        percentage: 21.1,
        color: "bg-yellow-500",
      },
      {
        grade: "НЕУДОВЛЕТВОРИТЕЛЬНО",
        count: 3,
        percentage: 7.8,
        color: "bg-red-500",
      },
    ];
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat("ru-RU", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(num);
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
                ПАНЕЛЬ УПРАВЛЕНИЯ КУРАТОРА • СОЗДАВАЙТЕ ТЕСТЫ И ОТСЛЕЖИВАЙТЕ ПРОГРЕСС АБИТУРИЕНТОВ
              </p>
            </div>

            <div className="flex gap-3">
              <Link
                href="/curator/tests/create"
                className="flex items-center gap-2 px-4 py-2 bg-blue-800 text-blue-200 border-2 border-blue-600 font-mono font-bold uppercase"
              >
                <Plus className="h-4 w-4" />
                СОЗДАТЬ ТЕСТ
              </Link>

              <Link
                href="/curator/statistics"
                className="flex items-center gap-2 px-4 py-2 text-slate-300 bg-slate-800 border-2 border-slate-600 font-mono font-bold uppercase"
              >
                <BarChart3 className="h-4 w-4" />
                СТАТИСТИКА
              </Link>
            </div>
          </div>
        </div>

        {/* Основные метрики */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800 border-2 border-slate-600 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TestTube className="h-8 w-8 text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-mono font-bold text-slate-300 uppercase">
                  МОИ ТЕСТЫ
                </p>
                <p className="text-2xl font-mono font-bold text-white">
                  {testStats.total}
                </p>
                <p className="text-xs text-slate-400 font-mono">
                  {testStats.published} ОПУБЛИКОВАННЫХ
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 border-2 border-slate-600 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-mono font-bold text-slate-300 uppercase">
                  ПРОХОЖДЕНИЯ
                </p>
                <p className="text-2xl font-mono font-bold text-white">
                  {sessionStats.completedSessions}
                </p>
                <p className="text-xs text-slate-400 font-mono">
                  ИЗ {sessionStats.totalSessions} НАЧАТЫХ
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 border-2 border-slate-600 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Target className="h-8 w-8 text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-mono font-bold text-slate-300 uppercase">
                  СРЕДНИЙ БАЛЛ
                </p>
                <p className="text-2xl font-mono font-bold text-white">
                  {formatNumber(sessionStats.averageScore)}
                </p>
                <p className="text-xs text-slate-400 font-mono">
                  {formatNumber(sessionStats.passRate)}% УСПЕШНЫХ
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 border-2 border-slate-600 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BookOpen className="h-8 w-8 text-orange-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-mono font-bold text-slate-300 uppercase">
                  ВОПРОСЫ
                </p>
                <p className="text-2xl font-mono font-bold text-white">
                  {testStats.totalQuestions}
                </p>
                <p className="text-xs text-slate-400 font-mono">
                  ~{testStats.averageQuestions} НА ТЕСТ
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Быстрые действия */}
        <div className="mb-8">
          <h2 className="text-xl font-mono font-bold text-white mb-4 uppercase tracking-wide border-b border-slate-700 pb-2 flex items-center gap-2">
            <Zap className="h-6 w-6 text-yellow-400" />
            БЫСТРЫЕ ДЕЙСТВИЯ
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="bg-slate-800 border-2 border-slate-600 text-white p-6 block"
              >
                <div className="flex items-center justify-between mb-4">
                  <action.icon className="h-8 w-8 text-blue-400" />
                  <div className="text-xs text-slate-400 font-mono uppercase">
                    КУРАТОР
                  </div>
                </div>

                <h3 className="text-lg font-mono font-bold mb-2 text-white">
                  {action.title}
                </h3>
                <p className="text-sm text-slate-300 font-mono leading-relaxed">
                  {action.description}
                </p>
              </Link>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Мои тесты */}
          <div className="bg-slate-800 border-2 border-slate-600 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-mono font-bold text-white flex items-center gap-2 uppercase">
                <TestTube className="h-5 w-5 text-blue-400" />
                МОИ ТЕСТЫ
              </h3>
              <Link
                href="/curator/tests"
                className="text-blue-400 font-mono font-bold text-sm uppercase"
              >
                ПОСМОТРЕТЬ ВСЕ
              </Link>
            </div>

            {testsLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent"></div>
                <span className="ml-3 text-slate-300 font-mono">ЗАГРУЗКА...</span>
              </div>
            ) : myTests.length === 0 ? (
              <div className="text-center py-8">
                <TestTube className="h-12 w-12 text-slate-500 mx-auto mb-3" />
                <p className="text-slate-400 font-mono mb-4 uppercase">У ВАС ПОКА НЕТ ТЕСТОВ</p>
                <Link
                  href="/curator/tests/create"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-800 text-blue-200 border border-blue-600 font-mono font-bold uppercase"
                >
                  <Plus className="h-4 w-4" />
                  СОЗДАТЬ ПЕРВЫЙ ТЕСТ
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {myTests.slice(0, 5).map((test) => (
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
                        <span
                          className={`px-2 py-1 text-xs font-mono font-bold border ${
                            test.isPublished
                              ? "bg-green-800 text-green-200 border-green-600"
                              : "bg-yellow-800 text-yellow-200 border-yellow-600"
                          }`}
                        >
                          {test.isPublished ? "ОПУБЛИКОВАН" : "ЧЕРНОВИК"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/curator/tests/${test.$id}`}
                        className="p-2 text-blue-400 border border-blue-600 font-mono"
                        title="ПРОСМОТРЕТЬ"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <Link
                        href={`/curator/tests/${test.$id}/edit`}
                        className="p-2 text-slate-300 border border-slate-600 font-mono"
                        title="РЕДАКТИРОВАТЬ"
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                ))}

                {myTests.length > 5 && (
                  <div className="text-center pt-4">
                    <Link
                      href="/curator/tests"
                      className="text-blue-400 font-mono font-bold text-sm uppercase"
                    >
                      ПОКАЗАТЬ ЕЩЕ {myTests.length - 5} ТЕСТОВ
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Последние активности */}
          <div className="bg-slate-800 border-2 border-slate-600 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-mono font-bold text-white flex items-center gap-2 uppercase">
                <Activity className="h-5 w-5 text-green-400" />
                ПОСЛЕДНИЕ АКТИВНОСТИ
              </h3>
            </div>

            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div
                    className={`flex-shrink-0 p-2 ${activity.color}`}
                  >
                    <activity.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-mono font-bold text-white">
                      {activity.title}
                    </p>
                    <p className="text-sm text-slate-300 font-mono truncate">
                      {activity.description}
                    </p>
                    <p className="text-xs text-slate-400 font-mono mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Аналитика */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Успеваемость по предметам */}
          <div className="bg-slate-800 border-2 border-slate-600 p-6">
            <h3 className="text-lg font-mono font-bold text-white mb-6 flex items-center gap-2 uppercase">
              <TrendingUp className="h-5 w-5 text-purple-400" />
              УСПЕВАЕМОСТЬ ПО ПРЕДМЕТАМ
            </h3>

            <div className="space-y-4">
              {performanceData.map((subject) => (
                <div key={subject.subject} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-mono font-bold text-white">
                      {subject.subject}
                    </span>
                    <div className="text-right">
                      <span className="text-sm font-mono font-bold text-white">
                        {formatNumber(subject.average)}%
                      </span>
                      <span className="text-xs text-slate-400 font-mono ml-2">
                        ({subject.sessions} ТЕСТОВ)
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-700 h-2 border border-slate-600">
                    <div
                      className="bg-purple-500 h-full"
                      style={{ width: `${subject.average}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Распределение оценок */}
          <div className="bg-slate-800 border-2 border-slate-600 p-6">
            <h3 className="text-lg font-mono font-bold text-white mb-6 flex items-center gap-2 uppercase">
              <PieChart className="h-5 w-5 text-orange-400" />
              РАСПРЕДЕЛЕНИЕ ОЦЕНОК
            </h3>

            <div className="space-y-4">
              {getGradeDistribution().map((grade) => (
                <div
                  key={grade.grade}
                  className="flex items-center justify-between border-b border-slate-700 pb-2"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 ${grade.color}`}></div>
                    <span className="text-sm font-mono font-bold text-white">
                      {grade.grade}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-mono font-bold text-white">
                      {grade.count}
                    </span>
                    <span className="text-xs text-slate-400 font-mono ml-1">
                      ({formatNumber(grade.percentage)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-600">
              <Link
                href="/curator/statistics/detailed"
                className="flex items-center justify-center gap-2 w-full px-4 py-2 text-orange-200 bg-orange-800 border border-orange-600 font-mono font-bold uppercase"
              >
                <BarChart3 className="h-4 w-4" />
                ПОДРОБНАЯ СТАТИСТИКА
              </Link>
            </div>
          </div>
        </div>

        {/* Информационные блоки */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Советы для кураторов */}
          <div className="bg-blue-900 border-2 border-blue-600 p-6">
            <h3 className="text-lg font-mono font-bold text-blue-200 mb-4 flex items-center gap-2 uppercase">
              <Award className="h-5 w-5" />
              СОВЕТЫ ДЛЯ ЭФФЕКТИВНОГО ТЕСТИРОВАНИЯ
            </h3>
            <ul className="space-y-2 text-blue-300 text-sm font-mono">
              <li>• СОЗДАВАЙТЕ ТЕСТЫ С РАЗНЫМ УРОВНЕМ СЛОЖНОСТИ</li>
              <li>• УСТАНАВЛИВАЙТЕ ОПТИМАЛЬНОЕ ВРЕМЯ ДЛЯ ПРОХОЖДЕНИЯ</li>
              <li>• АНАЛИЗИРУЙТЕ СТАТИСТИКУ ДЛЯ УЛУЧШЕНИЯ ВОПРОСОВ</li>
              <li>• ИСПОЛЬЗУЙТЕ ИМПОРТ ДЛЯ БЫСТРОГО СОЗДАНИЯ ТЕСТОВ</li>
              <li>• РЕГУЛЯРНО ОБНОВЛЯЙТЕ БАНК ВОПРОСОВ</li>
            </ul>
          </div>

          {/* Быстрая статистика */}
          <div className="bg-green-900 border-2 border-green-600 p-6">
            <h3 className="text-lg font-mono font-bold text-green-200 mb-4 flex items-center gap-2 uppercase">
              <CheckCircle className="h-5 w-5" />
              ВАШИ ДОСТИЖЕНИЯ
            </h3>
            <div className="space-y-3 text-green-300 text-sm font-mono">
              <div className="flex justify-between border-b border-green-700 pb-1">
                <span>СОЗДАНО ТЕСТОВ:</span>
                <span className="font-bold">{testStats.total}</span>
              </div>
              <div className="flex justify-between border-b border-green-700 pb-1">
                <span>ВСЕГО ВОПРОСОВ:</span>
                <span className="font-bold">{testStats.totalQuestions}</span>
              </div>
              <div className="flex justify-between border-b border-green-700 pb-1">
                <span>ПРОХОЖДЕНИЙ:</span>
                <span className="font-bold">
                  {sessionStats.completedSessions}
                </span>
              </div>
              <div className="flex justify-between">
                <span>СРЕДНИЙ БАЛЛ:</span>
                <span className="font-bold">
                  {formatNumber(sessionStats.averageScore)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}