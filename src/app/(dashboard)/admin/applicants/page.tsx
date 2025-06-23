// src/app/(dashboard)/admin/applicants/page.tsx
"use client";

import React, { useState } from "react";
import {
  useApplicants,
  useActivateUser,
  useDeactivateUser,
  useBlockUser,
  useUnblockUser,
} from "@/services/authService";
import { useActiveDirections } from "@/services/instituteService";
import { User } from "@/types";
import { toast } from "react-toastify";
import {
  GraduationCap,
  UserCheck,
  UserX,
  Mail,
  Calendar,
  Search,
  RefreshCw,
  Eye,
  Shield,
  ShieldOff,
  AlertTriangle,
  CheckCircle,
  Clock,
  Filter,
  Building,
  FileText,
  Download,
  Users,
} from "lucide-react";

export default function ApplicantsPage() {
  const { data: applicants = [], isLoading, refetch } = useApplicants();
  const { data: directions = [] } = useActiveDirections();
  const activateUserMutation = useActivateUser();
  const deactivateUserMutation = useDeactivateUser();
  const blockUserMutation = useBlockUser();
  const unblockUserMutation = useUnblockUser();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "ACTIVE" | "INACTIVE" | "BLOCKED"
  >("ALL");
  const [directionFilter, setDirectionFilter] = useState<string>("ALL");
  const [selectedApplicants, setSelectedApplicants] = useState<Set<string>>(
    new Set()
  );

  const filteredApplicants = applicants.filter((applicant) => {
    const matchesSearch =
      applicant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      applicant.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" &&
        applicant.isActive &&
        !applicant.isBlocked) ||
      (statusFilter === "INACTIVE" &&
        !applicant.isActive &&
        !applicant.isBlocked) ||
      (statusFilter === "BLOCKED" && applicant.isBlocked);

    const matchesDirection = directionFilter === "ALL"; // TODO: добавить фильтр по направлению когда будет профиль

    return matchesSearch && matchesStatus && matchesDirection;
  });

  const applicantStats = {
    total: applicants.length,
    active: applicants.filter((a) => a.isActive && !a.isBlocked).length,
    inactive: applicants.filter((a) => !a.isActive && !a.isBlocked).length,
    blocked: applicants.filter((a) => a.isBlocked).length,
  };

  const handleActivate = async (applicantId: string, applicantName: string) => {
    try {
      await activateUserMutation.mutateAsync(applicantId);
      toast.success(`✅ Абитуриент ${applicantName} активирован`);
    } catch (error) {
      toast.error(`❌ Ошибка при активации: ${(error as Error).message}`);
    }
  };

  const handleDeactivate = async (
    applicantId: string,
    applicantName: string
  ) => {
    if (window.confirm(`Деактивировать абитуриента ${applicantName}?`)) {
      try {
        await deactivateUserMutation.mutateAsync(applicantId);
        toast.warning(`⚠️ Абитуриент ${applicantName} деактивирован`);
      } catch (error) {
        toast.error(`❌ Ошибка при деактивации: ${(error as Error).message}`);
      }
    }
  };

  const handleBlock = async (applicantId: string, applicantName: string) => {
    if (
      window.confirm(
        `Заблокировать абитуриента ${applicantName}? Он потеряет доступ к системе.`
      )
    ) {
      try {
        await blockUserMutation.mutateAsync(applicantId);
        toast.warning(`🚫 Абитуриент ${applicantName} заблокирован`);
      } catch (error) {
        toast.error(`❌ Ошибка при блокировке: ${(error as Error).message}`);
      }
    }
  };

  const handleUnblock = async (applicantId: string, applicantName: string) => {
    try {
      await unblockUserMutation.mutateAsync(applicantId);
      toast.success(`✅ Абитуриент ${applicantName} разблокирован`);
    } catch (error) {
      toast.error(`❌ Ошибка при разблокировке: ${(error as Error).message}`);
    }
  };

  const handleBulkActivate = async () => {
    if (selectedApplicants.size === 0) return;

    if (
      window.confirm(
        `Активировать ${selectedApplicants.size} выбранных абитуриентов?`
      )
    ) {
      const results = await Promise.allSettled(
        Array.from(selectedApplicants).map((applicantId) =>
          activateUserMutation.mutateAsync(applicantId)
        )
      );

      const successful = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.filter((r) => r.status === "rejected").length;

      if (successful > 0) {
        toast.success(`✅ Активировано абитуриентов: ${successful}`);
      }

      if (failed > 0) {
        toast.error(`❌ Не удалось активировать: ${failed}`);
      }

      setSelectedApplicants(new Set());
    }
  };

  const handleExportToPDF = () => {
    // Загружаем pdfmake динамически для корректной поддержки кириллицы
    const script1 = document.createElement('script');
    script1.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/pdfmake.min.js';
    script1.onload = () => {
      const script2 = document.createElement('script');
      script2.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/vfs_fonts.js';
      script2.onload = () => {
        const currentDate = new Date();
        const dateStr = currentDate.toLocaleDateString('ru-RU');
        const timeStr = currentDate.toLocaleTimeString('ru-RU');
        
        // Подготовка данных для таблицы
        const tableData = [
          ['№', 'ФИО', 'Email', 'Статус', 'Дата регистрации', 'ID пользователя']
        ];
        
        filteredApplicants.forEach((applicant, index) => {
          let status = 'НЕАКТИВЕН';
          if (applicant.isBlocked) status = 'ЗАБЛОКИРОВАН';
          else if (applicant.isActive) status = 'АКТИВЕН';
          
          const regDate = new Date(applicant.$createdAt).toLocaleDateString('ru-RU');
          const userId = applicant.$id.substring(0, 8) + '...';
          
          tableData.push([
            (index + 1).toString(),
            applicant.name,
            applicant.email,
            status,
            regDate,
            userId
          ]);
        });
        
        // Статистика регистраций
        const now = new Date();
        const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const recentRegistrations = applicants.filter(a => new Date(a.$createdAt) > lastWeek).length;
        const monthlyRegistrations = applicants.filter(a => new Date(a.$createdAt) > lastMonth).length;
        
        // Процентное соотношение
        let percentages = '';
        if (applicantStats.total > 0) {
          const activePercent = ((applicantStats.active / applicantStats.total) * 100).toFixed(1);
          const inactivePercent = ((applicantStats.inactive / applicantStats.total) * 100).toFixed(1);
          const blockedPercent = ((applicantStats.blocked / applicantStats.total) * 100).toFixed(1);
          percentages = `Активные: ${activePercent}%, Неактивные: ${inactivePercent}%, Заблокированные: ${blockedPercent}%`;
        }
        
        // Рекомендации
        const recommendations = [];
        if (applicantStats.inactive > 0) {
          recommendations.push(`• Активировать ${applicantStats.inactive} ожидающих пользователей`);
        }
        if (applicantStats.blocked > 0) {
          recommendations.push(`• Проверить статус ${applicantStats.blocked} заблокированных пользователей`);
        }
        recommendations.push('• Регулярно мониторить новые регистрации');
        recommendations.push('• Поддерживать актуальность базы данных');
        recommendations.push('• Создавать резервные копии пользовательских данных');
        
        // Определение структуры документа
        const documentDefinition = {
          pageSize: 'A4',
          pageMargins: [40, 60, 40, 60],
          header: {
            columns: [
              {
                text: 'МИНИСТЕРСТВО ОБРАЗОВАНИЯ И НАУКИ\nСИСТЕМА УПРАВЛЕНИЯ АБИТУРИЕНТАМИ',
                alignment: 'center',
                fontSize: 12,
                bold: true,
                margin: [0, 20, 0, 0]
              }
            ]
          },
          footer: function(currentPage: number, pageCount: number) {
            return {
              columns: [
                {
                  text: `Страница ${currentPage} из ${pageCount}`,
                  alignment: 'right',
                  fontSize: 8,
                  margin: [0, 0, 40, 0]
                }
              ]
            };
          },
          content: [
            // Заголовок отчета
            {
              text: 'ДЕТАЛЬНЫЙ ОТЧЕТ ПО АБИТУРИЕНТАМ',
              style: 'header',
              alignment: 'center',
              margin: [0, 20, 0, 20]
            },
            
            // Информация о формировании
            {
              columns: [
                { text: `Дата формирования: ${dateStr}`, fontSize: 10 },
                { text: `Время: ${timeStr}`, fontSize: 10, alignment: 'right' }
              ],
              margin: [0, 0, 0, 10]
            },
            {
              text: `Ответственный: Администратор системы`,
              fontSize: 10,
              margin: [0, 0, 0, 5]
            },
            {
              text: `Применены фильтры: ${statusFilter !== 'ALL' ? statusFilter : 'Без фильтров'}`,
              fontSize: 10,
              margin: [0, 0, 0, 20]
            },
            
            // Раздел I: Общая статистика
            {
              text: 'I. ОБЩАЯ СТАТИСТИКА АБИТУРИЕНТОВ',
              style: 'subheader',
              margin: [0, 20, 0, 10]
            },
            {
              table: {
                widths: ['*', '*'],
                body: [
                  ['Показатель', 'Значение'],
                  ['Общее количество абитуриентов', applicantStats.total.toString()],
                  ['Активных (имеют доступ)', applicantStats.active.toString()],
                  ['Неактивных (ожидают активации)', applicantStats.inactive.toString()],
                  ['Заблокированных (доступ ограничен)', applicantStats.blocked.toString()],
                  ['Регистраций за последнюю неделю', recentRegistrations.toString()],
                  ['Регистраций за последний месяц', monthlyRegistrations.toString()]
                ]
              },
              layout: 'lightHorizontalLines',
              margin: [0, 0, 0, 10]
            },
            percentages ? {
              text: `Процентное соотношение: ${percentages}`,
              fontSize: 10,
              margin: [0, 0, 0, 20]
            } : {},
            
            // Раздел II: Детальный список
            {
              text: 'II. ДЕТАЛЬНЫЙ СПИСОК АБИТУРИЕНТОВ',
              style: 'subheader',
              pageBreak: 'before',
              margin: [0, 0, 0, 10]
            },
            {
              table: {
                headerRows: 1,
                widths: [25, '*', '*', 60, 70, 70],
                body: tableData
              },
              layout: {
                fillColor: function (rowIndex: number) {
                  return rowIndex === 0 ? '#CCCCCC' : null;
                }
              },
              fontSize: 8,
              margin: [0, 0, 0, 20]
            },
            
            // Раздел III: Аналитическая сводка
            {
              text: 'III. АНАЛИТИЧЕСКАЯ СВОДКА',
              style: 'subheader',
              pageBreak: 'before',
              margin: [0, 0, 0, 10]
            },
            {
              text: 'Анализ активности абитуриентов:',
              fontSize: 11,
              bold: true,
              margin: [0, 0, 0, 5]
            },
            applicantStats.total > 0 ? {
              ul: [
                applicantStats.active > applicantStats.inactive 
                  ? 'Большинство абитуриентов активированы и могут пользоваться системой'
                  : 'Требуется внимание: много неактивированных пользователей',
                applicantStats.blocked > 0 
                  ? `Внимание: ${applicantStats.blocked} пользователей заблокированы`
                  : 'Заблокированных пользователей нет',
                recentRegistrations > 0 
                  ? `Активность регистраций: ${recentRegistrations} новых за неделю`
                  : 'Новых регистраций за неделю нет'
              ],
              margin: [0, 0, 0, 15]
            } : {},
            {
              text: 'Рекомендации по управлению:',
              fontSize: 11,
              bold: true,
              margin: [0, 0, 0, 5]
            },
            {
              ul: recommendations,
              margin: [0, 0, 0, 20]
            },
            
            // Раздел IV: Системная информация
            {
              text: 'IV. СИСТЕМНАЯ ИНФОРМАЦИЯ',
              style: 'subheader',
              margin: [0, 0, 0, 10]
            },
            {
              table: {
                widths: ['*', '*'],
                body: [
                  ['Параметр', 'Значение'],
                  ['Версия системы', '1.0.0'],
                  ['Записей в выборке', filteredApplicants.length.toString()],
                  ['Применены фильтры', statusFilter !== 'ALL' ? statusFilter : 'Нет'],
                  ['Поиск по запросу', searchTerm || 'Не применен']
                ]
              },
              layout: 'lightHorizontalLines',
              margin: [0, 0, 0, 30]
            },
            
            // Подпись документа
            {
              canvas: [
                {
                  type: 'line',
                  x1: 0, y1: 0,
                  x2: 515, y2: 0,
                  lineWidth: 1
                }
              ],
              margin: [0, 20, 0, 10]
            },
            {
              text: 'Документ сформирован автоматически системой управления абитуриентами',
              fontSize: 9,
              alignment: 'center',
              margin: [0, 0, 0, 10]
            },
            {
              columns: [
                {
                  stack: [
                    { text: 'Ответственный: Администратор системы', fontSize: 9 },
                    { text: 'Подпись: _______________________', fontSize: 9, margin: [0, 10, 0, 0] }
                  ]
                },
                {
                  stack: [
                    { text: `Дата: ${dateStr}`, fontSize: 9, alignment: 'right' },
                    { text: 'М.П.', fontSize: 9, alignment: 'right', margin: [0, 10, 0, 0] }
                  ]
                }
              ]
            }
          ],
          styles: {
            header: {
              fontSize: 16,
              bold: true
            },
            subheader: {
              fontSize: 12,
              bold: true
            }
          }
        };
        
        // Создание и скачивание PDF
        const fileName = `detailed_applicants_report_${dateStr.replace(/\./g, '_')}_${timeStr.replace(/:/g, '-')}.pdf`;
        (window as any).pdfMake.createPdf(documentDefinition).download(fileName);
        
        toast.success('Детальный отчет успешно экспортирован в PDF с поддержкой русского языка');
      };
      
      script2.onerror = () => {
        toast.error('Ошибка загрузки шрифтов для PDF');
      };
      
      document.head.appendChild(script2);
    };
    
    script1.onerror = () => {
      toast.error('Ошибка загрузки библиотеки pdfmake');
    };
    
    document.head.appendChild(script1);
  };

  const toggleApplicantSelection = (applicantId: string) => {
    setSelectedApplicants((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(applicantId)) {
        newSet.delete(applicantId);
      } else {
        newSet.add(applicantId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedApplicants.size === filteredApplicants.length) {
      setSelectedApplicants(new Set());
    } else {
      setSelectedApplicants(new Set(filteredApplicants.map((a) => a.$id)));
    }
  };

  const getStatusBadge = (applicant: User) => {
    if (applicant.isBlocked) {
      return (
        <span className="px-2 py-1 text-xs font-mono font-bold bg-red-800 text-red-200 border border-red-600 uppercase">
          ЗАБЛОКИРОВАН
        </span>
      );
    }
    if (applicant.isActive) {
      return (
        <span className="px-2 py-1 text-xs font-mono font-bold bg-green-800 text-green-200 border border-green-600 uppercase">
          АКТИВЕН
        </span>
      );
    }
    return (
      <span className="px-2 py-1 text-xs font-mono font-bold bg-yellow-800 text-yellow-200 border border-yellow-600 uppercase">
        НЕАКТИВЕН
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ru-RU", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white">
        <div className="p-6 max-w-7xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent"></div>
            <span className="ml-3 text-slate-300 font-mono">ЗАГРУЗКА АБИТУРИЕНТОВ...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Заголовок */}
        <div className="mb-8 border-b border-slate-700 pb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <GraduationCap className="h-8 w-8 text-green-400" />
                <h1 className="text-3xl font-mono font-bold text-white uppercase tracking-wide">
                  УПРАВЛЕНИЕ АБИТУРИЕНТАМИ
                </h1>
              </div>
              <p className="text-slate-300 font-mono">
                АКТИВАЦИЯ И УПРАВЛЕНИЕ АБИТУРИЕНТАМИ СИСТЕМЫ ТЕСТИРОВАНИЯ
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleExportToPDF}
                className="flex items-center gap-2 px-4 py-2 text-blue-200 bg-slate-800 border-2 border-blue-600 font-mono font-bold uppercase"
              >
                <Download className="h-4 w-4" />
                ЭКСПОРТ PDF
              </button>
            </div>
          </div>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800 border-2 border-slate-600 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <GraduationCap className="h-8 w-8 text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-mono font-bold text-slate-300 uppercase">
                  ВСЕГО АБИТУРИЕНТОВ
                </p>
                <p className="text-2xl font-mono font-bold text-white">
                  {applicantStats.total}
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
                  АКТИВНЫЕ
                </p>
                <p className="text-2xl font-mono font-bold text-white">
                  {applicantStats.active}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 border-2 border-slate-600 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-8 w-8 text-yellow-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-mono font-bold text-slate-300 uppercase">
                  НЕАКТИВНЫЕ
                </p>
                <p className="text-2xl font-mono font-bold text-white">
                  {applicantStats.inactive}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 border-2 border-slate-600 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ShieldOff className="h-8 w-8 text-red-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-mono font-bold text-slate-300 uppercase">
                  ЗАБЛОКИРОВАННЫЕ
                </p>
                <p className="text-2xl font-mono font-bold text-white">
                  {applicantStats.blocked}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Фильтры и поиск */}
        <div className="bg-slate-800 border-2 border-slate-600 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              {/* Поиск */}
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="ПОИСК ПО ИМЕНИ ИЛИ EMAIL..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-80 border-2 border-slate-600 bg-slate-700 text-white font-mono placeholder-slate-400 uppercase"
                />
              </div>

              {/* Фильтр по статусу */}
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-slate-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-3 py-2 border-2 border-slate-600 bg-slate-700 text-white font-mono"
                >
                  <option value="ALL">ВСЕ СТАТУСЫ</option>
                  <option value="ACTIVE">АКТИВНЫЕ</option>
                  <option value="INACTIVE">НЕАКТИВНЫЕ</option>
                  <option value="BLOCKED">ЗАБЛОКИРОВАННЫЕ</option>
                </select>
              </div>

              {/* Фильтр по направлению */}
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-slate-400" />
                <select
                  value={directionFilter}
                  onChange={(e) => setDirectionFilter(e.target.value)}
                  className="px-3 py-2 border-2 border-slate-600 bg-slate-700 text-white font-mono"
                >
                  <option value="ALL">ВСЕ НАПРАВЛЕНИЯ</option>
                  {directions.map((direction) => (
                    <option key={direction.$id} value={direction.$id}>
                      {direction.name} ({direction.institute?.name})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => refetch()}
                className="flex items-center gap-2 px-3 py-2 text-slate-300 font-mono font-bold border border-slate-600 uppercase"
              >
                <RefreshCw className="h-4 w-4" />
                ОБНОВИТЬ
              </button>

              {selectedApplicants.size > 0 && (
                <button
                  onClick={handleBulkActivate}
                  className="flex items-center gap-2 px-4 py-2 bg-green-800 text-green-200 border-2 border-green-600 font-mono font-bold uppercase"
                >
                  <UserCheck className="h-4 w-4" />
                  АКТИВИРОВАТЬ ВЫБРАННЫХ ({selectedApplicants.size})
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Список абитуриентов */}
        <div className="bg-slate-800 border-2 border-slate-600">
          {filteredApplicants.length === 0 ? (
            <div className="text-center py-12">
              <GraduationCap className="h-16 w-16 text-slate-500 mx-auto mb-4" />
              <h3 className="text-lg font-mono font-bold text-white mb-2 uppercase">
                {applicants.length === 0
                  ? "НЕТ АБИТУРИЕНТОВ"
                  : "АБИТУРИЕНТЫ НЕ НАЙДЕНЫ"}
              </h3>
              <p className="text-slate-400 font-mono">
                {applicants.length === 0
                  ? "АБИТУРИЕНТЫ БУДУТ ПОЯВЛЯТЬСЯ ЗДЕСЬ ПОСЛЕ РЕГИСТРАЦИИ"
                  : "ПОПРОБУЙТЕ ИЗМЕНИТЬ ПАРАМЕТРЫ ПОИСКА"}
              </p>
            </div>
          ) : (
            <div className="overflow-hidden">
              {/* Заголовок таблицы */}
              <div className="bg-slate-700 px-6 py-3 border-b-2 border-slate-600">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={
                        selectedApplicants.size === filteredApplicants.length &&
                        filteredApplicants.length > 0
                      }
                      onChange={toggleSelectAll}
                      className="h-4 w-4 text-green-600 bg-slate-700 border-2 border-slate-500"
                    />
                    <span className="ml-3 text-sm font-mono font-bold text-white uppercase">
                      АБИТУРИЕНТЫ ({filteredApplicants.length})
                    </span>
                  </div>
                  <span className="text-sm text-slate-300 font-mono font-bold uppercase">
                    ДЕЙСТВИЯ
                  </span>
                </div>
              </div>

              {/* Список абитуриентов */}
              <div className="divide-y-2 divide-slate-700">
                {filteredApplicants.map((applicant) => (
                  <div
                    key={applicant.$id}
                    className="px-6 py-4 bg-slate-800"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedApplicants.has(applicant.$id)}
                          onChange={() => toggleApplicantSelection(applicant.$id)}
                          className="h-4 w-4 text-green-600 bg-slate-700 border-2 border-slate-500"
                        />

                        <div className="ml-4 flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div>
                              <h3 className="text-sm font-mono font-bold text-white">
                                {applicant.name}
                              </h3>
                              <div className="flex items-center gap-2 mt-1">
                                <Mail className="h-3 w-3 text-slate-400" />
                                <span className="text-sm text-slate-300 font-mono">
                                  {applicant.email}
                                </span>
                              </div>
                            </div>

                            {getStatusBadge(applicant)}
                          </div>

                          <div className="flex items-center gap-4 text-xs text-slate-400 font-mono">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>
                                ЗАРЕГИСТРИРОВАН {formatDate(applicant.$createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            /* TODO: просмотр профиля */
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-800 text-blue-200 border border-blue-600 font-mono font-bold uppercase"
                        >
                          <Eye className="h-3 w-3" />
                          ПРОФИЛЬ
                        </button>

                        {applicant.isBlocked ? (
                          <button
                            onClick={() =>
                              handleUnblock(applicant.$id, applicant.name)
                            }
                            disabled={unblockUserMutation.isPending}
                            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-800 text-green-200 border border-green-600 disabled:opacity-50 font-mono font-bold uppercase"
                          >
                            <Shield className="h-3 w-3" />
                            РАЗБЛОКИРОВАТЬ
                          </button>
                        ) : applicant.isActive ? (
                          <>
                            <button
                              onClick={() =>
                                handleDeactivate(applicant.$id, applicant.name)
                              }
                              disabled={deactivateUserMutation.isPending}
                              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-yellow-800 text-yellow-200 border border-yellow-600 disabled:opacity-50 font-mono font-bold uppercase"
                            >
                              <UserX className="h-3 w-3" />
                              ДЕАКТИВИРОВАТЬ
                            </button>
                            <button
                              onClick={() =>
                                handleBlock(applicant.$id, applicant.name)
                              }
                              disabled={blockUserMutation.isPending}
                              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-800 text-red-200 border border-red-600 disabled:opacity-50 font-mono font-bold uppercase"
                            >
                              <ShieldOff className="h-3 w-3" />
                              ЗАБЛОКИРОВАТЬ
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() =>
                                handleActivate(applicant.$id, applicant.name)
                              }
                              disabled={activateUserMutation.isPending}
                              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-800 text-green-200 border border-green-600 disabled:opacity-50 font-mono font-bold uppercase"
                            >
                              <UserCheck className="h-3 w-3" />
                              АКТИВИРОВАТЬ
                            </button>
                            <button
                              onClick={() =>
                                handleBlock(applicant.$id, applicant.name)
                              }
                              disabled={blockUserMutation.isPending}
                              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-800 text-red-200 border border-red-600 disabled:opacity-50 font-mono font-bold uppercase"
                            >
                              <ShieldOff className="h-3 w-3" />
                              ЗАБЛОКИРОВАТЬ
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Информационная панель */}
        <div className="mt-6 bg-green-900 border-2 border-green-600 p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-green-400 mt-0.5" />
            <div>
              <h3 className="text-sm font-mono font-bold text-green-200 mb-2 uppercase">
                ВОЗМОЖНОСТИ АБИТУРИЕНТОВ
              </h3>
              <ul className="text-sm text-green-300 font-mono space-y-1">
                <li>• ЗАПОЛНЕНИЕ ПЕРСОНАЛЬНОЙ АНКЕТЫ С ПАСПОРТНЫМИ ДАННЫМИ</li>
                <li>• ПРОХОЖДЕНИЕ ТЕСТОВ ПО ВЫБРАННОМУ НАПРАВЛЕНИЮ ПОДГОТОВКИ</li>
                <li>• ПРОСМОТР РЕЗУЛЬТАТОВ И ОЦЕНОК ЗА ПРОЙДЕННЫЕ ТЕСТЫ</li>
                <li>• ОТСЛЕЖИВАНИЕ ПРОГРЕССА И ИСТОРИИ ТЕСТИРОВАНИЯ</li>
                <li>• ПОВТОРНОЕ ПРОХОЖДЕНИЕ ТЕСТОВ (ЕСЛИ РАЗРЕШЕНО НАСТРОЙКАМИ)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Статистика по направлениям */}
        {directions.length > 0 && (
          <div className="mt-6 bg-slate-800 border-2 border-slate-600 p-6">
            <h3 className="text-lg font-mono font-bold text-white mb-4 flex items-center gap-2 uppercase">
              <Building className="h-5 w-5 text-blue-400" />
              РАСПРЕДЕЛЕНИЕ ПО НАПРАВЛЕНИЯМ
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {directions.map((direction) => {
                const directionApplicants = applicants.filter((a) => {
                  // TODO: фильтр по направлению когда будет профиль
                  return true;
                });

                return (
                  <div key={direction.$id} className="bg-slate-700 border border-slate-600 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-mono font-bold text-white text-sm">
                        {direction.name}
                      </h4>
                      <span className="text-sm text-slate-300 font-mono">
                        {/* TODO: показать количество когда будет профиль */}0
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-mono">
                      {direction.institute?.name}
                    </p>
                    <div className="mt-2 w-full bg-slate-600 h-2 border border-slate-500">
                      <div
                        className="bg-green-500 h-full"
                        style={{ width: "0%" }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}