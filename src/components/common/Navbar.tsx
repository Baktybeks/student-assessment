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
            label: "ПАНЕЛЬ УПРАВЛЕНИЯ",
            icon: Home,
          },
          {
            label: "СТРУКТУРА",
            icon: Building,
            dropdown: [
              {
                href: "/admin/institutes",
                label: "ИНСТИТУТЫ",
                icon: Building,
                description: "УПРАВЛЕНИЕ ИНСТИТУТАМИ",
              },
              {
                href: "/admin/directions",
                label: "НАПРАВЛЕНИЯ",
                icon: GraduationCap,
                description: "УПРАВЛЕНИЕ НАПРАВЛЕНИЯМИ ПОДГОТОВКИ",
              },
            ],
          },
          {
            label: "ПОЛЬЗОВАТЕЛИ",
            icon: Users,
            dropdown: [
              {
                href: "/admin/curators",
                label: "КУРАТОРЫ",
                icon: Users,
                description: "УПРАВЛЕНИЕ КУРАТОРАМИ",
              },
              {
                href: "/admin/applicants",
                label: "АБИТУРИЕНТЫ",
                icon: GraduationCap,
                description: "УПРАВЛЕНИЕ АБИТУРИЕНТАМИ",
              },
              {
                href: "/admin/activation",
                label: "АКТИВАЦИЯ",
                icon: UserCheck,
                description: "АКТИВАЦИЯ ПОЛЬЗОВАТЕЛЕЙ",
              },
            ],
          },
          {
            href: "/admin/curator-assignments",
            label: "НАЗНАЧЕНИЯ КУРАТОРОВ",
            icon: UserCheck,
          },
          {
            href: "/admin/tests",
            label: "ВСЕ ТЕСТЫ",
            icon: TestTube,
          },
          {
            label: "ОТЧЕТЫ",
            icon: BarChart3,
            dropdown: [
              
              {
                href: "/admin/reports",
                label: "ДЕТАЛЬНЫЕ ОТЧЕТЫ",
                icon: FileText,
                description: "ПОДРОБНЫЕ АНАЛИТИЧЕСКИЕ ОТЧЕТЫ",
              },
        
            ],
          },
        ];

      case UserRole.CURATOR:
        return [
          {
            href: "/curator/dashboard",
            label: "ГЛАВНАЯ",
            icon: Home,
          },
          {
            label: "ТЕСТЫ",
            icon: TestTube,
            dropdown: [
              {
                href: "/curator/tests",
                label: "МОИ ТЕСТЫ",
                icon: TestTube,
                description: "УПРАВЛЕНИЕ СОЗДАННЫМИ ТЕСТАМИ",
              },
              {
                href: "/curator/tests/create",
                label: "СОЗДАТЬ ТЕСТ",
                icon: PlusCircle,
                description: "СОЗДАНИЕ НОВОГО ТЕСТА",
              },
              {
                href: "/curator/tests/import",
                label: "ИМПОРТ ТЕСТОВ",
                icon: FileText,
                description: "ИМПОРТ ИЗ EXCEL ФАЙЛОВ",
              },
            ],
          },
          {
            label: "АБИТУРИЕНТЫ",
            icon: GraduationCap,
            dropdown: [
              {
                href: "/curator/applicants",
                label: "ВСЕ АБИТУРИЕНТЫ",
                icon: GraduationCap,
                description: "СПИСОК АБИТУРИЕНТОВ",
              },
              {
                href: "/curator/applicants/activation",
                label: "АКТИВАЦИЯ",
                icon: UserCheck,
                description: "АКТИВАЦИЯ АБИТУРИЕНТОВ",
              },
            ],
          },
          {
            label: "СТАТИСТИКА",
            icon: BarChart3,
            dropdown: [
              {
                href: "/curator/statistics/tests",
                label: "ПО ТЕСТАМ",
                icon: TestTube,
                description: "СТАТИСТИКА ПРОХОЖДЕНИЯ ТЕСТОВ",
              },
              {
                href: "/curator/statistics/applicants",
                label: "ПО АБИТУРИЕНТАМ",
                icon: GraduationCap,
                description: "СТАТИСТИКА АБИТУРИЕНТОВ",
              },
              {
                href: "/curator/statistics/questions",
                label: "АНАЛИЗ ВОПРОСОВ",
                icon: ClipboardList,
                description: "АНАЛИЗ СЛОЖНОСТИ ВОПРОСОВ",
              },
            ],
          },
          {
            href: "/curator/profile",
            label: "ПРОФИЛЬ",
            icon: User,
          },
        ];

      case UserRole.APPLICANT:
        return [
          {
            href: "/applicant/dashboard",
            label: "ГЛАВНАЯ",
            icon: Home,
          },
          {
            href: "/applicant/profile",
            label: "АНКЕТА",
            icon: User,
          },
          {
            label: "ТЕСТИРОВАНИЕ",
            icon: TestTube,
            dropdown: [
              {
                href: "/applicant/tests",
                label: "ДОСТУПНЫЕ ТЕСТЫ",
                icon: TestTube,
                description: "ТЕСТЫ ДЛЯ ПРОХОЖДЕНИЯ",
              },
              {
                href: "/applicant/tests/history",
                label: "ИСТОРИЯ",
                icon: Clock,
                description: "ПРОЙДЕННЫЕ ТЕСТЫ",
              },
              {
                href: "/applicant/tests/results",
                label: "РЕЗУЛЬТАТЫ",
                icon: CheckCircle,
                description: "РЕЗУЛЬТАТЫ ТЕСТИРОВАНИЯ",
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

  const getRoleColorGov = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return "bg-red-800 text-red-200 border border-red-600";
      case UserRole.CURATOR:
        return "bg-blue-800 text-blue-200 border border-blue-600";
      case UserRole.APPLICANT:
        return "bg-green-800 text-green-200 border border-green-600";
      default:
        return "bg-gray-800 text-gray-200 border border-gray-600";
    }
  };

  const getRoleLabelGov = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return "АДМИНИСТРАТОР";
      case UserRole.CURATOR:
        return "КУРАТОР";
      case UserRole.APPLICANT:
        return "АБИТУРИЕНТ";
      default:
        return "ПОЛЬЗОВАТЕЛЬ";
    }
  };

  return (
    <nav className="bg-slate-900 border-b-2 border-slate-700 relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <TestTube className="h-8 w-8 text-blue-400" />
              <span className="ml-2 text-xl font-mono font-bold text-white uppercase tracking-wide">
                TESTSYSTEM
              </span>
            </Link>
            <div className="hidden lg:ml-8 lg:flex lg:space-x-1">
              {navigationItems.map((item) => (
                <div
                  key={item.label}
                  className="relative text-white"
                  ref={(el) => {
                    dropdownRefs.current[item.label] = el;
                  }}
                >
                  {item.dropdown ? (
                    <div>
                      <button
                        onClick={() => handleDropdownToggle(item.label)}
                        className="flex items-center gap-1 px-3 py-2 text-sm font-mono font-bold text-white border border-slate-600 bg-slate-800"
                      >
                        <item.icon className="h-4 w-4 " />
                        {item.label}
                        <ChevronDown
                          className={`h-4 w-4  ${
                            openDropdown === item.label ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {openDropdown === item.label && (
                        <div className="absolute left-0 mt-1 w-80 bg-slate-800 border-2 border-slate-600 z-50">
                          <div className="border-b border-slate-600 p-2">
                            <div className="text-xs font-mono font-bold text-slate-300  uppercase tracking-wide">
                              {item.label}
                            </div>
                          </div>
                          <div>
                            {item.dropdown.map((dropdownItem) => (
                              <Link
                                key={dropdownItem.href}
                                href={dropdownItem.href}
                                onClick={() => setOpenDropdown(null)}
                                className="block px-4 py-3 text-sm text-white border-b border-slate-700 last:border-b-0"
                              >
                                <div className="flex items-start gap-3">
                                  <dropdownItem.icon className="h-5 w-5 text-blue-400 mt-0.5" />
                                  <div>
                                    <div className="font-mono font-bold uppercase">
                                      {dropdownItem.label}
                                    </div>
                                    {dropdownItem.description && (
                                      <div className="text-xs text-slate-300 font-mono mt-1">
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
                      className="flex items-center gap-1 px-3 py-2 text-sm font-mono font-bold text-white border border-slate-600 bg-slate-800"
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
                className="flex items-center gap-2 px-3 py-2 text-sm font-mono font-bold text-white border border-slate-600 bg-slate-800"
              >
                <User className="h-5 w-5" />
                <span className="uppercase">{user.name}</span>
                <ChevronDown className="h-4 w-4" />
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-1 w-64 bg-slate-800 border-2 border-slate-600 z-50">
                  <div className="border-b border-slate-700 p-4">
                    <p className="text-sm font-mono font-bold text-white uppercase">
                      {user.name}
                    </p>
                    <p className="text-sm text-slate-300 font-mono">{user.email}</p>
                    <span
                      className={`inline-flex mt-2 px-2 py-1 text-xs font-mono font-bold uppercase ${getRoleColorGov(
                        user.role
                      )}`}
                    >
                      {getRoleLabelGov(user.role)}
                    </span>
                  </div>

                  {/* Дополнительные пункты меню для разных ролей */}
                  {user.role === UserRole.APPLICANT && (
                    <div className="border-b border-slate-700">
                      <Link
                        href="/applicant/profile"
                        className="block px-4 py-3 text-sm text-white font-mono font-bold flex items-center gap-2 border-b border-slate-700 last:border-b-0 uppercase"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <User className="h-4 w-4" />
                        РЕДАКТИРОВАТЬ АНКЕТУ
                      </Link>
                    </div>
                  )}

                  {user.role === UserRole.CURATOR && (
                    <div className="border-b border-slate-700">
                      <Link
                        href="/curator/profile"
                        className="block px-4 py-3 text-sm text-white font-mono font-bold flex items-center gap-2 border-b border-slate-700 last:border-b-0 uppercase"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <User className="h-4 w-4" />
                        ПРОФИЛЬ
                      </Link>
                    </div>
                  )}

                  <div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-3 text-sm text-red-300 font-mono font-bold flex items-center gap-2 uppercase"
                    >
                      <LogOut className="h-4 w-4" />
                      ВЫЙТИ
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Кнопка гамбургера */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden ml-4 p-2 text-white border border-slate-600 bg-slate-800"
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
        <div className="lg:hidden absolute top-16 left-0 right-0 bg-slate-800 border-b-2 border-slate-600 z-40">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {/* Навигационные элементы */}
            {navigationItems.map((item) => (
              <div key={item.label}>
                {item.dropdown ? (
                  <div>
                    <button
                      onClick={() => handleDropdownToggle(item.label)}
                      className="w-full flex items-center justify-between gap-3 px-3 py-3 text-base font-mono font-bold text-white border border-slate-600 bg-slate-700"
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="h-5 w-5" />
                        {item.label}
                      </div>
                      <ChevronDown
                        className={`h-4 w-4 ${
                          openDropdown === item.label ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {openDropdown === item.label && (
                      <div className="ml-4 mt-1 space-y-1">
                        {item.dropdown.map((dropdownItem) => (
                          <Link
                            key={dropdownItem.href}
                            href={dropdownItem.href}
                            onClick={handleMobileMenuItemClick}
                            className="flex items-center gap-3 px-3 py-2 text-sm font-mono font-bold text-white border border-slate-600 bg-slate-600"
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
                    className="flex items-center gap-3 px-3 py-3 text-base font-mono font-bold text-white border border-slate-600 bg-slate-700"
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                )}
              </div>
            ))}

            {/* Разделитель */}
            <div className="border-t-2 border-slate-600 my-2"></div>

            {/* Информация о пользователе */}
            <div className="px-3 py-3 bg-slate-700 border-2 border-slate-600">
              <div className="flex items-center gap-3 mb-3">
                <User className="h-8 w-8 text-blue-400" />
                <div className="flex-1">
                  <p className="text-sm font-mono font-bold text-white uppercase">
                    {user.name}
                  </p>
                  <p className="text-xs text-slate-300 font-mono">{user.email}</p>
                </div>
                <span
                  className={`px-2 py-1 text-xs font-mono font-bold uppercase ${getRoleColorGov(
                    user.role
                  )}`}
                >
                  {getRoleLabelGov(user.role)}
                </span>
              </div>

              {/* Дополнительные ссылки для мобильного меню */}
              {user.role === UserRole.APPLICANT && (
                <Link
                  href="/applicant/profile"
                  onClick={handleMobileMenuItemClick}
                  className="w-full flex items-center gap-3 px-3 py-3 text-base font-mono font-bold text-white border border-slate-600 bg-slate-600 mb-2 uppercase"
                >
                  <User className="h-5 w-5" />
                  РЕДАКТИРОВАТЬ АНКЕТУ
                </Link>
              )}

              {user.role === UserRole.CURATOR && (
                <Link
                  href="/curator/profile"
                  onClick={handleMobileMenuItemClick}
                  className="w-full flex items-center gap-3 px-3 py-3 text-base font-mono font-bold text-white border border-slate-600 bg-slate-600 mb-2 uppercase"
                >
                  <User className="h-5 w-5" />
                  ПРОФИЛЬ
                </Link>
              )}

              {/* Кнопка выхода */}
              <button
                onClick={() => {
                  handleLogout();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-3 text-base font-mono font-bold text-red-300 border border-red-600 bg-red-900 uppercase"
              >
                <LogOut className="h-5 w-5" />
                ВЫЙТИ
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
        <div className="bg-blue-900 border-b-2 border-blue-700">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-3 flex items-center justify-between text-sm border-2 border-blue-700 bg-blue-800">
              <div className="flex items-center gap-2 px-3">
                <AlertCircle className="h-4 w-4 text-blue-400" />
                <span className="text-blue-200 font-mono font-bold uppercase">
                  НЕ ЗАБУДЬТЕ ЗАПОЛНИТЬ АНКЕТУ ПЕРЕД НАЧАЛОМ ТЕСТИРОВАНИЯ
                </span>
              </div>
              <Link
                href="/applicant/profile"
                className="text-blue-300 font-mono font-bold border border-blue-600 px-3 py-1 bg-blue-700 uppercase"
              >
                ПЕРЕЙТИ К АНКЕТЕ
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}