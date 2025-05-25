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
      title: "Создан тест",
      description: "Математика - Алгебра",
      time: "2 часа назад",
      icon: TestTube,
      color: "text-blue-600 bg-blue-100",
    },
    {
      type: "test_published",
      title: "Тест опубликован",
      description: "Физика - Механика",
      time: "5 часов назад",
      icon: Play,
      color: "text-green-600 bg-green-100",
    },
    {
      type: "applicant_completed",
      title: "Тест завершен",
      description: "Иванов И.И. - 89 баллов",
      time: "1 день назад",
      icon: CheckCircle,
      color: "text-emerald-600 bg-emerald-100",
    },
    {
      type: "test_edited",
      title: "Тест отредактирован",
      description: "Добавлено 5 вопросов",
      time: "2 дня назад",
      icon: Edit,
      color: "text-purple-600 bg-purple-100",
    },
  ];

  // Быстрые действия
  const quickActions = [
    {
      title: "Создать тест",
      description: "Создать новый тест для абитуриентов",
      href: "/curator/tests/create",
      icon: Plus,
      color: "bg-blue-600 hover:bg-blue-700",
    },
    {
      title: "Импорт тестов",
      description: "Импортировать тесты из Excel файла",
      href: "/curator/tests/import",
      icon: Upload,
      color: "bg-green-600 hover:bg-green-700",
    },
    {
      title: "Статистика",
      description: "Просмотреть детальную статистику",
      href: "/curator/statistics",
      icon: BarChart3,
      color: "bg-purple-600 hover:bg-purple-700",
    },
    {
      title: "Отчеты",
      description: "Сгенерировать отчеты по тестированию",
      href: "/curator/reports",
      icon: FileText,
      color: "bg-orange-600 hover:bg-orange-700",
    },
  ];

  // Моковые данные для графиков успеваемости
  const performanceData = [
    { subject: "Математика", average: 78.5, sessions: 25 },
    { subject: "Физика", average: 72.3, sessions: 18 },
    { subject: "Химия", average: 81.2, sessions: 22 },
    { subject: "Информатика", average: 85.7, sessions: 15 },
  ];

  const getGradeDistribution = () => {
    // Моковые данные распределения оценок
    return [
      { grade: "Отлично", count: 15, percentage: 39.5, color: "bg-green-500" },
      { grade: "Хорошо", count: 12, percentage: 31.6, color: "bg-blue-500" },
      {
        grade: "Удовлетворительно",
        count: 8,
        percentage: 21.1,
        color: "bg-yellow-500",
      },
      {
        grade: "Неудовлетворительно",
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
      <div className="p-6 max-w-7xl mx-auto">
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
    <div className="p-6 max-w-7xl mx-auto">
      {/* Приветствие */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Добро пожаловать, {user.name}!
            </h1>
            <p className="text-gray-600">
              Панель управления куратора • Создавайте тесты и отслеживайте
              прогресс абитуриентов
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href="/curator/tests/create"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Создать тест
            </Link>

            <Link
              href="/curator/statistics"
              className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <BarChart3 className="h-4 w-4" />
              Статистика
            </Link>
          </div>
        </div>
      </div>

      {/* Основные метрики */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TestTube className="h-8 w-8 text-blue-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Мои тесты</p>
              <p className="text-2xl font-bold text-gray-900">
                {testStats.total}
              </p>
              <p className="text-xs text-gray-500">
                {testStats.published} опубликованных
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-green-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Прохождения</p>
              <p className="text-2xl font-bold text-gray-900">
                {sessionStats.completedSessions}
              </p>
              <p className="text-xs text-gray-500">
                из {sessionStats.totalSessions} начатых
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
              <p className="text-sm font-medium text-gray-600">Средний балл</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(sessionStats.averageScore)}
              </p>
              <p className="text-xs text-gray-500">
                {formatNumber(sessionStats.passRate)}% успешных
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BookOpen className="h-8 w-8 text-orange-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Вопросы</p>
              <p className="text-2xl font-bold text-gray-900">
                {testStats.totalQuestions}
              </p>
              <p className="text-xs text-gray-500">
                ~{testStats.averageQuestions} на тест
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Быстрые действия */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Zap className="h-6 w-6 text-yellow-500" />
          Быстрые действия
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className={`${action.color} text-white p-6 rounded-lg shadow-md transition-all duration-200 transform hover:scale-105 hover:shadow-lg relative overflow-hidden`}
            >
              <div className="flex items-center justify-between mb-4">
                <action.icon className="h-8 w-8" />
                <div className="text-xs opacity-75">Куратор</div>
              </div>

              <h3 className="text-lg font-bold mb-2">{action.title}</h3>
              <p className="text-sm opacity-90 leading-relaxed">
                {action.description}
              </p>

              {/* Декоративный элемент */}
              <div className="absolute top-2 right-2">
                <div className="w-3 h-3 bg-white bg-opacity-30 rounded-full animate-pulse"></div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Мои тесты */}
        <div className="bg-white rounded-lg shadow border p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <TestTube className="h-5 w-5 text-blue-500" />
              Мои тесты
            </h3>
            <Link
              href="/curator/tests"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Посмотреть все →
            </Link>
          </div>

          {testsLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : myTests.length === 0 ? (
            <div className="text-center py-8">
              <TestTube className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 mb-4">У вас пока нет тестов</p>
              <Link
                href="/curator/tests/create"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Создать первый тест
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {myTests.slice(0, 5).map((test) => (
                <div
                  key={test.$id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 mb-1">
                      {test.title}
                    </h4>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-3 w-3" />
                        {test.totalQuestions} вопросов
                      </span>
                      {test.timeLimit && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {test.timeLimit} мин
                        </span>
                      )}
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          test.isPublished
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {test.isPublished ? "Опубликован" : "Черновик"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/curator/tests/${test.$id}`}
                      className="p-2 text-blue-600 hover:text-blue-800 transition-colors"
                      title="Просмотреть"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                    <Link
                      href={`/curator/tests/${test.$id}/edit`}
                      className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
                      title="Редактировать"
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
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Показать еще {myTests.length - 5} тестов
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Последние активности */}
        <div className="bg-white rounded-lg shadow border p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-500" />
              Последние активности
            </h3>
          </div>

          <div className="space-y-4">
            {recentActivities.map((activity, index) => (
              <div key={index} className="flex items-start gap-3">
                <div
                  className={`flex-shrink-0 p-2 rounded-full ${activity.color}`}
                >
                  <activity.icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {activity.title}
                  </p>
                  <p className="text-sm text-gray-500 truncate">
                    {activity.description}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Аналитика */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Успеваемость по предметам */}
        <div className="bg-white rounded-lg shadow border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-500" />
            Успеваемость по предметам
          </h3>

          <div className="space-y-4">
            {performanceData.map((subject) => (
              <div key={subject.subject} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-900">
                    {subject.subject}
                  </span>
                  <div className="text-right">
                    <span className="text-sm font-bold text-gray-900">
                      {formatNumber(subject.average)}%
                    </span>
                    <span className="text-xs text-gray-500 ml-2">
                      ({subject.sessions} тестов)
                    </span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${subject.average}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Распределение оценок */}
        <div className="bg-white rounded-lg shadow border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <PieChart className="h-5 w-5 text-orange-500" />
            Распределение оценок
          </h3>

          <div className="space-y-4">
            {getGradeDistribution().map((grade) => (
              <div
                key={grade.grade}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded ${grade.color}`}></div>
                  <span className="text-sm font-medium text-gray-900">
                    {grade.grade}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-gray-900">
                    {grade.count}
                  </span>
                  <span className="text-xs text-gray-500 ml-1">
                    ({formatNumber(grade.percentage)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200">
            <Link
              href="/curator/statistics/detailed"
              className="flex items-center justify-center gap-2 w-full px-4 py-2 text-orange-600 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
            >
              <BarChart3 className="h-4 w-4" />
              Подробная статистика
            </Link>
          </div>
        </div>
      </div>

      {/* Информационные блоки */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Советы для кураторов */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
            <Award className="h-5 w-5" />
            Советы для эффективного тестирования
          </h3>
          <ul className="space-y-2 text-blue-800 text-sm">
            <li>• Создавайте тесты с разным уровнем сложности</li>
            <li>• Устанавливайте оптимальное время для прохождения</li>
            <li>• Анализируйте статистику для улучшения вопросов</li>
            <li>• Используйте импорт для быстрого создания тестов</li>
            <li>• Регулярно обновляйте банк вопросов</li>
          </ul>
        </div>

        {/* Быстрая статистика */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Ваши достижения
          </h3>
          <div className="space-y-3 text-green-800 text-sm">
            <div className="flex justify-between">
              <span>Создано тестов:</span>
              <span className="font-bold">{testStats.total}</span>
            </div>
            <div className="flex justify-between">
              <span>Всего вопросов:</span>
              <span className="font-bold">{testStats.totalQuestions}</span>
            </div>
            <div className="flex justify-between">
              <span>Прохождений:</span>
              <span className="font-bold">
                {sessionStats.completedSessions}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Средний балл:</span>
              <span className="font-bold">
                {formatNumber(sessionStats.averageScore)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
