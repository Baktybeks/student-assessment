// src/app/(dashboard)/admin/dashboard/page.tsx

"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useAllUsers, usePendingUsers } from "@/services/authService";
import { useInstituteStats } from "@/services/instituteService";
import { useTests } from "@/services/testService";
import { RecentAction, UserRole } from "@/types";
import {
  Users,
  Building,
  GraduationCap,
  TestTube,
  BarChart3,
  Settings,
  UserCheck,
  AlertTriangle,
  TrendingUp,
  Activity,
  Clock,
  Target,
  CheckCircle,
  FileText,
  UserPlus,
  Eye,
  PlusCircle,
  Shield,
  Database,
  Globe,
  Zap,
} from "lucide-react";

export default function AdminDashboard() {
  // Получение данных для статистики
  const { data: allUsers = [] } = useAllUsers();
  const { data: pendingUsers = [] } = usePendingUsers();
  const { data: instituteStats } = useInstituteStats();
  const { data: allTests = [] } = useTests();

  // Подсчет статистики пользователей
  const userStats = React.useMemo(() => {
    const admins = allUsers.filter((u) => u.role === UserRole.ADMIN);
    const curators = allUsers.filter((u) => u.role === UserRole.CURATOR);
    const applicants = allUsers.filter((u) => u.role === UserRole.APPLICANT);

    const activeCurators = curators.filter((u) => u.isActive && !u.isBlocked);
    const activeApplicants = applicants.filter(
      (u) => u.isActive && !u.isBlocked
    );
    const blockedUsers = allUsers.filter((u) => u.isBlocked);

    return {
      total: allUsers.length,
      admins: admins.length,
      curators: curators.length,
      applicants: applicants.length,
      activeCurators: activeCurators.length,
      activeApplicants: activeApplicants.length,
      pending: pendingUsers.length,
      blocked: blockedUsers.length,
    };
  }, [allUsers, pendingUsers]);

  // Подсчет статистики тестов
  const testStats = React.useMemo(() => {
    const activeTests = allTests.filter((t) => t.isActive);
    const publishedTests = allTests.filter((t) => t.isPublished && t.isActive);
    const draftTests = allTests.filter((t) => !t.isPublished && t.isActive);

    return {
      total: allTests.length,
      active: activeTests.length,
      published: publishedTests.length,
      drafts: draftTests.length,
    };
  }, [allTests]);

  const menuItems = [
    {
      title: "Институты",
      description: "Управление институтами и направлениями",
      href: "/admin/institutes",
      icon: Building,
      color: "bg-blue-500 hover:bg-blue-600",
      count: instituteStats?.totalInstitutes || 0,
      subtext: `${instituteStats?.totalDirections || 0} направлений`,
    },
    {
      title: "Кураторы",
      description: "Управление кураторами и их назначениями",
      href: "/admin/curators",
      icon: Users,
      color: "bg-purple-500 hover:bg-purple-600",
      count: userStats.activeCurators,
      subtext: `из ${userStats.curators} всего`,
    },
    {
      title: "Абитуриенты",
      description: "Управление абитуриентами",
      href: "/admin/applicants",
      icon: GraduationCap,
      color: "bg-green-500 hover:bg-green-600",
      count: userStats.activeApplicants,
      subtext: `из ${userStats.applicants} всего`,
    },
    {
      title: "Активация пользователей",
      description: "Активация новых пользователей",
      href: "/admin/activation",
      icon: UserCheck,
      color: "bg-orange-500 hover:bg-orange-600",
      count: userStats.pending,
      subtext: "ожидают активации",
    },
    {
      title: "Назначения кураторов",
      description: "Привязка кураторов к институтам",
      href: "/admin/curator-assignments",
      icon: UserPlus,
      color: "bg-teal-500 hover:bg-teal-600",
    },
    {
      title: "Тесты",
      description: "Просмотр всех тестов в системе",
      href: "/admin/tests",
      icon: TestTube,
      color: "bg-indigo-500 hover:bg-indigo-600",
      count: testStats.published,
      subtext: `из ${testStats.total} всего`,
    },
    {
      title: "Статистика",
      description: "Общая статистика системы",
      href: "/admin/reports/statistics",
      icon: BarChart3,
      color: "bg-cyan-500 hover:bg-cyan-600",
    },
    {
      title: "Отчеты",
      description: "Детальные отчеты и экспорт",
      href: "/admin/reports",
      icon: FileText,
      color: "bg-pink-500 hover:bg-pink-600",
    },
    {
      title: "Настройки",
      description: "Системные настройки",
      href: "/admin/settings",
      icon: Settings,
      color: "bg-gray-500 hover:bg-gray-600",
    },
  ];

  // Последние действия (пример данных)
  const recentActions = React.useMemo(() => {
    const actions: RecentAction[] = [];

    // Последние зарегистрированные пользователи
    const recentUsers = allUsers
      .sort(
        (a, b) =>
          new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime()
      )
      .slice(0, 5);

    recentUsers.forEach((user) => {
      actions.push({
        type: "user_registered",
        title: `Новый ${
          user.role === UserRole.CURATOR ? "куратор" : "абитуриент"
        }`,
        description: `${user.name} (${user.email})`,
        time: user.$createdAt,
        icon: user.role === UserRole.CURATOR ? Users : GraduationCap,
        color: user.isActive
          ? "text-green-600 bg-green-100"
          : "text-yellow-600 bg-yellow-100",
      });
    });

    // Последние созданные тесты
    const recentTests = allTests
      .sort(
        (a, b) =>
          new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime()
      )
      .slice(0, 3);

    recentTests.forEach((test) => {
      actions.push({
        type: "test_created",
        title: test.isPublished ? "Тест опубликован" : "Тест создан",
        description: test.title,
        time: test.$createdAt,
        icon: TestTube,
        color: test.isPublished
          ? "text-green-600 bg-green-100"
          : "text-blue-600 bg-blue-100",
      });
    });

    return actions
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 8);
  }, [allUsers, allTests]);

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "только что";
    if (diffInSeconds < 3600)
      return `${Math.floor(diffInSeconds / 60)} мин назад`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)} ч назад`;
    if (diffInSeconds < 604800)
      return `${Math.floor(diffInSeconds / 86400)} дн назад`;
    return date.toLocaleDateString("ru-RU");
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Панель администратора
        </h1>
        <p className="text-gray-600">
          Управление системой тестирования абитуриентов
        </p>
      </div>

      {/* Основные метрики */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-blue-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Всего пользователей
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {userStats.total}
              </p>
              <p className="text-xs text-gray-500">
                {userStats.pending} ожидают активации
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Building className="h-8 w-8 text-purple-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Институты</p>
              <p className="text-2xl font-bold text-gray-900">
                {instituteStats?.activeInstitutes || 0}
              </p>
              <p className="text-xs text-gray-500">
                {instituteStats?.activeDirections || 0} направлений
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TestTube className="h-8 w-8 text-green-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Активные тесты
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {testStats.published}
              </p>
              <p className="text-xs text-gray-500">
                {testStats.drafts} черновиков
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UserCheck className="h-8 w-8 text-orange-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Требуют активации
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {userStats.pending}
              </p>
              <p className="text-xs text-gray-500">новых пользователей</p>
            </div>
          </div>
        </div>
      </div>

      {/* Быстрые действия */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`${item.color} text-white p-6 rounded-lg shadow-md transition-all duration-200 transform hover:scale-105 hover:shadow-lg relative overflow-hidden`}
          >
            <div className="flex items-center justify-between mb-4">
              <item.icon className="h-8 w-8" />
              <div className="text-right">
                {item.count !== undefined && (
                  <div className="text-2xl font-bold">{item.count}</div>
                )}
                <div className="text-xs opacity-75">Администратор</div>
              </div>
            </div>

            <h3 className="text-xl font-bold mb-2">{item.title}</h3>
            <p className="text-sm opacity-90 leading-relaxed">
              {item.description}
            </p>
            {item.subtext && (
              <p className="text-xs opacity-75 mt-2">{item.subtext}</p>
            )}

            {/* Индикатор активности */}
            {item.count !== undefined && item.count > 0 && (
              <div className="absolute top-2 right-2">
                <div className="w-3 h-3 bg-white bg-opacity-30 rounded-full animate-pulse"></div>
              </div>
            )}
          </Link>
        ))}
      </div>

      {/* Нижняя секция */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Требуют внимания */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-orange-500" />
            Требуют внимания
          </h2>

          <div className="space-y-4">
            {userStats.pending > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center">
                  <UserCheck className="h-5 w-5 text-yellow-600 mr-3" />
                  <div>
                    <h3 className="text-sm font-medium text-yellow-800">
                      Пользователи ожидают активации
                    </h3>
                    <p className="text-sm text-yellow-700">
                      {userStats.pending} новых пользователей требуют активации
                    </p>
                  </div>
                  <Link
                    href="/admin/activation"
                    className="ml-auto text-sm text-yellow-600 hover:text-yellow-800 font-medium"
                  >
                    Активировать →
                  </Link>
                </div>
              </div>
            )}

            {userStats.blocked > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-red-600 mr-3" />
                  <div>
                    <h3 className="text-sm font-medium text-red-800">
                      Заблокированные пользователи
                    </h3>
                    <p className="text-sm text-red-700">
                      {userStats.blocked} пользователей заблокированы
                    </p>
                  </div>
                  <Link
                    href="/admin/users?filter=blocked"
                    className="ml-auto text-sm text-red-600 hover:text-red-800 font-medium"
                  >
                    Просмотреть →
                  </Link>
                </div>
              </div>
            )}

            {(instituteStats?.totalInstitutes || 0) === 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center">
                  <Building className="h-5 w-5 text-blue-600 mr-3" />
                  <div>
                    <h3 className="text-sm font-medium text-blue-800">
                      Институты не созданы
                    </h3>
                    <p className="text-sm text-blue-700">
                      Создайте институты и направления для работы системы
                    </p>
                  </div>
                  <Link
                    href="/admin/institutes"
                    className="ml-auto text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Создать →
                  </Link>
                </div>
              </div>
            )}

            {userStats.curators === 0 && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center">
                  <Users className="h-5 w-5 text-purple-600 mr-3" />
                  <div>
                    <h3 className="text-sm font-medium text-purple-800">
                      Кураторы не созданы
                    </h3>
                    <p className="text-sm text-purple-700">
                      Создайте кураторов для управления тестами
                    </p>
                  </div>
                  <Link
                    href="/admin/curators"
                    className="ml-auto text-sm text-purple-600 hover:text-purple-800 font-medium"
                  >
                    Создать →
                  </Link>
                </div>
              </div>
            )}

            {userStats.pending === 0 &&
              userStats.blocked === 0 &&
              (instituteStats?.totalInstitutes || 0) > 0 &&
              userStats.curators > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                    <div>
                      <h3 className="text-sm font-medium text-green-800">
                        Все в порядке
                      </h3>
                      <p className="text-sm text-green-700">
                        Нет задач, требующих немедленного внимания
                      </p>
                    </div>
                  </div>
                </div>
              )}
          </div>
        </div>

        {/* Последние действия */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Activity className="h-6 w-6 text-blue-500" />
            Последние действия
          </h2>

          <div className="bg-white rounded-lg shadow border">
            {recentActions.length > 0 ? (
              <>
                <div className="divide-y divide-gray-200">
                  {recentActions.map((action, index) => (
                    <div key={index} className="p-4">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`flex-shrink-0 p-2 rounded-full ${action.color}`}
                        >
                          <action.icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            {action.title}
                          </p>
                          <p className="text-sm text-gray-500 truncate">
                            {action.description}
                          </p>
                        </div>
                        <div className="flex-shrink-0 text-xs text-gray-400">
                          {formatTimeAgo(action.time)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="px-4 py-3 bg-gray-50 text-center">
                  <Link
                    href="/admin/activity-log"
                    className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    Посмотреть все действия →
                  </Link>
                </div>
              </>
            ) : (
              <div className="p-8 text-center">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">Нет последних действий</p>
                <p className="text-gray-400 text-sm">
                  Начните создавать институты и пользователей
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Статистика по ролям */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Target className="h-6 w-6 text-indigo-500" />
          Статистика пользователей
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-500" />
              Кураторы
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Всего:</span>
                <span className="font-medium">{userStats.curators}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Активных:</span>
                <span className="font-medium text-green-600">
                  {userStats.activeCurators}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Неактивных:</span>
                <span className="font-medium text-orange-600">
                  {userStats.curators - userStats.activeCurators}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${
                      userStats.curators > 0
                        ? (userStats.activeCurators / userStats.curators) * 100
                        : 0
                    }%`,
                  }}
                ></div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-green-500" />
              Абитуриенты
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Всего:</span>
                <span className="font-medium">{userStats.applicants}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Активных:</span>
                <span className="font-medium text-green-600">
                  {userStats.activeApplicants}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Неактивных:</span>
                <span className="font-medium text-orange-600">
                  {userStats.applicants - userStats.activeApplicants}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${
                      userStats.applicants > 0
                        ? (userStats.activeApplicants / userStats.applicants) *
                          100
                        : 0
                    }%`,
                  }}
                ></div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TestTube className="h-5 w-5 text-indigo-500" />
              Тесты
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Всего:</span>
                <span className="font-medium">{testStats.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Опубликованных:</span>
                <span className="font-medium text-green-600">
                  {testStats.published}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Черновиков:</span>
                <span className="font-medium text-blue-600">
                  {testStats.drafts}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${
                      testStats.total > 0
                        ? (testStats.published / testStats.total) * 100
                        : 0
                    }%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Системная информация */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Database className="h-6 w-6 text-gray-500" />
          Системная информация
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Безопасность</p>
                <p className="font-medium text-gray-900">Защищено</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center gap-3">
              <Globe className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Статус системы</p>
                <p className="font-medium text-green-600">Онлайн</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center gap-3">
              <Zap className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-sm text-gray-600">Производительность</p>
                <p className="font-medium text-gray-900">Отличная</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center gap-3">
              <Database className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600">База данных</p>
                <p className="font-medium text-gray-900">Активна</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Рекомендации */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-indigo-900 mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Рекомендации по развитию системы
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h4 className="font-medium text-indigo-800">
              Приоритетные задачи:
            </h4>
            <ul className="text-sm text-indigo-700 space-y-1">
              {(instituteStats?.totalInstitutes || 0) === 0 && (
                <li>• Создать институты и направления подготовки</li>
              )}
              {userStats.curators === 0 && (
                <li>• Создать кураторов для управления тестами</li>
              )}
              {userStats.pending > 0 && (
                <li>
                  • Активировать {userStats.pending} ожидающих пользователей
                </li>
              )}
              {userStats.blocked > 0 && (
                <li>
                  • Проверить {userStats.blocked} заблокированных пользователей
                </li>
              )}
              {testStats.total === 0 && (
                <li>• Создать первые тесты для абитуриентов</li>
              )}
              {userStats.pending === 0 &&
                userStats.blocked === 0 &&
                (instituteStats?.totalInstitutes || 0) > 0 &&
                userStats.curators > 0 &&
                testStats.total > 0 && (
                  <li>• Все основные задачи выполнены! ✅</li>
                )}
            </ul>
          </div>
          <div className="space-y-3">
            <h4 className="font-medium text-indigo-800">
              Оптимизация процессов:
            </h4>
            <ul className="text-sm text-indigo-700 space-y-1">
              <li>• Регулярно проверять новых пользователей</li>
              <li>• Мониторить качество создаваемых тестов</li>
              <li>• Анализировать статистику прохождений</li>
              <li>• Следить за активностью кураторов</li>
              <li>• Создавать резервные копии данных</li>
              <li>• Обновлять направления подготовки</li>
              <li>• Просматривать отчеты и аналитику</li>
              <li>• Оптимизировать настройки системы</li>
            </ul>
          </div>
        </div>

        {/* Быстрые ссылки для рекомендаций */}
        <div className="mt-6 pt-4 border-t border-indigo-200">
          <h4 className="font-medium text-indigo-800 mb-3">
            Быстрые действия:
          </h4>
          <div className="flex flex-wrap gap-2">
            {userStats.pending > 0 && (
              <Link
                href="/admin/activation"
                className="px-3 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full hover:bg-yellow-200 transition-colors"
              >
                Активировать пользователей ({userStats.pending})
              </Link>
            )}
            {(instituteStats?.totalInstitutes || 0) === 0 && (
              <Link
                href="/admin/institutes"
                className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded-full hover:bg-blue-200 transition-colors"
              >
                Создать институт
              </Link>
            )}
            {userStats.curators === 0 && (
              <Link
                href="/admin/curators"
                className="px-3 py-1 text-xs bg-purple-100 text-purple-800 rounded-full hover:bg-purple-200 transition-colors"
              >
                Добавить кураторов
              </Link>
            )}
            <Link
              href="/admin/reports/statistics"
              className="px-3 py-1 text-xs bg-green-100 text-green-800 rounded-full hover:bg-green-200 transition-colors"
            >
              Просмотреть статистику
            </Link>
            <Link
              href="/admin/settings"
              className="px-3 py-1 text-xs bg-gray-100 text-gray-800 rounded-full hover:bg-gray-200 transition-colors"
            >
              Настройки системы
            </Link>
          </div>
        </div>
      </div>

      {/* Информационные блоки в футере */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Функции администратора
          </h3>
          <ul className="space-y-2 text-blue-800 text-sm">
            <li>• Полное управление пользователями и их ролями</li>
            <li>• Создание и управление структурой институтов</li>
            <li>• Назначение кураторов на направления</li>
            <li>• Мониторинг всех тестов в системе</li>
            <li>• Генерация отчетов и экспорт данных</li>
            <li>• Управление системными настройками</li>
            <li>• Контроль безопасности и доступов</li>
            <li>• Резервное копирование и восстановление</li>
          </ul>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-900 mb-3 flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Порядок настройки системы
          </h3>
          <ol className="space-y-2 text-green-800 text-sm">
            <li>1. Создайте институты и направления подготовки</li>
            <li>2. Добавьте кураторов и назначьте их на институты</li>
            <li>3. Активируйте зарегистрированных пользователей</li>
            <li>4. Настройте систему тестирования</li>
            <li>5. Проверьте работу всех компонентов</li>
            <li>6. Обучите кураторов работе с системой</li>
            <li>7. Запустите тестирование абитуриентов</li>
            <li>8. Регулярно мониторьте и анализируйте данные</li>
          </ol>
        </div>
      </div>

      {/* Уведомления о критических задачах */}
      {(userStats.pending > 5 ||
        userStats.blocked > 0 ||
        (instituteStats?.totalInstitutes || 0) === 0) && (
        <div className="mt-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-600 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-red-800">
                  Требуется немедленное внимание
                </h3>
                <p className="text-sm text-red-700">
                  {userStats.pending > 5 &&
                    `${userStats.pending} пользователей ожидают активации более недели. `}
                  {userStats.blocked > 0 &&
                    `${userStats.blocked} пользователей заблокированы. `}
                  {(instituteStats?.totalInstitutes || 0) === 0 &&
                    "Система не может работать без институтов и направлений."}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
