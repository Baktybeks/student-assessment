// src/app/(dashboard)/admin/tests/page.tsx
"use client";

import React, { useState, useMemo } from "react";
import {
  useTests,
  usePublishTest,
  useDeleteTest,
} from "@/services/testService";
import { useActiveCurators } from "@/services/authService";
import { useActiveDirections } from "@/services/instituteService";
import { TestWithDetails } from "@/types";
import { toast } from "react-toastify";
import {
  TestTube,
  Eye,
  Edit,
  Trash2,
  Search,
  RefreshCw,
  Filter,
  Download,
  Play,
  Pause,
  Clock,
  CheckCircle,
  AlertTriangle,
  Users,
  Building,
  GraduationCap,
  BarChart3,
  FileText,
  Calendar,
  Target,
} from "lucide-react";

export default function AdminTestsPage() {
  const { data: tests = [], refetch } = useTests();
  const { data: curators = [] } = useActiveCurators();
  const { data: directions = [] } = useActiveDirections();
  const publishTestMutation = usePublishTest();
  const deleteTestMutation = useDeleteTest();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "PUBLISHED" | "DRAFT" | "INACTIVE"
  >("ALL");
  const [curatorFilter, setCuratorFilter] = useState<string>("ALL");
  const [directionFilter, setDirectionFilter] = useState<string>("ALL");
  const [showStatistics, setShowStatistics] = useState(false);

  const filteredTests = tests.filter((test) => {
    const matchesSearch =
      test.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      test.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      test.direction?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      test.institute?.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "PUBLISHED" && test.isPublished && test.isActive) ||
      (statusFilter === "DRAFT" && !test.isPublished && test.isActive) ||
      (statusFilter === "INACTIVE" && !test.isActive);

    const matchesCurator =
      curatorFilter === "ALL" || test.curatorId === curatorFilter;
    const matchesDirection =
      directionFilter === "ALL" || test.directionId === directionFilter;

    return matchesSearch && matchesStatus && matchesCurator && matchesDirection;
  });

  const testStats = {
    total: tests.length,
    published: tests.filter((t) => t.isPublished && t.isActive).length,
    drafts: tests.filter((t) => !t.isPublished && t.isActive).length,
    inactive: tests.filter((t) => !t.isActive).length,
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
          ['№', 'НАЗВАНИЕ ТЕСТА', 'НАПРАВЛЕНИЕ', 'КУРАТОР', 'СТАТУС', 'ВОПРОСОВ', 'ВРЕМЯ', 'ДАТА СОЗДАНИЯ']
        ];
        
        filteredTests.forEach((test, index) => {
          let status = 'ЧЕРНОВИК';
          if (!test.isActive) status = 'НЕАКТИВЕН';
          else if (test.isPublished) status = 'ОПУБЛИКОВАН';
          
          const curator = curators.find((c) => c.$id === test.curatorId);
          const formatDuration = (minutes?: number) => {
            if (!minutes) return "БЕЗ ОГРАНИЧЕНИЙ";
            if (minutes < 60) return `${minutes} МИН`;
            const hours = Math.floor(minutes / 60);
            const remainingMinutes = minutes % 60;
            return `${hours}Ч ${remainingMinutes}М`;
          };
          
          const createdDate = new Date(test.$createdAt).toLocaleDateString('ru-RU');
          
          tableData.push([
            (index + 1).toString(),
            test.title,
            test.direction?.name || 'НЕ УКАЗАНО',
            curator?.name || 'НЕ НАЙДЕН',
            status,
            test.totalQuestions.toString(),
            formatDuration(test.timeLimit),
            createdDate
          ]);
        });
        
        // Определение структуры документа
        const documentDefinition = {
          pageSize: 'A4',
          pageOrientation: 'landscape',
          pageMargins: [40, 60, 40, 60],
          header: {
            columns: [
              {
                text: 'МИНИСТЕРСТВО ОБРАЗОВАНИЯ И НАУКИ\nСИСТЕМА УПРАВЛЕНИЯ ТЕСТИРОВАНИЕМ',
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
                  text: `СТРАНИЦА ${currentPage} ИЗ ${pageCount}`,
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
              text: 'ОТЧЕТ ПО ТЕСТАМ СИСТЕМЫ',
              style: 'header',
              alignment: 'center',
              margin: [0, 20, 0, 20]
            },
            
            // Информация о формировании
            {
              columns: [
                { text: `ДАТА ФОРМИРОВАНИЯ: ${dateStr}`, fontSize: 10 },
                { text: `ВРЕМЯ: ${timeStr}`, fontSize: 10, alignment: 'right' }
              ],
              margin: [0, 0, 0, 10]
            },
            {
              text: `ОТВЕТСТВЕННЫЙ: АДМИНИСТРАТОР СИСТЕМЫ`,
              fontSize: 10,
              margin: [0, 0, 0, 5]
            },
            {
              text: `ПРИМЕНЕНЫ ФИЛЬТРЫ: ${statusFilter !== 'ALL' ? statusFilter : 'БЕЗ ФИЛЬТРОВ'}`,
              fontSize: 10,
              margin: [0, 0, 0, 20]
            },
            
            // Общая статистика
            {
              text: 'I. ОБЩАЯ СТАТИСТИКА ТЕСТОВ',
              style: 'subheader',
              margin: [0, 20, 0, 10]
            },
            {
              table: {
                widths: ['*', '*'],
                body: [
                  ['ПОКАЗАТЕЛЬ', 'ЗНАЧЕНИЕ'],
                  ['ОБЩЕЕ КОЛИЧЕСТВО ТЕСТОВ', testStats.total.toString()],
                  ['ОПУБЛИКОВАННЫХ ТЕСТОВ', testStats.published.toString()],
                  ['ТЕСТОВ В РАЗРАБОТКЕ (ЧЕРНОВИКИ)', testStats.drafts.toString()],
                  ['НЕАКТИВНЫХ ТЕСТОВ', testStats.inactive.toString()],
                  ['ЗАПИСЕЙ В ВЫБОРКЕ', filteredTests.length.toString()]
                ]
              },
              layout: 'lightHorizontalLines',
              margin: [0, 0, 0, 20]
            },
            
            // Детальный список тестов
            {
              text: 'II. ДЕТАЛЬНЫЙ СПИСОК ТЕСТОВ',
              style: 'subheader',
              pageBreak: 'before',
              margin: [0, 0, 0, 10]
            },
            {
              table: {
                headerRows: 1,
                widths: [25, '*', 90, 80, 60, 40, 60, 60],
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
            
            // Системная информация
            {
              text: 'III. СИСТЕМНАЯ ИНФОРМАЦИЯ',
              style: 'subheader',
              margin: [0, 20, 0, 10]
            },
            {
              table: {
                widths: ['*', '*'],
                body: [
                  ['ПАРАМЕТР', 'ЗНАЧЕНИЕ'],
                  ['ВЕРСИЯ СИСТЕМЫ', '1.0.0'],
                  ['ОБЩЕЕ КОЛИЧЕСТВО КУРАТОРОВ', curators.length.toString()],
                  ['ОБЩЕЕ КОЛИЧЕСТВО НАПРАВЛЕНИЙ', directions.length.toString()],
                  ['ФИЛЬТР ПО СТАТУСУ', statusFilter !== 'ALL' ? statusFilter : 'НЕТ'],
                  ['ПОИСК ПО ЗАПРОСУ', searchTerm || 'НЕ ПРИМЕНЕН']
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
                  x2: 750, y2: 0,
                  lineWidth: 1
                }
              ],
              margin: [0, 20, 0, 10]
            },
            {
              text: 'ДОКУМЕНТ СФОРМИРОВАН АВТОМАТИЧЕСКИ СИСТЕМОЙ УПРАВЛЕНИЯ ТЕСТИРОВАНИЕМ',
              fontSize: 9,
              alignment: 'center',
              margin: [0, 0, 0, 10]
            },
            {
              columns: [
                {
                  stack: [
                    { text: 'ОТВЕТСТВЕННЫЙ: АДМИНИСТРАТОР СИСТЕМЫ', fontSize: 9 },
                    { text: 'ПОДПИСЬ: _______________________', fontSize: 9, margin: [0, 10, 0, 0] }
                  ]
                },
                {
                  stack: [
                    { text: `ДАТА: ${dateStr}`, fontSize: 9, alignment: 'right' },
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
        const fileName = `tests_report_${dateStr.replace(/\./g, '_')}_${timeStr.replace(/:/g, '-')}.pdf`;
        (window as any).pdfMake.createPdf(documentDefinition).download(fileName);
        
        toast.success('ОТЧЕТ ПО ТЕСТАМ УСПЕШНО ЭКСПОРТИРОВАН В PDF');
      };
      
      script2.onerror = () => {
        toast.error('ОШИБКА ЗАГРУЗКИ ШРИФТОВ ДЛЯ PDF');
      };
      
      document.head.appendChild(script2);
    };
    
    script1.onerror = () => {
      toast.error('ОШИБКА ЗАГРУЗКИ БИБЛИОТЕКИ PDFMAKE');
    };
    
    document.head.appendChild(script1);
  };

  const handlePublishTest = async (testId: string, testTitle: string) => {
    try {
      await publishTestMutation.mutateAsync(testId);
      toast.success(`✅ Тест "${testTitle}" опубликован`);
    } catch (error) {
      toast.error(`❌ Ошибка при публикации: ${(error as Error).message}`);
    }
  };

  const handleDeleteTest = async (testId: string, testTitle: string) => {
    if (
      window.confirm(
        `Удалить тест "${testTitle}"? Это действие нельзя отменить.`
      )
    ) {
      try {
        await deleteTestMutation.mutateAsync(testId);
        toast.success(`✅ Тест "${testTitle}" удален`);
      } catch (error) {
        toast.error(`❌ Ошибка при удалении: ${(error as Error).message}`);
      }
    }
  };

  const getStatusBadge = (test: TestWithDetails) => {
    if (!test.isActive) {
      return (
        <span className="px-2 py-1 text-xs font-mono font-bold bg-gray-800 text-gray-200 border border-gray-600 uppercase">
          НЕАКТИВЕН
        </span>
      );
    }
    if (test.isPublished) {
      return (
        <span className="px-2 py-1 text-xs font-mono font-bold bg-green-800 text-green-200 border border-green-600 uppercase">
          ОПУБЛИКОВАН
        </span>
      );
    }
    return (
      <span className="px-2 py-1 text-xs font-mono font-bold bg-yellow-800 text-yellow-200 border border-yellow-600 uppercase">
        ЧЕРНОВИК
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ru-RU", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return "БЕЗ ОГРАНИЧЕНИЙ";
    if (minutes < 60) return `${minutes} МИН`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}Ч ${remainingMinutes}М`;
  };

  // Расчет детальной статистики
  const detailedStats = useMemo(() => {
    // Статистика по направлениям
    const directionStats = directions.map(direction => {
      const directionTests = tests.filter(t => t.directionId === direction.$id);
      return {
        name: direction.name,
        institute: direction.institute?.name || 'НЕ УКАЗАН',
        total: directionTests.length,
        published: directionTests.filter(t => t.isPublished && t.isActive).length,
        drafts: directionTests.filter(t => !t.isPublished && t.isActive).length,
        inactive: directionTests.filter(t => !t.isActive).length,
        totalQuestions: directionTests.reduce((sum, t) => sum + t.totalQuestions, 0),
        avgQuestions: directionTests.length > 0 ? Math.round(directionTests.reduce((sum, t) => sum + t.totalQuestions, 0) / directionTests.length) : 0
      };
    });

    // Статистика по кураторам
    const curatorStats = curators.map(curator => {
      const curatorTests = tests.filter(t => t.curatorId === curator.$id);
      return {
        name: curator.name,
        email: curator.email,
        total: curatorTests.length,
        published: curatorTests.filter(t => t.isPublished && t.isActive).length,
        drafts: curatorTests.filter(t => !t.isPublished && t.isActive).length,
        inactive: curatorTests.filter(t => !t.isActive).length,
        totalQuestions: curatorTests.reduce((sum, t) => sum + t.totalQuestions, 0),
        avgScore: curatorTests.length > 0 ? Math.round(curatorTests.reduce((sum, t) => sum + t.maxScore, 0) / curatorTests.length) : 0
      };
    }).filter(stat => stat.total > 0); // Только кураторы с тестами

    // Временная статистика
    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const last3Months = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    const timeStats = {
      lastWeek: tests.filter(t => new Date(t.$createdAt) > lastWeek).length,
      lastMonth: tests.filter(t => new Date(t.$createdAt) > lastMonth).length,
      last3Months: tests.filter(t => new Date(t.$createdAt) > last3Months).length,
      publishedThisMonth: tests.filter(t => {
        const created = new Date(t.$createdAt);
        const published = t.isPublished && t.isActive;
        return published && created > lastMonth;
      }).length
    };

    // Статистика сложности
    const complexityStats = {
      easy: tests.filter(t => t.totalQuestions <= 10).length,
      medium: tests.filter(t => t.totalQuestions > 10 && t.totalQuestions <= 25).length,
      hard: tests.filter(t => t.totalQuestions > 25).length,
      shortTime: tests.filter(t => t.timeLimit && t.timeLimit <= 30).length,
      mediumTime: tests.filter(t => t.timeLimit && t.timeLimit > 30 && t.timeLimit <= 60).length,
      longTime: tests.filter(t => t.timeLimit && t.timeLimit > 60).length,
      noTimeLimit: tests.filter(t => !t.timeLimit).length
    };

    return {
      directions: directionStats,
      curators: curatorStats,
      time: timeStats,
      complexity: complexityStats
    };
  }, [tests, directions, curators]);

  if (showStatistics) {
    return (
     
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 border-2 border-slate-600 w-full max-w-6xl max-h-[90vh] overflow-auto">
              {/* Заголовок модального окна */}
              <div className="bg-slate-700 border-b-2 border-slate-600 p-4 flex items-center justify-between">
                <h2 className="text-xl font-mono font-bold text-white uppercase">
                  ДЕТАЛЬНАЯ СТАТИСТИКА ТЕСТОВ
                </h2>
                <button
                  onClick={() => {
                    console.log('Закрытие модального окна');
                    setShowStatistics(false);
                  }}
                  className="text-slate-300 font-mono font-bold text-xl px-3 py-1 border border-slate-500"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-8">
                {/* Общая статистика */}
                <div>
                  <h3 className="text-lg font-mono font-bold text-white mb-4 uppercase border-b border-slate-600 pb-2">
                    I. ОБЩИЕ ПОКАЗАТЕЛИ
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-slate-700 border border-slate-600 p-4">
                      <div className="text-2xl font-mono font-bold text-white">{testStats.total}</div>
                      <div className="text-xs font-mono text-slate-300 uppercase">ВСЕГО ТЕСТОВ</div>
                    </div>
                    <div className="bg-slate-700 border border-slate-600 p-4">
                      <div className="text-2xl font-mono font-bold text-green-400">{testStats.published}</div>
                      <div className="text-xs font-mono text-slate-300 uppercase">ОПУБЛИКОВАНО</div>
                    </div>
                    <div className="bg-slate-700 border border-slate-600 p-4">
                      <div className="text-2xl font-mono font-bold text-yellow-400">{testStats.drafts}</div>
                      <div className="text-xs font-mono text-slate-300 uppercase">ЧЕРНОВИКОВ</div>
                    </div>
                    <div className="bg-slate-700 border border-slate-600 p-4">
                      <div className="text-2xl font-mono font-bold text-gray-400">{testStats.inactive}</div>
                      <div className="text-xs font-mono text-slate-300 uppercase">НЕАКТИВНЫХ</div>
                    </div>
                  </div>
                </div>

                {/* Статистика по направлениям */}
                <div>
                  <h3 className="text-lg font-mono font-bold text-white mb-4 uppercase border-b border-slate-600 pb-2">
                    II. СТАТИСТИКА ПО НАПРАВЛЕНИЯМ
                  </h3>
                  <div className="bg-slate-700 border border-slate-600 overflow-hidden">
                    <div className="bg-slate-600 px-4 py-2 border-b border-slate-500">
                      <div className="grid grid-cols-8 gap-2 text-xs font-mono font-bold text-white uppercase">
                        <div>НАПРАВЛЕНИЕ</div>
                        <div>ИНСТИТУТ</div>
                        <div>ВСЕГО</div>
                        <div>ОПУБЛ.</div>
                        <div>ЧЕРН.</div>
                        <div>НЕАКТ.</div>
                        <div>ВОПРОСОВ</div>
                        <div>СРЕДНЕЕ</div>
                      </div>
                    </div>
                    <div className="divide-y divide-slate-600">
                      {detailedStats.directions.map((stat, index) => (
                        <div key={index} className="px-4 py-2">
                          <div className="grid grid-cols-8 gap-2 text-xs font-mono">
                            <div className="text-white font-bold truncate" title={stat.name}>{stat.name}</div>
                            <div className="text-slate-300 truncate" title={stat.institute}>{stat.institute}</div>
                            <div className="text-white">{stat.total}</div>
                            <div className="text-green-400">{stat.published}</div>
                            <div className="text-yellow-400">{stat.drafts}</div>
                            <div className="text-gray-400">{stat.inactive}</div>
                            <div className="text-blue-400">{stat.totalQuestions}</div>
                            <div className="text-blue-400">{stat.avgQuestions}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Статистика по кураторам */}
                {detailedStats.curators.length > 0 && (
                  <div>
                    <h3 className="text-lg font-mono font-bold text-white mb-4 uppercase border-b border-slate-600 pb-2">
                      III. АКТИВНОСТЬ КУРАТОРОВ
                    </h3>
                    <div className="bg-slate-700 border border-slate-600 overflow-hidden">
                      <div className="bg-slate-600 px-4 py-2 border-b border-slate-500">
                        <div className="grid grid-cols-7 gap-2 text-xs font-mono font-bold text-white uppercase">
                          <div>КУРАТОР</div>
                          <div>ВСЕГО ТЕСТОВ</div>
                          <div>ОПУБЛИКОВАНО</div>
                          <div>ЧЕРНОВИКОВ</div>
                          <div>НЕАКТИВНЫХ</div>
                          <div>ВСЕГО ВОПРОСОВ</div>
                          <div>СРЕДНИЙ БАЛЛ</div>
                        </div>
                      </div>
                      <div className="divide-y divide-slate-600">
                        {detailedStats.curators.map((stat, index) => (
                          <div key={index} className="px-4 py-2">
                            <div className="grid grid-cols-7 gap-2 text-xs font-mono">
                              <div className="text-white font-bold">{stat.name}</div>
                              <div className="text-white">{stat.total}</div>
                              <div className="text-green-400">{stat.published}</div>
                              <div className="text-yellow-400">{stat.drafts}</div>
                              <div className="text-gray-400">{stat.inactive}</div>
                              <div className="text-blue-400">{stat.totalQuestions}</div>
                              <div className="text-purple-400">{stat.avgScore}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Временная статистика */}
                <div>
                  <h3 className="text-lg font-mono font-bold text-white mb-4 uppercase border-b border-slate-600 pb-2">
                    IV. ВРЕМЕННАЯ СТАТИСТИКА
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-slate-700 border border-slate-600 p-4">
                      <div className="text-2xl font-mono font-bold text-blue-400">{detailedStats.time.lastWeek}</div>
                      <div className="text-xs font-mono text-slate-300 uppercase">ЗА НЕДЕЛЮ</div>
                    </div>
                    <div className="bg-slate-700 border border-slate-600 p-4">
                      <div className="text-2xl font-mono font-bold text-blue-400">{detailedStats.time.lastMonth}</div>
                      <div className="text-xs font-mono text-slate-300 uppercase">ЗА МЕСЯЦ</div>
                    </div>
                    <div className="bg-slate-700 border border-slate-600 p-4">
                      <div className="text-2xl font-mono font-bold text-blue-400">{detailedStats.time.last3Months}</div>
                      <div className="text-xs font-mono text-slate-300 uppercase">ЗА 3 МЕСЯЦА</div>
                    </div>
                    <div className="bg-slate-700 border border-slate-600 p-4">
                      <div className="text-2xl font-mono font-bold text-green-400">{detailedStats.time.publishedThisMonth}</div>
                      <div className="text-xs font-mono text-slate-300 uppercase">ОПУБЛ. ЗА МЕСЯЦ</div>
                    </div>
                  </div>
                </div>

                {/* Статистика сложности */}
                <div>
                  <h3 className="text-lg font-mono font-bold text-white mb-4 uppercase border-b border-slate-600 pb-2">
                    V. АНАЛИЗ СЛОЖНОСТИ ТЕСТОВ
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* По количеству вопросов */}
                    <div className="bg-slate-700 border border-slate-600 p-4">
                      <h4 className="text-sm font-mono font-bold text-white mb-3 uppercase">ПО КОЛИЧЕСТВУ ВОПРОСОВ:</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-xs font-mono text-slate-300">ЛЕГКИЕ (≤10 ВОПРОСОВ):</span>
                          <span className="text-xs font-mono text-white font-bold">{detailedStats.complexity.easy}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs font-mono text-slate-300">СРЕДНИЕ (11-25 ВОПРОСОВ):</span>
                          <span className="text-xs font-mono text-white font-bold">{detailedStats.complexity.medium}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs font-mono text-slate-300">СЛОЖНЫЕ (>25 ВОПРОСОВ):</span>
                          <span className="text-xs font-mono text-white font-bold">{detailedStats.complexity.hard}</span>
                        </div>
                      </div>
                    </div>

                    {/* По времени выполнения */}
                    <div className="bg-slate-700 border border-slate-600 p-4">
                      <h4 className="text-sm font-mono font-bold text-white mb-3 uppercase">ПО ВРЕМЕНИ ВЫПОЛНЕНИЯ:</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-xs font-mono text-slate-300">КОРОТКИЕ (≤30 МИН):</span>
                          <span className="text-xs font-mono text-white font-bold">{detailedStats.complexity.shortTime}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs font-mono text-slate-300">СРЕДНИЕ (31-60 МИН):</span>
                          <span className="text-xs font-mono text-white font-bold">{detailedStats.complexity.mediumTime}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs font-mono text-slate-300">ДЛИННЫЕ (>60 МИН):</span>
                          <span className="text-xs font-mono text-white font-bold">{detailedStats.complexity.longTime}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs font-mono text-slate-300">БЕЗ ОГРАНИЧЕНИЙ:</span>
                          <span className="text-xs font-mono text-white font-bold">{detailedStats.complexity.noTimeLimit}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Рекомендации */}
                <div>
                  <h3 className="text-lg font-mono font-bold text-white mb-4 uppercase border-b border-slate-600 pb-2">
                    VI. РЕКОМЕНДАЦИИ
                  </h3>
                  <div className="bg-blue-900 border border-blue-600 p-4">
                    <ul className="text-sm font-mono text-blue-300 space-y-1">
                      {testStats.drafts > testStats.published && (
                        <li>• МНОГО ЧЕРНОВИКОВ: РЕКОМЕНДУЕТСЯ АКТИВИЗИРОВАТЬ КУРАТОРОВ</li>
                      )}
                      {detailedStats.time.lastWeek === 0 && (
                        <li>• НОВЫХ ТЕСТОВ НЕТ: НИЗКАЯ АКТИВНОСТЬ СОЗДАНИЯ ТЕСТОВ</li>
                      )}
                      {detailedStats.complexity.easy > detailedStats.complexity.medium + detailedStats.complexity.hard && (
                        <li>• ПРЕОБЛАДАЮТ ЛЕГКИЕ ТЕСТЫ: РАССМОТРЕТЬ УВЕЛИЧЕНИЕ СЛОЖНОСТИ</li>
                      )}
                      {detailedStats.curators.length < curators.length && (
                        <li>• НЕ ВСЕ КУРАТОРЫ СОЗДАЛИ ТЕСТЫ: ПРОВЕСТИ ОБУЧЕНИЕ</li>
                      )}
                      <li>• РЕГУЛЯРНО МОНИТОРИТЬ КАЧЕСТВО СОЗДАВАЕМЫХ ТЕСТОВ</li>
                      <li>• ПОДДЕРЖИВАТЬ АКТУАЛЬНОСТЬ СОДЕРЖАНИЯ ТЕСТОВ</li>
                    </ul>
                  </div>
                </div>

                {/* Кнопка закрытия */}
                <div className="text-center pt-4 border-t border-slate-600">
                  <button
                    onClick={() => {
                      console.log('Закрытие модального окна через кнопку');
                      setShowStatistics(false);
                    }}
                    className="px-6 py-2 text-white bg-slate-700 border-2 border-slate-600 font-mono font-bold uppercase"
                  >
                    ЗАКРЫТЬ
                  </button>
                </div>
              </div>
            </div>
          </div>
          )
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Заголовок */}
        <div className="mb-8 border-b border-slate-700 pb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <TestTube className="h-8 w-8 text-blue-400" />
                <h1 className="text-3xl font-mono font-bold text-white uppercase tracking-wide">
                  ВСЕ ТЕСТЫ СИСТЕМЫ
                </h1>
              </div>
              <p className="text-slate-300 font-mono">
                ПРОСМОТР И УПРАВЛЕНИЕ ВСЕМИ ТЕСТАМИ В СИСТЕМЕ ТЕСТИРОВАНИЯ
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

              <button
                onClick={() => {
                  console.log('Кнопка статистика нажата, текущее состояние:', showStatistics);
                  setShowStatistics(true);
                }}
                className="flex items-center gap-2 px-4 py-2 text-purple-200 bg-slate-800 border-2 border-purple-600 font-mono font-bold uppercase"
              >
                <BarChart3 className="h-4 w-4" />
                СТАТИСТИКА
              </button>
            </div>
          </div>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800 border-2 border-slate-600 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TestTube className="h-8 w-8 text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-mono font-bold text-slate-300 uppercase">
                  ВСЕГО ТЕСТОВ
                </p>
                <p className="text-2xl font-mono font-bold text-white">
                  {testStats.total}
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
                  ОПУБЛИКОВАННЫЕ
                </p>
                <p className="text-2xl font-mono font-bold text-white">
                  {testStats.published}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 border-2 border-slate-600 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FileText className="h-8 w-8 text-yellow-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-mono font-bold text-slate-300 uppercase">
                  ЧЕРНОВИКИ
                </p>
                <p className="text-2xl font-mono font-bold text-white">
                  {testStats.drafts}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 border-2 border-slate-600 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Pause className="h-8 w-8 text-gray-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-mono font-bold text-slate-300 uppercase">
                  НЕАКТИВНЫЕ
                </p>
                <p className="text-2xl font-mono font-bold text-white">
                  {testStats.inactive}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Фильтры и поиск */}
        <div className="bg-slate-800 border-2 border-slate-600 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            {/* Поиск */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-mono font-bold text-slate-300 mb-2 uppercase">
                ПОИСК
              </label>
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="НАЗВАНИЕ ТЕСТА, НАПРАВЛЕНИЕ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border-2 border-slate-600 bg-slate-700 text-white font-mono placeholder-slate-400 uppercase"
                />
              </div>
            </div>

            {/* Фильтр по статусу */}
            <div>
              <label className="block text-sm font-mono font-bold text-slate-300 mb-2 uppercase">
                СТАТУС
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full px-3 py-2 border-2 border-slate-600 bg-slate-700 text-white font-mono"
              >
                <option value="ALL">ВСЕ СТАТУСЫ</option>
                <option value="PUBLISHED">ОПУБЛИКОВАННЫЕ</option>
                <option value="DRAFT">ЧЕРНОВИКИ</option>
                <option value="INACTIVE">НЕАКТИВНЫЕ</option>
              </select>
            </div>

            {/* Фильтр по куратору */}
            <div>
              <label className="block text-sm font-mono font-bold text-slate-300 mb-2 uppercase">
                КУРАТОР
              </label>
              <select
                value={curatorFilter}
                onChange={(e) => setCuratorFilter(e.target.value)}
                className="w-full px-3 py-2 border-2 border-slate-600 bg-slate-700 text-white font-mono"
              >
                <option value="ALL">ВСЕ КУРАТОРЫ</option>
                {curators.map((curator) => (
                  <option key={curator.$id} value={curator.$id}>
                    {curator.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Фильтр по направлению */}
            <div>
              <label className="block text-sm font-mono font-bold text-slate-300 mb-2 uppercase">
                НАПРАВЛЕНИЕ
              </label>
              <select
                value={directionFilter}
                onChange={(e) => setDirectionFilter(e.target.value)}
                className="w-full px-3 py-2 border-2 border-slate-600 bg-slate-700 text-white font-mono"
              >
                <option value="ALL">ВСЕ НАПРАВЛЕНИЯ</option>
                {directions.map((direction) => (
                  <option key={direction.$id} value={direction.$id}>
                    {direction.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <button
              onClick={() => refetch()}
              className="flex items-center gap-2 px-3 py-2 text-slate-300 font-mono font-bold border border-slate-600 uppercase"
            >
              <RefreshCw className="h-4 w-4" />
              ОБНОВИТЬ
            </button>
          </div>
        </div>

        {/* Список тестов */}
        <div className="bg-slate-800 border-2 border-slate-600">
          {filteredTests.length === 0 ? (
            <div className="text-center py-12">
              <TestTube className="h-16 w-16 text-slate-500 mx-auto mb-4" />
              <h3 className="text-lg font-mono font-bold text-white mb-2 uppercase">
                {tests.length === 0 ? "НЕТ ТЕСТОВ" : "ТЕСТЫ НЕ НАЙДЕНЫ"}
              </h3>
              <p className="text-slate-400 font-mono">
                {tests.length === 0
                  ? "ТЕСТЫ БУДУТ ПОЯВЛЯТЬСЯ ЗДЕСЬ ПОСЛЕ СОЗДАНИЯ КУРАТОРАМИ"
                  : "ПОПРОБУЙТЕ ИЗМЕНИТЬ ПАРАМЕТРЫ ПОИСКА"}
              </p>
            </div>
          ) : (
            <div className="overflow-hidden">
              {/* Заголовок таблицы */}
              <div className="bg-slate-700 px-6 py-3 border-b-2 border-slate-600">
                <div className="grid grid-cols-12 gap-4 items-center text-sm font-mono font-bold text-white uppercase">
                  <div className="col-span-4">ТЕСТ</div>
                  <div className="col-span-2">НАПРАВЛЕНИЕ</div>
                  <div className="col-span-2">КУРАТОР</div>
                  <div className="col-span-1">СТАТУС</div>
                  <div className="col-span-1">ВОПРОСЫ</div>
                  <div className="col-span-1">ВРЕМЯ</div>
                  <div className="col-span-1">ДЕЙСТВИЯ</div>
                </div>
              </div>

              {/* Список тестов */}
              <div className="divide-y-2 divide-slate-700">
                {filteredTests.map((test) => {
                  const curator = curators.find((c) => c.$id === test.curatorId);

                  return (
                    <div
                      key={test.$id}
                      className="px-6 py-4 bg-slate-800"
                    >
                      <div className="grid grid-cols-12 gap-4 items-center">
                        {/* Информация о тесте */}
                        <div className="col-span-4">
                          <div>
                            <h3 className="text-sm font-mono font-bold text-white mb-1">
                              {test.title}
                            </h3>
                            {test.description && (
                              <p className="text-xs text-slate-400 font-mono line-clamp-2">
                                {test.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-2 text-xs text-slate-400 font-mono">
                              <Calendar className="h-3 w-3" />
                              <span>СОЗДАН {formatDate(test.$createdAt)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Направление и институт */}
                        <div className="col-span-2">
                          <div className="text-sm">
                            <div className="flex items-center gap-1 mb-1">
                              <GraduationCap className="h-3 w-3 text-blue-400" />
                              <span className="font-mono font-bold text-white">
                                {test.direction?.name || "НЕ УКАЗАНО"}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Building className="h-3 w-3 text-slate-400" />
                              <span className="text-xs text-slate-400 font-mono">
                                {test.institute?.name || "НЕ УКАЗАН"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Куратор */}
                        <div className="col-span-2">
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3 text-purple-400" />
                            <span className="text-sm text-white font-mono">
                              {curator?.name || "НЕ НАЙДЕН"}
                            </span>
                          </div>
                          {curator?.email && (
                            <p className="text-xs text-slate-400 font-mono mt-1">
                              {curator.email}
                            </p>
                          )}
                        </div>

                        {/* Статус */}
                        <div className="col-span-1">{getStatusBadge(test)}</div>

                        {/* Количество вопросов */}
                        <div className="col-span-1">
                          <div className="flex items-center gap-1">
                            <Target className="h-3 w-3 text-slate-400" />
                            <span className="text-sm text-white font-mono">
                              {test.totalQuestions}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 font-mono">
                            {test.maxScore} БАЛЛОВ
                          </p>
                        </div>

                        {/* Время */}
                        <div className="col-span-1">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-slate-400" />
                            <span className="text-xs text-white font-mono">
                              {formatDuration(test.timeLimit)}
                            </span>
                          </div>
                        </div>

                        {/* Действия */}
                        <div className="col-span-1">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                /* TODO: просмотр теста */
                              }}
                              className="p-1 text-blue-400 border border-blue-600 bg-blue-900"
                              title="ПРОСМОТРЕТЬ ТЕСТ"
                            >
                              <Eye className="h-4 w-4" />
                            </button>

                            {!test.isPublished &&
                              test.isActive &&
                              test.totalQuestions > 0 && (
                                <button
                                  onClick={() =>
                                    handlePublishTest(test.$id, test.title)
                                  }
                                  disabled={publishTestMutation.isPending}
                                  className="p-1 text-green-400 border border-green-600 bg-green-900 disabled:opacity-50"
                                  title="ОПУБЛИКОВАТЬ ТЕСТ"
                                >
                                  <Play className="h-4 w-4" />
                                </button>
                              )}

                            <button
                              onClick={() =>
                                handleDeleteTest(test.$id, test.title)
                              }
                              disabled={deleteTestMutation.isPending}
                              className="p-1 text-red-400 border border-red-600 bg-red-900 disabled:opacity-50"
                              title="УДАЛИТЬ ТЕСТ"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Информационная панель */}
        <div className="mt-6 bg-blue-900 border-2 border-blue-600 p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-blue-400 mt-0.5" />
            <div>
              <h3 className="text-sm font-mono font-bold text-blue-200 mb-2 uppercase">
                УПРАВЛЕНИЕ ТЕСТАМИ
              </h3>
              <ul className="text-sm text-blue-300 font-mono space-y-1">
                <li>• АДМИНИСТРАТОР ИМЕЕТ ДОСТУП КО ВСЕМ ТЕСТАМ В СИСТЕМЕ</li>
                <li>• ТЕСТЫ СОЗДАЮТСЯ КУРАТОРАМИ ДЛЯ СВОИХ НАПРАВЛЕНИЙ</li>
                <li>• ТОЛЬКО ТЕСТЫ С ВОПРОСАМИ МОГУТ БЫТЬ ОПУБЛИКОВАНЫ</li>
                <li>• ОПУБЛИКОВАННЫЕ ТЕСТЫ СТАНОВЯТСЯ ДОСТУПНЫ АБИТУРИЕНТАМ</li>
                <li>• УДАЛЕНИЕ ТЕСТА ТАКЖЕ УДАЛЯЕТ ВСЕ ЕГО ВОПРОСЫ</li>
                <li>• НЕАКТИВНЫЕ ТЕСТЫ СКРЫТЫ ОТ АБИТУРИЕНТОВ</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}