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
      title: "ИНСТИТУТЫ",
      description: "Управление институтами и направлениями",
      href: "/admin/institutes",
      icon: Building,
      count: instituteStats?.totalInstitutes || 0,
      subtext: `${instituteStats?.totalDirections || 0} направлений`,
    },
    {
      title: "КУРАТОРЫ",
      description: "Управление кураторами и их назначениями",
      href: "/admin/curators",
      icon: Users,
      count: userStats.activeCurators,
      subtext: `из ${userStats.curators} всего`,
    },
    {
      title: "АБИТУРИЕНТЫ",
      description: "Управление абитуриентами",
      href: "/admin/applicants",
      icon: GraduationCap,
      count: userStats.activeApplicants,
      subtext: `из ${userStats.applicants} всего`,
    },
    {
      title: "АКТИВАЦИЯ ПОЛЬЗОВАТЕЛЕЙ",
      description: "Активация новых пользователей",
      href: "/admin/activation",
      icon: UserCheck,
      count: userStats.pending,
      subtext: "ожидают активации",
    },
    {
      title: "НАЗНАЧЕНИЯ КУРАТОРОВ",
      description: "Привязка кураторов к институтам",
      href: "/admin/curator-assignments",
      icon: UserPlus,
    },
    {
      title: "ТЕСТЫ",
      description: "Просмотр всех тестов в системе",
      href: "/admin/tests",
      icon: TestTube,
      count: testStats.published,
      subtext: `из ${testStats.total} всего`,
    },
    {
      title: "СТАТИСТИКА",
      description: "Общая статистика системы",
      href: "/admin/reports/statistics",
      icon: BarChart3,
    },
    {
      title: "ОТЧЕТЫ",
      description: "Детальные отчеты и экспорт",
      href: "/admin/reports",
      icon: FileText,
    },
    {
      title: "НАСТРОЙКИ",
      description: "Системные настройки",
      href: "/admin/settings",
      icon: Settings,
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
          ? "text-green-400 bg-green-800"
          : "text-yellow-400 bg-yellow-800",
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
          ? "text-green-400 bg-green-800"
          : "text-blue-400 bg-blue-800",
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
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-8 border-b border-slate-700 pb-6">
          <h1 className="text-3xl font-bold text-white mb-2 font-mono uppercase tracking-wide">
            ПАНЕЛЬ АДМИНИСТРАТОРА
          </h1>
          <p className="text-slate-300 font-mono">
            СИСТЕМА ТЕСТИРОВАНИЯ АБИТУРИЕНТОВ
          </p>
        </div>

        {/* Основные метрики */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800 border-2 border-slate-600 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-mono font-bold text-slate-300 uppercase">
                  ВСЕГО ПОЛЬЗОВАТЕЛЕЙ
                </p>
                <p className="text-2xl font-mono font-bold text-white">
                  {userStats.total}
                </p>
                <p className="text-xs text-slate-400 font-mono">
                  {userStats.pending} ожидают активации
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 border-2 border-slate-600 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Building className="h-8 w-8 text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-mono font-bold text-slate-300 uppercase">
                  ИНСТИТУТЫ
                </p>
                <p className="text-2xl font-mono font-bold text-white">
                  {instituteStats?.activeInstitutes || 0}
                </p>
                <p className="text-xs text-slate-400 font-mono">
                  {instituteStats?.activeDirections || 0} направлений
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 border-2 border-slate-600 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TestTube className="h-8 w-8 text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-mono font-bold text-slate-300 uppercase">
                  АКТИВНЫЕ ТЕСТЫ
                </p>
                <p className="text-2xl font-mono font-bold text-white">
                  {testStats.published}
                </p>
                <p className="text-xs text-slate-400 font-mono">
                  {testStats.drafts} черновиков
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 border-2 border-slate-600 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserCheck className="h-8 w-8 text-orange-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-mono font-bold text-slate-300 uppercase">
                  ТРЕБУЮТ АКТИВАЦИИ
                </p>
                <p className="text-2xl font-mono font-bold text-white">
                  {userStats.pending}
                </p>
                <p className="text-xs text-slate-400 font-mono">
                  новых пользователей
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Быстрые действия */}
        <div className="mb-8">
          <h2 className="text-xl font-mono font-bold text-white mb-4 uppercase tracking-wide border-b border-slate-700 pb-2">
            МОДУЛИ СИСТЕМЫ
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="bg-slate-800 border-2 border-slate-600 text-white p-6 block"
              >
                <div className="flex items-center justify-between mb-4">
                  <item.icon className="h-8 w-8 text-blue-400" />
                  <div className="text-right">
                    {item.count !== undefined && (
                      <div className="text-2xl font-mono font-bold text-white">
                        {item.count}
                      </div>
                    )}
                    <div className="text-xs text-slate-400 font-mono uppercase">
                      АДМИНИСТРАТОР
                    </div>
                  </div>
                </div>

                <h3 className="text-lg font-mono font-bold mb-2 text-white">
                  {item.title}
                </h3>
                <p className="text-sm text-slate-300 font-mono leading-relaxed">
                  {item.description}
                </p>
                {item.subtext && (
                  <p className="text-xs text-slate-400 font-mono mt-2">
                    {item.subtext}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </div>

        {/* Нижняя секция */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Требуют внимания */}
          <div>
            <h2 className="text-xl font-mono font-bold text-white mb-4 uppercase tracking-wide border-b border-slate-700 pb-2 flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-orange-400" />
              ТРЕБУЮТ ВНИМАНИЯ
            </h2>

            <div className="space-y-4">
              {userStats.pending > 0 && (
                <div className="bg-yellow-900 border-2 border-yellow-600 p-4">
                  <div className="flex items-center">
                    <UserCheck className="h-5 w-5 text-yellow-400 mr-3" />
                    <div>
                      <h3 className="text-sm font-mono font-bold text-yellow-200 uppercase">
                        ПОЛЬЗОВАТЕЛИ ОЖИДАЮТ АКТИВАЦИИ
                      </h3>
                      <p className="text-sm text-yellow-300 font-mono">
                        {userStats.pending} новых пользователей требуют активации
                      </p>
                    </div>
                    <Link
                      href="/admin/activation"
                      className="ml-auto text-sm text-yellow-200 font-mono font-bold border border-yellow-500 px-3 py-1 uppercase"
                    >
                      АКТИВИРОВАТЬ
                    </Link>
                  </div>
                </div>
              )}

              {userStats.blocked > 0 && (
                <div className="bg-red-900 border-2 border-red-600 p-4">
                  <div className="flex items-center">
                    <AlertTriangle className="h-5 w-5 text-red-400 mr-3" />
                    <div>
                      <h3 className="text-sm font-mono font-bold text-red-200 uppercase">
                        ЗАБЛОКИРОВАННЫЕ ПОЛЬЗОВАТЕЛИ
                      </h3>
                      <p className="text-sm text-red-300 font-mono">
                        {userStats.blocked} пользователей заблокированы
                      </p>
                    </div>
                    <Link
                      href="/admin/users?filter=blocked"
                      className="ml-auto text-sm text-red-200 font-mono font-bold border border-red-500 px-3 py-1 uppercase"
                    >
                      ПРОСМОТРЕТЬ
                    </Link>
                  </div>
                </div>
              )}

              {(instituteStats?.totalInstitutes || 0) === 0 && (
                <div className="bg-blue-900 border-2 border-blue-600 p-4">
                  <div className="flex items-center">
                    <Building className="h-5 w-5 text-blue-400 mr-3" />
                    <div>
                      <h3 className="text-sm font-mono font-bold text-blue-200 uppercase">
                        ИНСТИТУТЫ НЕ СОЗДАНЫ
                      </h3>
                      <p className="text-sm text-blue-300 font-mono">
                        Создайте институты и направления для работы системы
                      </p>
                    </div>
                    <Link
                      href="/admin/institutes"
                      className="ml-auto text-sm text-blue-200 font-mono font-bold border border-blue-500 px-3 py-1 uppercase"
                    >
                      СОЗДАТЬ
                    </Link>
                  </div>
                </div>
              )}

              {userStats.curators === 0 && (
                <div className="bg-purple-900 border-2 border-purple-600 p-4">
                  <div className="flex items-center">
                    <Users className="h-5 w-5 text-purple-400 mr-3" />
                    <div>
                      <h3 className="text-sm font-mono font-bold text-purple-200 uppercase">
                        КУРАТОРЫ НЕ СОЗДАНЫ
                      </h3>
                      <p className="text-sm text-purple-300 font-mono">
                        Создайте кураторов для управления тестами
                      </p>
                    </div>
                    <Link
                      href="/admin/curators"
                      className="ml-auto text-sm text-purple-200 font-mono font-bold border border-purple-500 px-3 py-1 uppercase"
                    >
                      СОЗДАТЬ
                    </Link>
                  </div>
                </div>
              )}

              {userStats.pending === 0 &&
                userStats.blocked === 0 &&
                (instituteStats?.totalInstitutes || 0) > 0 &&
                userStats.curators > 0 && (
                  <div className="bg-green-900 border-2 border-green-600 p-4">
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-400 mr-3" />
                      <div>
                        <h3 className="text-sm font-mono font-bold text-green-200 uppercase">
                          ВСЕ В ПОРЯДКЕ
                        </h3>
                        <p className="text-sm text-green-300 font-mono">
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
            <h2 className="text-xl font-mono font-bold text-white mb-4 uppercase tracking-wide border-b border-slate-700 pb-2 flex items-center gap-2">
              <Activity className="h-6 w-6 text-blue-400" />
              ПОСЛЕДНИЕ ДЕЙСТВИЯ
            </h2>

            <div className="bg-slate-800 border-2 border-slate-600">
              {recentActions.length > 0 ? (
                <>
                  <div className="divide-y divide-slate-700">
                    {recentActions.map((action, index) => (
                      <div key={index} className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className={`flex-shrink-0 p-2 ${action.color}`}>
                            <action.icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-mono font-bold text-white">
                              {action.title}
                            </p>
                            <p className="text-sm text-slate-300 font-mono truncate">
                              {action.description}
                            </p>
                          </div>
                          <div className="flex-shrink-0 text-xs text-slate-400 font-mono">
                            {formatTimeAgo(action.time)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="px-4 py-3 bg-slate-700 text-center border-t border-slate-600">
                    <Link
                      href="/admin/activity-log"
                      className="text-sm text-blue-400 font-mono font-bold uppercase"
                    >
                      ПОСМОТРЕТЬ ВСЕ ДЕЙСТВИЯ
                    </Link>
                  </div>
                </>
              ) : (
                <div className="p-8 text-center">
                  <Clock className="h-12 w-12 text-slate-500 mx-auto mb-4" />
                  <p className="text-slate-400 text-lg font-mono font-bold uppercase">
                    НЕТ ПОСЛЕДНИХ ДЕЙСТВИЙ
                  </p>
                  <p className="text-slate-500 text-sm font-mono">
                    Начните создавать институты и пользователей
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Статистика по ролям */}
        <div className="mb-8">
          <h2 className="text-xl font-mono font-bold text-white mb-4 uppercase tracking-wide border-b border-slate-700 pb-2 flex items-center gap-2">
            <Target className="h-6 w-6 text-blue-400" />
            СТАТИСТИКА ПОЛЬЗОВАТЕЛЕЙ
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-800 border-2 border-slate-600 p-6">
              <h3 className="text-lg font-mono font-bold text-white mb-4 flex items-center gap-2 uppercase">
                <Users className="h-5 w-5 text-purple-400" />
                КУРАТОРЫ
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between border-b border-slate-700 pb-1">
                  <span className="text-sm text-slate-300 font-mono">ВСЕГО:</span>
                  <span className="font-mono font-bold text-white">{userStats.curators}</span>
                </div>
                <div className="flex justify-between border-b border-slate-700 pb-1">
                  <span className="text-sm text-slate-300 font-mono">АКТИВНЫХ:</span>
                  <span className="font-mono font-bold text-green-400">
                    {userStats.activeCurators}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-700 pb-1">
                  <span className="text-sm text-slate-300 font-mono">НЕАКТИВНЫХ:</span>
                  <span className="font-mono font-bold text-orange-400">
                    {userStats.curators - userStats.activeCurators}
                  </span>
                </div>
                <div className="w-full bg-slate-700 h-2 border border-slate-600">
                  <div
                    className="bg-purple-500 h-full"
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

            <div className="bg-slate-800 border-2 border-slate-600 p-6">
              <h3 className="text-lg font-mono font-bold text-white mb-4 flex items-center gap-2 uppercase">
                <GraduationCap className="h-5 w-5 text-green-400" />
                АБИТУРИЕНТЫ
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between border-b border-slate-700 pb-1">
                  <span className="text-sm text-slate-300 font-mono">ВСЕГО:</span>
                  <span className="font-mono font-bold text-white">{userStats.applicants}</span>
                </div>
                <div className="flex justify-between border-b border-slate-700 pb-1">
                  <span className="text-sm text-slate-300 font-mono">АКТИВНЫХ:</span>
                  <span className="font-mono font-bold text-green-400">
                    {userStats.activeApplicants}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-700 pb-1">
                  <span className="text-sm text-slate-300 font-mono">НЕАКТИВНЫХ:</span>
                  <span className="font-mono font-bold text-orange-400">
                    {userStats.applicants - userStats.activeApplicants}
                  </span>
                </div>
                <div className="w-full bg-slate-700 h-2 border border-slate-600">
                  <div
                    className="bg-green-500 h-full"
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

            <div className="bg-slate-800 border-2 border-slate-600 p-6">
              <h3 className="text-lg font-mono font-bold text-white mb-4 flex items-center gap-2 uppercase">
                <TestTube className="h-5 w-5 text-blue-400" />
                ТЕСТЫ
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between border-b border-slate-700 pb-1">
                  <span className="text-sm text-slate-300 font-mono">ВСЕГО:</span>
                  <span className="font-mono font-bold text-white">{testStats.total}</span>
                </div>
                <div className="flex justify-between border-b border-slate-700 pb-1">
                  <span className="text-sm text-slate-300 font-mono">ОПУБЛИКОВАННЫХ:</span>
                  <span className="font-mono font-bold text-green-400">
                    {testStats.published}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-700 pb-1">
                  <span className="text-sm text-slate-300 font-mono">ЧЕРНОВИКОВ:</span>
                  <span className="font-mono font-bold text-blue-400">
                    {testStats.drafts}
                  </span>
                </div>
                <div className="w-full bg-slate-700 h-2 border border-slate-600">
                  <div
                    className="bg-blue-500 h-full"
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
          <h2 className="text-xl font-mono font-bold text-white mb-4 uppercase tracking-wide border-b border-slate-700 pb-2 flex items-center gap-2">
            <Database className="h-6 w-6 text-blue-400" />
            СИСТЕМНАЯ ИНФОРМАЦИЯ
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-800 border-2 border-slate-600 p-4">
              <div className="flex items-center gap-3">
                <Shield className="h-8 w-8 text-blue-400" />
                <div>
                  <p className="text-sm text-slate-300 font-mono uppercase">БЕЗОПАСНОСТЬ</p>
                  <p className="font-mono font-bold text-white">ЗАЩИЩЕНО</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800 border-2 border-slate-600 p-4">
              <div className="flex items-center gap-3">
                <Globe className="h-8 w-8 text-green-400" />
                <div>
                  <p className="text-sm text-slate-300 font-mono uppercase">СТАТУС СИСТЕМЫ</p>
                  <p className="font-mono font-bold text-green-400">ОНЛАЙН</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800 border-2 border-slate-600 p-4">
              <div className="flex items-center gap-3">
                <Zap className="h-8 w-8 text-yellow-400" />
                <div>
                  <p className="text-sm text-slate-300 font-mono uppercase">ПРОИЗВОДИТЕЛЬНОСТЬ</p>
                  <p className="font-mono font-bold text-white">ОТЛИЧНАЯ</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800 border-2 border-slate-600 p-4">
              <div className="flex items-center gap-3">
                <Database className="h-8 w-8 text-purple-400" />
                <div>
                  <p className="text-sm text-slate-300 font-mono uppercase">БАЗА ДАННЫХ</p>
                  <p className="font-mono font-bold text-white">АКТИВНА</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Рекомендации */}
        <div className="bg-slate-800 border-2 border-slate-600 p-6 mb-8">
          <h3 className="text-lg font-mono font-bold text-white mb-4 flex items-center gap-2 uppercase">
            <TrendingUp className="h-5 w-5 text-blue-400" />
            РЕКОМЕНДАЦИИ ПО РАЗВИТИЮ СИСТЕМЫ
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-mono font-bold text-white uppercase border-b border-slate-600 pb-2">
                ПРИОРИТЕТНЫЕ ЗАДАЧИ:
              </h4>
              <ul className="text-sm text-slate-300 font-mono space-y-1">
                {(instituteStats?.totalInstitutes || 0) === 0 && (
                  <li>• СОЗДАТЬ ИНСТИТУТЫ И НАПРАВЛЕНИЯ ПОДГОТОВКИ</li>
                )}
                {userStats.curators === 0 && (
                  <li>• СОЗДАТЬ КУРАТОРОВ ДЛЯ УПРАВЛЕНИЯ ТЕСТАМИ</li>
                )}
                {userStats.pending > 0 && (
                  <li>
                    • АКТИВИРОВАТЬ {userStats.pending} ОЖИДАЮЩИХ ПОЛЬЗОВАТЕЛЕЙ
                  </li>
                )}
                {userStats.blocked > 0 && (
                  <li>
                    • ПРОВЕРИТЬ {userStats.blocked} ЗАБЛОКИРОВАННЫХ ПОЛЬЗОВАТЕЛЕЙ
                  </li>
                )}
                {testStats.total === 0 && (
                  <li>• СОЗДАТЬ ПЕРВЫЕ ТЕСТЫ ДЛЯ АБИТУРИЕНТОВ</li>
                )}
                {userStats.pending === 0 &&
                  userStats.blocked === 0 &&
                  (instituteStats?.totalInstitutes || 0) > 0 &&
                  userStats.curators > 0 &&
                  testStats.total > 0 && (
                    <li>• ВСЕ ОСНОВНЫЕ ЗАДАЧИ ВЫПОЛНЕНЫ</li>
                  )}
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-mono font-bold text-white uppercase border-b border-slate-600 pb-2">
                ОПТИМИЗАЦИЯ ПРОЦЕССОВ:
              </h4>
              <ul className="text-sm text-slate-300 font-mono space-y-1">
                <li>• РЕГУЛЯРНО ПРОВЕРЯТЬ НОВЫХ ПОЛЬЗОВАТЕЛЕЙ</li>
                <li>• МОНИТОРИТЬ КАЧЕСТВО СОЗДАВАЕМЫХ ТЕСТОВ</li>
                <li>• АНАЛИЗИРОВАТЬ СТАТИСТИКУ ПРОХОЖДЕНИЙ</li>
                <li>• СЛЕДИТЬ ЗА АКТИВНОСТЬЮ КУРАТОРОВ</li>
                <li>• СОЗДАВАТЬ РЕЗЕРВНЫЕ КОПИИ ДАННЫХ</li>
                <li>• ОБНОВЛЯТЬ НАПРАВЛЕНИЯ ПОДГОТОВКИ</li>
                <li>• ПРОСМАТРИВАТЬ ОТЧЕТЫ И АНАЛИТИКУ</li>
                <li>• ОПТИМИЗИРОВАТЬ НАСТРОЙКИ СИСТЕМЫ</li>
              </ul>
            </div>
          </div>

          {/* Быстрые ссылки для рекомендаций */}
          <div className="mt-6 pt-4 border-t border-slate-600">
            <h4 className="font-mono font-bold text-white mb-3 uppercase">
              БЫСТРЫЕ ДЕЙСТВИЯ:
            </h4>
            <div className="flex flex-wrap gap-2">
              {userStats.pending > 0 && (
                <Link
                  href="/admin/activation"
                  className="px-3 py-1 text-xs bg-yellow-800 text-yellow-200 border border-yellow-600 font-mono font-bold uppercase"
                >
                  АКТИВИРОВАТЬ ПОЛЬЗОВАТЕЛЕЙ ({userStats.pending})
                </Link>
              )}
              {(instituteStats?.totalInstitutes || 0) === 0 && (
                <Link
                  href="/admin/institutes"
                  className="px-3 py-1 text-xs bg-blue-800 text-blue-200 border border-blue-600 font-mono font-bold uppercase"
                >
                  СОЗДАТЬ ИНСТИТУТ
                </Link>
              )}
              {userStats.curators === 0 && (
                <Link
                  href="/admin/curators"
                  className="px-3 py-1 text-xs bg-purple-800 text-purple-200 border border-purple-600 font-mono font-bold uppercase"
                >
                  ДОБАВИТЬ КУРАТОРОВ
                </Link>
              )}
              <Link
                href="/admin/reports/statistics"
                className="px-3 py-1 text-xs bg-green-800 text-green-200 border border-green-600 font-mono font-bold uppercase"
              >
                ПРОСМОТРЕТЬ СТАТИСТИКУ
              </Link>
              <Link
                href="/admin/settings"
                className="px-3 py-1 text-xs bg-gray-800 text-gray-200 border border-gray-600 font-mono font-bold uppercase"
              >
                НАСТРОЙКИ СИСТЕМЫ
              </Link>
            </div>
          </div>
        </div>

        {/* Информационные блоки в футере */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-slate-800 border-2 border-slate-600 p-6">
            <h3 className="text-lg font-mono font-bold text-white mb-3 flex items-center gap-2 uppercase">
              <Shield className="h-5 w-5 text-blue-400" />
              ФУНКЦИИ АДМИНИСТРАТОРА
            </h3>
            <ul className="space-y-2 text-slate-300 text-sm font-mono">
              <li>• ПОЛНОЕ УПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯМИ И ИХ РОЛЯМИ</li>
              <li>• СОЗДАНИЕ И УПРАВЛЕНИЕ СТРУКТУРОЙ ИНСТИТУТОВ</li>
              <li>• НАЗНАЧЕНИЕ КУРАТОРОВ НА НАПРАВЛЕНИЯ</li>
              <li>• МОНИТОРИНГ ВСЕХ ТЕСТОВ В СИСТЕМЕ</li>
              <li>• ГЕНЕРАЦИЯ ОТЧЕТОВ И ЭКСПОРТ ДАННЫХ</li>
              <li>• УПРАВЛЕНИЕ СИСТЕМНЫМИ НАСТРОЙКАМИ</li>
              <li>• КОНТРОЛЬ БЕЗОПАСНОСТИ И ДОСТУПОВ</li>
              <li>• РЕЗЕРВНОЕ КОПИРОВАНИЕ И ВОССТАНОВЛЕНИЕ</li>
            </ul>
          </div>

          <div className="bg-slate-800 border-2 border-slate-600 p-6">
            <h3 className="text-lg font-mono font-bold text-white mb-3 flex items-center gap-2 uppercase">
              <CheckCircle className="h-5 w-5 text-green-400" />
              ПОРЯДОК НАСТРОЙКИ СИСТЕМЫ
            </h3>
            <ol className="space-y-2 text-slate-300 text-sm font-mono">
              <li>1. СОЗДАЙТЕ ИНСТИТУТЫ И НАПРАВЛЕНИЯ ПОДГОТОВКИ</li>
              <li>2. ДОБАВЬТЕ КУРАТОРОВ И НАЗНАЧЬТЕ ИХ НА ИНСТИТУТЫ</li>
              <li>3. АКТИВИРУЙТЕ ЗАРЕГИСТРИРОВАННЫХ ПОЛЬЗОВАТЕЛЕЙ</li>
              <li>4. НАСТРОЙТЕ СИСТЕМУ ТЕСТИРОВАНИЯ</li>
              <li>5. ПРОВЕРЬТЕ РАБОТУ ВСЕХ КОМПОНЕНТОВ</li>
              <li>6. ОБУЧИТЕ КУРАТОРОВ РАБОТЕ С СИСТЕМОЙ</li>
              <li>7. ЗАПУСТИТЕ ТЕСТИРОВАНИЕ АБИТУРИЕНТОВ</li>
              <li>8. РЕГУЛЯРНО МОНИТОРЬТЕ И АНАЛИЗИРУЙТЕ ДАННЫЕ</li>
            </ol>
          </div>
        </div>

        {/* Уведомления о критических задачах */}
        {(userStats.pending > 5 ||
          userStats.blocked > 0 ||
          (instituteStats?.totalInstitutes || 0) === 0) && (
          <div className="mt-6">
            <div className="bg-red-900 border-2 border-red-600 p-4">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-red-400 mr-3" />
                <div>
                  <h3 className="text-sm font-mono font-bold text-red-200 uppercase">
                    ТРЕБУЕТСЯ НЕМЕДЛЕННОЕ ВНИМАНИЕ
                  </h3>
                  <p className="text-sm text-red-300 font-mono">
                    {userStats.pending > 5 &&
                      `${userStats.pending} ПОЛЬЗОВАТЕЛЕЙ ОЖИДАЮТ АКТИВАЦИИ БОЛЕЕ НЕДЕЛИ. `}
                    {userStats.blocked > 0 &&
                      `${userStats.blocked} ПОЛЬЗОВАТЕЛЕЙ ЗАБЛОКИРОВАНЫ. `}
                    {(instituteStats?.totalInstitutes || 0) === 0 &&
                      "СИСТЕМА НЕ МОЖЕТ РАБОТАТЬ БЕЗ ИНСТИТУТОВ И НАПРАВЛЕНИЙ."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}