"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { UserRole, getRoleLabel, getRoleColor } from "@/types";
import {
  LogOut,
  User,
  ChevronDown,
  Home,
  Users,
  BookOpen,
  GraduationCap,
  Settings,
  BarChart3,
  FileText,
  ClipboardList,
  Menu,
  X,
  Building,
  TestTube,
  UserCheck,
  PlusCircle,
  Eye,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

interface DropdownItem {
  href: string;
  label: string;
  icon: React.ComponentType<any>;
  description?: string;
}

interface NavigationItem {
  href?: string;
  label: string;
  icon: React.ComponentType<any>;
  dropdown?: DropdownItem[];
}

export function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/login");
    } catch (error) {
      console.error("Ошибка при выходе:", error);
    }
  };

  const getNavigationItems = (): NavigationItem[] => {
    switch (user?.role) {
      case UserRole.ADMIN:
        return [
          {
            href: "/admin/dashboard",
            label: "Панель управления",
            icon: Home,
          },
          {
            label: "Структура",
            icon: Building,
            dropdown: [
              {
                href: "/admin/institutes",
                label: "Институты",
                icon: Building,
                description: "Управление институтами",
              },
              {
                href: "/admin/directions",
                label: "Направления",
                icon: GraduationCap,
                description: "Управление направлениями подготовки",
              },
            ],
          },
          {
            label: "Пользователи",
            icon: Users,
            dropdown: [
              {
                href: "/admin/curators",
                label: "Кураторы",
                icon: Users,
                description: "Управление кураторами",
              },
              {
                href: "/admin/applicants",
                label: "Абитуриенты",
                icon: GraduationCap,
                description: "Управление абитуриентами",
              },
              {
                href: "/admin/activation",
                label: "Активация",
                icon: UserCheck,
                description: "Активация пользователей",
              },
            ],
          },
          {
            href: "/admin/curator-assignments",
            label: "Назначения кураторов",
            icon: UserCheck,
          },
          {
            href: "/admin/tests",
            label: "Все тесты",
            icon: TestTube,
          },
          {
            label: "Отчеты",
            icon: BarChart3,
            dropdown: [
              {
                href: "/admin/reports/statistics",
                label: "Статистика",
                icon: BarChart3,
                description: "Общая статистика системы",
              },
              {
                href: "/admin/reports/detailed",
                label: "Детальные отчеты",
                icon: FileText,
                description: "Подробные аналитические отчеты",
              },
              {
                href: "/admin/reports/export",
                label: "Экспорт данных",
                icon: FileText,
                description: "Экспорт в PDF, Excel, Word",
              },
            ],
          },
          {
            href: "/admin/settings",
            label: "Настройки",
            icon: Settings,
          },
        ];

      case UserRole.CURATOR:
        return [
          {
            href: "/curator/dashboard",
            label: "Главная",
            icon: Home,
          },
          {
            label: "Тесты",
            icon: TestTube,
            dropdown: [
              {
                href: "/curator/tests",
                label: "Мои тесты",
                icon: TestTube,
                description: "Управление созданными тестами",
              },
              {
                href: "/curator/tests/create",
                label: "Создать тест",
                icon: PlusCircle,
                description: "Создание нового теста",
              },
              {
                href: "/curator/tests/import",
                label: "Импорт тестов",
                icon: FileText,
                description: "Импорт из Excel файлов",
              },
            ],
          },
          {
            label: "Абитуриенты",
            icon: GraduationCap,
            dropdown: [
              {
                href: "/curator/applicants",
                label: "Все абитуриенты",
                icon: GraduationCap,
                description: "Список абитуриентов",
              },
              {
                href: "/curator/applicants/activation",
                label: "Активация",
                icon: UserCheck,
                description: "Активация абитуриентов",
              },
            ],
          },
          {
            label: "Статистика",
            icon: BarChart3,
            dropdown: [
              {
                href: "/curator/statistics/tests",
                label: "По тестам",
                icon: TestTube,
                description: "Статистика прохождения тестов",
              },
              {
                href: "/curator/statistics/applicants",
                label: "По абитуриентам",
                icon: GraduationCap,
                description: "Статистика абитуриентов",
              },
              {
                href: "/curator/statistics/questions",
                label: "Анализ вопросов",
                icon: ClipboardList,
                description: "Анализ сложности вопросов",
              },
            ],
          },
          {
            href: "/curator/profile",
            label: "Профиль",
            icon: User,
          },
        ];

      case UserRole.APPLICANT:
        return [
          {
            href: "/applicant/dashboard",
            label: "Главная",
            icon: Home,
          },
          {
            href: "/applicant/profile",
            label: "Анкета",
            icon: User,
          },
          {
            label: "Тестирование",
            icon: TestTube,
            dropdown: [
              {
                href: "/applicant/tests",
                label: "Доступные тесты",
                icon: TestTube,
                description: "Тесты для прохождения",
              },
              {
                href: "/applicant/tests/history",
                label: "История",
                icon: Clock,
                description: "Пройденные тесты",
              },
              {
                href: "/applicant/tests/results",
                label: "Результаты",
                icon: CheckCircle,
                description: "Результаты тестирования",
              },
            ],
          },
        ];

      default:
        return [];
    }
  };

  const handleDropdownToggle = (label: string) => {
    setOpenDropdown(openDropdown === label ? null : label);
  };

  const handleMobileMenuItemClick = () => {
    setIsMobileMenuOpen(false);
    setOpenDropdown(null);
  };

  const handleUserMenuToggle = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
    setIsMobileMenuOpen(false);
    setOpenDropdown(null);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdown) {
        const dropdownElement = dropdownRefs.current[openDropdown];
        if (
          dropdownElement &&
          !dropdownElement.contains(event.target as Node)
        ) {
          setOpenDropdown(null);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openDropdown]);

  if (!user) return null;

  const navigationItems = getNavigationItems();

  return (
    <nav className="bg-white shadow-lg border-b relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <TestTube className="h-8 w-8 text-indigo-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">
                TestSystem
              </span>
            </Link>
            <div className="hidden lg:ml-8 lg:flex lg:space-x-1">
              {navigationItems.map((item) => (
                <div
                  key={item.label}
                  className="relative"
                  ref={(el) => {
                    dropdownRefs.current[item.label] = el;
                  }}
                >
                  {item.dropdown ? (
                    <div>
                      <button
                        onClick={() => handleDropdownToggle(item.label)}
                        className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                      >
                        <item.icon className="h-4 w-4" />
                        {item.label}
                        <ChevronDown
                          className={`h-4 w-4 transition-transform ${
                            openDropdown === item.label ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {openDropdown === item.label && (
                        <div className="absolute left-0 mt-2 w-72 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                          <div className="py-1">
                            {item.dropdown.map((dropdownItem) => (
                              <Link
                                key={dropdownItem.href}
                                href={dropdownItem.href}
                                onClick={() => setOpenDropdown(null)}
                                className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                              >
                                <div className="flex items-start gap-3">
                                  <dropdownItem.icon className="h-5 w-5 text-gray-400 mt-0.5" />
                                  <div>
                                    <div className="font-medium">
                                      {dropdownItem.label}
                                    </div>
                                    {dropdownItem.description && (
                                      <div className="text-xs text-gray-500 mt-1">
                                        {dropdownItem.description}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link
                      href={item.href!}
                      className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center">
            <div className="hidden lg:block ml-4 relative">
              <button
                onClick={handleUserMenuToggle}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              >
                <User className="h-5 w-5" />
                <span>{user.name}</span>
                <ChevronDown className="h-4 w-4" />
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                  <div className="py-1">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">
                        {user.name}
                      </p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                      <span
                        className={`inline-flex mt-1 px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(
                          user.role
                        )}`}
                      >
                        {getRoleLabel(user.role)}
                      </span>
                    </div>

                    {/* Дополнительные пункты меню для разных ролей */}
                    {user.role === UserRole.APPLICANT && (
                      <div className="py-1 border-b border-gray-100">
                        <Link
                          href="/applicant/profile"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <User className="h-4 w-4" />
                          Редактировать анкету
                        </Link>
                      </div>
                    )}

                    {user.role === UserRole.CURATOR && (
                      <div className="py-1 border-b border-gray-100">
                        <Link
                          href="/curator/profile"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <User className="h-4 w-4" />
                          Профиль
                        </Link>
                      </div>
                    )}

                    <div className="py-1">
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <LogOut className="h-4 w-4" />
                        Выйти
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Кнопка гамбургера */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden ml-4 p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Мобильное меню */}
      {isMobileMenuOpen && (
        <div className="lg:hidden absolute top-16 left-0 right-0 bg-white border-b shadow-lg z-40">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {/* Навигационные элементы */}
            {navigationItems.map((item) => (
              <div key={item.label}>
                {item.dropdown ? (
                  <div>
                    <button
                      onClick={() => handleDropdownToggle(item.label)}
                      className="w-full flex items-center justify-between gap-3 px-3 py-3 text-base font-medium text-gray-700 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="h-5 w-5" />
                        {item.label}
                      </div>
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${
                          openDropdown === item.label ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {openDropdown === item.label && (
                      <div className="ml-8 mt-2 space-y-1">
                        {item.dropdown.map((dropdownItem) => (
                          <Link
                            key={dropdownItem.href}
                            href={dropdownItem.href}
                            onClick={handleMobileMenuItemClick}
                            className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                          >
                            <dropdownItem.icon className="h-4 w-4" />
                            {dropdownItem.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    href={item.href!}
                    onClick={handleMobileMenuItemClick}
                    className="flex items-center gap-3 px-3 py-3 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                )}
              </div>
            ))}

            {/* Разделитель */}
            <div className="border-t border-gray-200 my-2"></div>

            {/* Информация о пользователе */}
            <div className="px-3 py-3">
              <div className="flex items-center gap-3 mb-3">
                <User className="h-8 w-8 text-gray-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {user.name}
                  </p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(
                    user.role
                  )}`}
                >
                  {getRoleLabel(user.role)}
                </span>
              </div>

              {/* Дополнительные ссылки для мобильного меню */}
              {user.role === UserRole.APPLICANT && (
                <Link
                  href="/applicant/profile"
                  onClick={handleMobileMenuItemClick}
                  className="w-full flex items-center gap-3 px-3 py-3 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors mb-2"
                >
                  <User className="h-5 w-5" />
                  Редактировать анкету
                </Link>
              )}

              {user.role === UserRole.CURATOR && (
                <Link
                  href="/curator/profile"
                  onClick={handleMobileMenuItemClick}
                  className="w-full flex items-center gap-3 px-3 py-3 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors mb-2"
                >
                  <User className="h-5 w-5" />
                  Профиль
                </Link>
              )}

              {/* Кнопка выхода */}
              <button
                onClick={() => {
                  handleLogout();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-3 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              >
                <LogOut className="h-5 w-5" />
                Выйти
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Overlay для закрытия меню */}
      {(isUserMenuOpen || isMobileMenuOpen || openDropdown) && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => {
            setIsUserMenuOpen(false);
            setIsMobileMenuOpen(false);
            setOpenDropdown(null);
          }}
        />
      )}

      {/* Индикатор статуса для абитуриентов */}
      {user.role === UserRole.APPLICANT && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-2 flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <span className="text-blue-800">
                  Не забудьте заполнить анкету перед началом тестирования
                </span>
              </div>
              <Link
                href="/applicant/profile"
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Перейти к анкете →
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
