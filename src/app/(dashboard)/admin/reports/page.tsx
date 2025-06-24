// src/app/(dashboard)/admin/reports/page.tsx
"use client";

import React, { useState } from "react";
import {
  useAllUsers,
  useApplicants,
  useCurators,
} from "@/services/authService";
import {
  useActiveInstitutes,
  useActiveDirections,
} from "@/services/instituteService";
import { useTests } from "@/services/testService";
import {
  DirectionStatistics,
  InstituteStatistics,
  CuratorStatistics,
  ApplicantProgress,
  TestStatistics,
  ReportFilters,
  UserRole,
  getTestGrade,
  getGradeColor,
  formatTimeSpent,
} from "@/types";
import { toast } from "react-toastify";
import {
  FileText,
  Download,
  Filter,
  Calendar,
  Users,
  GraduationCap,
  Building,
  TestTube,
  BarChart3,
  TrendingUp,
  Clock,
  Target,
  Award,
  CheckCircle,
  AlertTriangle,
  Search,
  RefreshCw,
  File,
  Eye,
  PieChart,
} from "lucide-react";

export default function AdminReportsPage() {
  const { data: allUsers = [] } = useAllUsers();
  const { data: applicants = [] } = useApplicants();
  const { data: curators = [] } = useCurators();
  const { data: institutes = [] } = useActiveInstitutes();
  const { data: directions = [] } = useActiveDirections();
  const { data: tests = [] } = useTests();

  const [activeTab, setActiveTab] = useState<
    "overview" | "applicants" | "testing" | "export"
  >("overview");
  const [reportFilters, setReportFilters] = useState<ReportFilters>({
    startDate: "",
    endDate: "",
    instituteIds: [],
    directionIds: [],
    curatorIds: [],
  });
  const [exportFormat, setExportFormat] = useState<"PDF" | "EXCEL">("PDF");
  const [searchTerm, setSearchTerm] = useState("");

  // Вычисление общей статистики
  const overallStats = React.useMemo(() => {
    const totalUsers = allUsers.length;
    const totalApplicants = applicants.length;
    const activeApplicants = applicants.filter(
      (a) => a.isActive && !a.isBlocked
    ).length;
    const totalTests = tests.length;
    const publishedTests = tests.filter((t) => t.isPublished).length;
    const totalQuestions = tests.reduce((sum, test) => sum + test.totalQuestions, 0);

    return {
      totalUsers,
      totalApplicants,
      activeApplicants,
      totalCurators: curators.length,
      totalInstitutes: institutes.length,
      totalDirections: directions.length,
      totalTests,
      publishedTests,
      totalQuestions,
    };
  }, [allUsers, applicants, curators, institutes, directions, tests]);

  // Статистика по институтам
  const instituteStats: InstituteStatistics[] = React.useMemo(() => {
    return institutes.map((institute) => {
      const instituteDirections = directions.filter(
        (d) => d.instituteId === institute.$id
      );
      const instituteApplicants = applicants.filter((a) =>
        instituteDirections.some((d) => d.$id === a.role) // TODO: связать с профилем
      );
      const instituteTests = tests.filter((t) =>
        instituteDirections.some((d) => d.$id === t.directionId)
      );

      return {
        instituteId: institute.$id,
        instituteName: institute.name,
        totalDirections: instituteDirections.length,
        totalApplicants: instituteApplicants.length,
        totalTests: instituteTests.length,
        completedTests: 0, // TODO: подсчитать из сессий
        averageScore: 0, // TODO: подсчитать из результатов
        passRate: 0, // TODO: подсчитать процент прошедших
      };
    });
  }, [institutes, directions, applicants, tests]);

  // Статистика по направлениям
  const directionStats: DirectionStatistics[] = React.useMemo(() => {
    return directions.map((direction) => {
      const institute = institutes.find((i) => i.$id === direction.instituteId);
      const directionApplicants = applicants.filter((a) =>
        a.role === UserRole.APPLICANT // TODO: связать с профилем направления
      );
      const directionTests = tests.filter((t) => t.directionId === direction.$id);

      return {
        directionId: direction.$id,
        directionName: direction.name,
        instituteId: direction.instituteId,
        instituteName: institute?.name || "Не найден",
        totalApplicants: directionApplicants.length,
        activeApplicants: directionApplicants.filter(
          (a) => a.isActive && !a.isBlocked
        ).length,
        completedTests: 0, // TODO: подсчитать из сессий
        averageScore: 0, // TODO: подсчитать из результатов
        passRate: 0, // TODO: подсчитать процент прошедших
      };
    });
  }, [directions, institutes, applicants, tests]);

  // Статистика по кураторам
  const curatorStats: CuratorStatistics[] = React.useMemo(() => {
    return curators.map((curator) => {
      const curatorTests = tests.filter((t) => t.curatorId === curator.$id);
      const publishedTests = curatorTests.filter((t) => t.isPublished);
      const totalQuestions = curatorTests.reduce(
        (sum, test) => sum + test.totalQuestions,
        0
      );

      return {
        curatorId: curator.$id,
        curatorName: curator.name,
        totalTests: curatorTests.length,
        publishedTests: publishedTests.length,
        totalQuestions,
        totalAttempts: 0, // TODO: подсчитать из сессий
        averageScore: 0, // TODO: подсчитать из результатов
        institutes: [], // TODO: получить назначения
      };
    });
  }, [curators, tests]);

  // Прогресс абитуриентов
  const applicantProgress: ApplicantProgress[] = React.useMemo(() => {
    return applicants.map((applicant) => {
      const direction = directions[0]; // TODO: получить из профиля
      const institute = institutes.find((i) => i.$id === direction?.instituteId);

      return {
        applicantId: applicant.$id,
        applicantName: applicant.name,
        directionName: direction?.name || "Не выбрано",
        instituteName: institute?.name || "Не найден",
        profileComplete: false, // TODO: проверить профиль
        testsAvailable: 0, // TODO: подсчитать доступные тесты
        testsCompleted: 0, // TODO: подсчитать завершенные тесты
        averageScore: 0, // TODO: подсчитать средний балл
        bestScore: 0, // TODO: подсчитать лучший балл
        lastActivity: applicant.$updatedAt,
      };
    });
  }, [applicants, directions, institutes]);

  // Функции для экспорта
  const downloadFile = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const generateExcelFile = (reportType: string) => {
    const currentDate = new Date().toLocaleDateString('ru-RU');
    let csvContent = '';

    // Добавляем BOM для корректного отображения кириллицы в Excel
    csvContent = '\uFEFF';

    switch (reportType) {
      case 'Отчет по абитуриентам':
        csvContent += `Отчет по абитуриентам от ${currentDate}\n\n`;
        csvContent += 'Абитуриент,Направление,Институт,Профиль заполнен,Тесты завершено,Тесты доступно,Лучший балл (%),Средний балл (%),Последняя активность\n';
        
        applicantProgress.forEach(applicant => {
          csvContent += `"${applicant.applicantName}","${applicant.directionName}","${applicant.instituteName}",`;
          csvContent += `"${applicant.profileComplete ? 'Да' : 'Нет'}",`;
          csvContent += `${applicant.testsCompleted},${applicant.testsAvailable},`;
          csvContent += `${applicant.bestScore || 0},${applicant.averageScore || 0},`;
          csvContent += `"${applicant.lastActivity ? new Date(applicant.lastActivity).toLocaleDateString('ru-RU') : '—'}"\n`;
        });
        break;

      case 'Статистика тестирования':
        csvContent += `Статистика тестирования от ${currentDate}\n\n`;
        csvContent += 'Тест,Направление,Институт,Куратор,Вопросы,Макс. балл,Проходной балл,Статус,Дата создания\n';
        
        tests.forEach(test => {
          const direction = directions.find(d => d.$id === test.directionId);
          const curator = curators.find(c => c.$id === test.curatorId);
          const institute = institutes.find(i => i.$id === direction?.instituteId);
          
          csvContent += `"${test.title}","${direction?.name || 'Не найдено'}","${institute?.name || 'Не найден'}",`;
          csvContent += `"${curator?.name || 'Не найден'}",${test.totalQuestions},${test.maxScore},${test.passingScore},`;
          csvContent += `"${test.isPublished ? 'Опубликован' : 'Черновик'}","${new Date(test.$createdAt).toLocaleDateString('ru-RU')}"\n`;
        });
        break;

      case 'Отчет по институтам':
        csvContent += `Отчет по институтам от ${currentDate}\n\n`;
        csvContent += 'Институт,Код,Направления,Абитуриенты,Тесты,Дата создания\n';
        
        instituteStats.forEach(institute => {
          const instituteData = institutes.find(i => i.$id === institute.instituteId);
          csvContent += `"${institute.instituteName}","${instituteData?.code || ''}",${institute.totalDirections},`;
          csvContent += `${institute.totalApplicants},${institute.totalTests},`;
          csvContent += `"${instituteData ? new Date(instituteData.$createdAt).toLocaleDateString('ru-RU') : ''}"\n`;
        });
        break;

      case 'Активность кураторов':
        csvContent += `Отчет по кураторам от ${currentDate}\n\n`;
        csvContent += 'Куратор,Email,Всего тестов,Опубликовано,Вопросов,Дата регистрации\n';
        
        curatorStats.forEach(curator => {
          const curatorData = curators.find(c => c.$id === curator.curatorId);
          csvContent += `"${curator.curatorName}","${curatorData?.email || ''}",${curator.totalTests},`;
          csvContent += `${curator.publishedTests},${curator.totalQuestions},`;
          csvContent += `"${curatorData ? new Date(curatorData.$createdAt).toLocaleDateString('ru-RU') : ''}"\n`;
        });
        break;

      default:
        csvContent += `Общий отчет системы от ${currentDate}\n\n`;
        csvContent += 'Показатель,Значение\n';
        csvContent += `"Всего пользователей",${overallStats.totalUsers}\n`;
        csvContent += `"Всего абитуриентов",${overallStats.totalApplicants}\n`;
        csvContent += `"Активных абитуриентов",${overallStats.activeApplicants}\n`;
        csvContent += `"Всего кураторов",${overallStats.totalCurators}\n`;
        csvContent += `"Институтов",${overallStats.totalInstitutes}\n`;
        csvContent += `"Направлений",${overallStats.totalDirections}\n`;
        csvContent += `"Всего тестов",${overallStats.totalTests}\n`;
        csvContent += `"Опубликованных тестов",${overallStats.publishedTests}\n`;
        csvContent += `"Всего вопросов",${overallStats.totalQuestions}\n`;
    }

    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  };

  const generatePDFFile = async (reportType: string) => {
    const currentDate = new Date().toLocaleDateString('ru-RU');
    
    // Создаем стилизованный HTML для PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="ru">
      <head>
        <meta charset="utf-8">
        <title>${reportType}</title>
        <style>
          * { 
            margin: 0; 
            padding: 0; 
            box-sizing: border-box; 
          }
          
          body { 
            font-family: 'Courier New', monospace; 
            font-size: 12px;
            line-height: 1.4;
            color: #333;
            background: white;
          }
          
          .container {
            max-width: 210mm;
            margin: 0 auto;
            padding: 15mm;
          }
          
          .header { 
            text-align: center; 
            margin-bottom: 30px; 
            border: 3px solid #1e293b; 
            padding: 20px;
            background: #334155;
            color: white;
          }
          
          .header h1 { 
            color: white; 
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 2px;
          }
          
          .header .subtitle { 
            color: #e2e8f0; 
            font-size: 14px;
            margin: 5px 0;
            text-transform: uppercase;
          }
          
          .stats-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); 
            gap: 0; 
            margin: 25px 0; 
            border: 2px solid #1e293b;
          }
          
          .stat-card { 
            border: 1px solid #475569; 
            padding: 20px; 
            text-align: center;
            background: #f1f5f9;
          }
          
          .stat-number { 
            font-size: 32px; 
            font-weight: bold; 
            color: #1e293b; 
            display: block;
            margin-bottom: 5px;
            font-family: 'Courier New', monospace;
          }
          
          .stat-label {
            color: #475569;
            font-size: 13px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 25px 0; 
            font-size: 11px;
            border: 2px solid #1e293b;
            font-family: 'Courier New', monospace;
          }
          
          th, td { 
            border: 1px solid #475569; 
            padding: 10px 8px; 
            text-align: left; 
          }
          
          th { 
            background: #334155; 
            color: white; 
            font-weight: bold; 
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          
          tr:nth-child(even) {
            background-color: #f1f5f9;
          }
          
          h2 {
            color: #1e293b;
            margin: 30px 0 15px 0;
            font-size: 20px;
            border: 2px solid #334155;
            background: #e2e8f0;
            padding: 15px;
            text-transform: uppercase;
            letter-spacing: 2px;
            font-weight: bold;
          }
          
          .section {
            margin-bottom: 40px;
            page-break-inside: avoid;
            border: 2px solid #64748b;
            padding: 20px;
          }
          
          .footer {
            margin-top: 50px;
            text-align: center;
            color: #1e293b;
            font-size: 10px;
            border: 2px solid #334155;
            padding: 20px;
            background: #f1f5f9;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          
          .summary-info {
            background: #e2e8f0;
            padding: 15px;
            margin: 20px 0;
            border: 2px solid #475569;
          }
          
          .summary-info h3 {
            color: #1e293b;
            font-size: 14px;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-weight: bold;
          }
          
          @page {
            size: A4;
            margin: 15mm;
          }
          
          @media print {
            body { 
              background: white !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .container {
              max-width: none;
              padding: 0;
            }
            .stat-card { 
              break-inside: avoid; 
              border: 2px solid #000 !important;
            }
            table { 
              break-inside: avoid; 
            }
            .section {
              page-break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${reportType}</h1>
            <div class="subtitle">Дата формирования: ${currentDate}</div>
            <div class="subtitle">Система тестирования абитуриентов</div>
          </div>
          
          ${generatePDFContentBody(reportType)}
          
          <div class="footer">
            <p><strong>Система тестирования абитуриентов</strong></p>
            <p>Отчет сгенерирован автоматически • © ${new Date().getFullYear()}</p>
          </div>
        </div>
        
        <script>
          // Автоматически открываем диалог печати
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 1000);
          };
        </script>
      </body>
      </html>
    `;

    // Открываем новое окно с отчетом
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
    }

    return null;
  };

  const generatePDFContentBody = (reportType: string) => {
    switch (reportType) {
      case 'Отчет по абитуриентам':
        return `
          <div class="section">
            <div class="summary-info">
              <h3>Краткая сводка</h3>
              <p>Общее количество абитуриентов: <strong>${overallStats.totalApplicants}</strong></p>
              <p>Активных абитуриентов: <strong>${overallStats.activeApplicants}</strong></p>
              <p>Процент активности: <strong>${overallStats.totalApplicants > 0 ? Math.round((overallStats.activeApplicants / overallStats.totalApplicants) * 100) : 0}%</strong></p>
            </div>
            
            <div class="stats-grid">
              <div class="stat-card">
                <span class="stat-number">${overallStats.totalApplicants}</span>
                <div class="stat-label">Всего абитуриентов</div>
              </div>
              <div class="stat-card">
                <span class="stat-number">${overallStats.activeApplicants}</span>
                <div class="stat-label">Активных</div>
              </div>
              <div class="stat-card">
                <span class="stat-number">${applicantProgress.filter(a => a.profileComplete).length}</span>
                <div class="stat-label">Профили заполнены</div>
              </div>
              <div class="stat-card">
                <span class="stat-number">${applicantProgress.filter(a => a.testsCompleted > 0).length}</span>
                <div class="stat-label">Прошли тесты</div>
              </div>
            </div>
            
            <h2>Детальная информация по абитуриентам</h2>
            <table>
              <thead>
                <tr>
                  <th style="width: 20%">Абитуриент</th>
                  <th style="width: 20%">Направление</th>
                  <th style="width: 15%">Институт</th>
                  <th style="width: 10%">Профиль</th>
                  <th style="width: 10%">Тесты</th>
                  <th style="width: 10%">Лучший балл</th>
                  <th style="width: 15%">Активность</th>
                </tr>
              </thead>
              <tbody>
                ${applicantProgress.map(applicant => `
                  <tr>
                    <td><strong>${applicant.applicantName}</strong></td>
                    <td>${applicant.directionName}</td>
                    <td>${applicant.instituteName}</td>
                    <td style="color: ${applicant.profileComplete ? '#059669' : '#dc2626'}">
                      ${applicant.profileComplete ? 'ЗАПОЛНЕН' : 'НЕ ЗАПОЛНЕН'}
                    </td>
                    <td>${applicant.testsCompleted}/${applicant.testsAvailable}</td>
                    <td style="font-weight: bold; color: ${applicant.bestScore > 60 ? '#059669' : applicant.bestScore > 0 ? '#d97706' : '#6b7280'}">
                      ${applicant.bestScore > 0 ? applicant.bestScore + '%' : '—'}
                    </td>
                    <td>${applicant.lastActivity ? new Date(applicant.lastActivity).toLocaleDateString('ru-RU') : '—'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;

      case 'Статистика тестирования':
        return `
          <div class="section">
            <div class="summary-info">
              <h3>Общая статистика тестирования</h3>
              <p>Всего создано тестов: <strong>${overallStats.totalTests}</strong></p>
              <p>Опубликованных тестов: <strong>${overallStats.publishedTests}</strong></p>
              <p>Процент публикации: <strong>${overallStats.totalTests > 0 ? Math.round((overallStats.publishedTests / overallStats.totalTests) * 100) : 0}%</strong></p>
            </div>
            
            <div class="stats-grid">
              <div class="stat-card">
                <span class="stat-number">${overallStats.totalTests}</span>
                <div class="stat-label">Всего тестов</div>
              </div>
              <div class="stat-card">
                <span class="stat-number">${overallStats.publishedTests}</span>
                <div class="stat-label">Опубликовано</div>
              </div>
              <div class="stat-card">
                <span class="stat-number">${overallStats.totalQuestions}</span>
                <div class="stat-label">Всего вопросов</div>
              </div>
              <div class="stat-card">
                <span class="stat-number">${overallStats.totalTests - overallStats.publishedTests}</span>
                <div class="stat-label">Черновики</div>
              </div>
            </div>
            
            <h2>Детальная информация по тестам</h2>
            <table>
              <thead>
                <tr>
                  <th style="width: 25%">Тест</th>
                  <th style="width: 20%">Направление</th>
                  <th style="width: 15%">Куратор</th>
                  <th style="width: 10%">Вопросы</th>
                  <th style="width: 10%">Макс. балл</th>
                  <th style="width: 10%">Статус</th>
                  <th style="width: 10%">Дата</th>
                </tr>
              </thead>
              <tbody>
                ${tests.map(test => {
                  const direction = directions.find(d => d.$id === test.directionId);
                  const curator = curators.find(c => c.$id === test.curatorId);
                  
                  return `
                    <tr>
                      <td><strong>${test.title}</strong></td>
                      <td>${direction?.name || 'НЕ НАЙДЕНО'}</td>
                      <td>${curator?.name || 'НЕ НАЙДЕН'}</td>
                      <td style="text-align: center">${test.totalQuestions}</td>
                      <td style="text-align: center">${test.maxScore}</td>
                      <td style="color: ${test.isPublished ? '#059669' : '#d97706'}; font-weight: bold">
                        ${test.isPublished ? 'ОПУБЛИКОВАН' : 'ЧЕРНОВИК'}
                      </td>
                      <td>${new Date(test.$createdAt).toLocaleDateString('ru-RU')}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        `;

      default:
        return `
          <div class="section">
            <div class="summary-info">
              <h3>Сводка по системе</h3>
              <p>Система содержит полную информацию о ${overallStats.totalUsers} пользователях, 
              включая ${overallStats.totalApplicants} абитуриентов и ${overallStats.totalCurators} кураторов.</p>
            </div>
            
            <div class="stats-grid">
              <div class="stat-card">
                <span class="stat-number">${overallStats.totalUsers}</span>
                <div class="stat-label">Всего пользователей</div>
              </div>
              <div class="stat-card">
                <span class="stat-number">${overallStats.activeApplicants}</span>
                <div class="stat-label">Активных абитуриентов</div>
              </div>
              <div class="stat-card">
                <span class="stat-number">${overallStats.publishedTests}</span>
                <div class="stat-label">Опубликованных тестов</div>
              </div>
              <div class="stat-card">
                <span class="stat-number">${overallStats.totalInstitutes}</span>
                <div class="stat-label">Институтов</div>
              </div>
            </div>
            
            <h2>Статистика по институтам</h2>
            <table>
              <thead>
                <tr>
                  <th style="width: 40%">Институт</th>
                  <th style="width: 15%">Направления</th>
                  <th style="width: 15%">Абитуриенты</th>
                  <th style="width: 15%">Тесты</th>
                  <th style="width: 15%">Эффективность</th>
                </tr>
              </thead>
              <tbody>
                ${instituteStats.map(institute => {
                  const efficiency = institute.totalDirections > 0 ? 
                    Math.round((institute.totalTests / institute.totalDirections) * 10) / 10 : 0;
                  
                  return `
                    <tr>
                      <td><strong>${institute.instituteName}</strong></td>
                      <td style="text-align: center">${institute.totalDirections}</td>
                      <td style="text-align: center">${institute.totalApplicants}</td>
                      <td style="text-align: center">${institute.totalTests}</td>
                      <td style="text-align: center; color: ${efficiency > 2 ? '#059669' : efficiency > 1 ? '#d97706' : '#dc2626'}">${efficiency} ТЕСТ/НАПР.</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        `;
    }
  };

  // Обработчики экспорта
  const handleExportReport = async (type: string) => {
    try {
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      
      if (exportFormat === "PDF") {
        toast.info("ГЕНЕРАЦИЯ PDF ОТЧЕТА...");
        
        await generatePDFFile(type);
        
        setTimeout(() => {
          toast.success(`PDF ОТЧЕТ "${type}" ГОТОВ! ИСПОЛЬЗУЙТЕ CTRL+P ДЛЯ СОХРАНЕНИЯ.`);
        }, 1500);
      } else {
        toast.info("ГЕНЕРАЦИЯ EXCEL ОТЧЕТА...");
        
        const csvBlob = generateExcelFile(type);
        const filename = `${type.replace(/\s+/g, '_')}_${timestamp}.csv`;
        
        downloadFile(csvBlob, filename);
        
        setTimeout(() => {
          toast.success(`EXCEL ФАЙЛ "${type}" ЗАГРУЖЕН!`);
        }, 500);
      }
    } catch (error) {
      toast.error(`ОШИБКА ЭКСПОРТА: ${(error as Error).message}`);
    }
  };

  const filteredApplicants = applicantProgress.filter((applicant) =>
    applicant.applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    applicant.directionName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredInstitutes = instituteStats.filter((institute) =>
    institute.instituteName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const tabs = [
    { id: "overview", label: "ОБЗОР", icon: BarChart3 },
    { id: "applicants", label: "АБИТУРИЕНТЫ", icon: GraduationCap },
    { id: "testing", label: "ТЕСТИРОВАНИЕ", icon: TestTube },
    { id: "export", label: "ЭКСПОРТ", icon: Download },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Заголовок */}
        <div className="mb-8 border-b-2 border-slate-700 pb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <FileText className="h-8 w-8 text-blue-400" />
                <h1 className="text-3xl font-mono font-bold text-white uppercase tracking-wide">
                  ОТЧЕТЫ И АНАЛИТИКА
                </h1>
              </div>
              <p className="text-slate-300 font-mono uppercase">
                ДЕТАЛЬНЫЕ ОТЧЕТЫ И СТАТИСТИКА СИСТЕМЫ ТЕСТИРОВАНИЯ
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleExportReport("Общий отчет")}
                className="flex items-center gap-2 px-4 py-2 bg-blue-800 text-blue-200 border-2 border-blue-600 font-mono font-bold uppercase"
              >
                <Download className="h-4 w-4" />
                ЭКСПОРТ ОТЧЕТА
              </button>
            </div>
          </div>
        </div>

        {/* Навигация по вкладкам */}
        <div className="mb-8">
          <div className="border-b-2 border-slate-700">
            <nav className="flex space-x-0">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 py-3 px-6 border-2 font-mono font-bold text-sm uppercase tracking-wide ${
                    activeTab === tab.id
                      ? "border-blue-500 bg-blue-800 text-blue-200"
                      : "border-slate-600 bg-slate-800 text-slate-300"
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Содержимое вкладок */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Общая статистика */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                      {overallStats.totalUsers}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800 border-2 border-slate-600 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <GraduationCap className="h-8 w-8 text-green-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-mono font-bold text-slate-300 uppercase">
                      АКТИВНЫХ АБИТУРИЕНТОВ
                    </p>
                    <p className="text-2xl font-mono font-bold text-white">
                      {overallStats.activeApplicants}
                    </p>
                    <p className="text-xs text-slate-400 font-mono">
                      ИЗ {overallStats.totalApplicants} ВСЕГО
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800 border-2 border-slate-600 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <TestTube className="h-8 w-8 text-indigo-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-mono font-bold text-slate-300 uppercase">
                      ОПУБЛИКОВАННЫХ ТЕСТОВ
                    </p>
                    <p className="text-2xl font-mono font-bold text-white">
                      {overallStats.publishedTests}
                    </p>
                    <p className="text-xs text-slate-400 font-mono">
                      ИЗ {overallStats.totalTests} СОЗДАННЫХ
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800 border-2 border-slate-600 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Building className="h-8 w-8 text-purple-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-mono font-bold text-slate-300 uppercase">
                      ИНСТИТУТОВ И НАПРАВЛЕНИЙ
                    </p>
                    <p className="text-2xl font-mono font-bold text-white">
                      {overallStats.totalInstitutes}
                    </p>
                    <p className="text-xs text-slate-400 font-mono">
                      {overallStats.totalDirections} НАПРАВЛЕНИЙ
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Статистика по институтам */}
            <div className="bg-slate-800 border-2 border-slate-600">
              <div className="px-6 py-4 border-b-2 border-slate-600 bg-slate-700">
                <h3 className="text-lg font-mono font-bold text-white flex items-center gap-2 uppercase">
                  <Building className="h-5 w-5 text-purple-400" />
                  СТАТИСТИКА ПО ИНСТИТУТАМ
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {instituteStats.map((institute) => (
                    <div
                      key={institute.instituteId}
                      className="bg-slate-700 border border-slate-600 p-4"
                    >
                      <h4 className="font-mono font-bold text-white mb-2">
                        {institute.instituteName}
                      </h4>
                      <div className="space-y-2 text-sm font-mono">
                        <div className="flex justify-between border-b border-slate-600 pb-1">
                          <span className="text-slate-300">НАПРАВЛЕНИЯ:</span>
                          <span className="font-bold text-white">
                            {institute.totalDirections}
                          </span>
                        </div>
                        <div className="flex justify-between border-b border-slate-600 pb-1">
                          <span className="text-slate-300">АБИТУРИЕНТЫ:</span>
                          <span className="font-bold text-white">
                            {institute.totalApplicants}
                          </span>
                        </div>
                        <div className="flex justify-between border-b border-slate-600 pb-1">
                          <span className="text-slate-300">ТЕСТЫ:</span>
                          <span className="font-bold text-white">
                            {institute.totalTests}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "applicants" && (
          <div className="space-y-6">
            {/* Поиск и фильтры */}
            <div className="bg-slate-800 border-2 border-slate-600 p-6">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="ПОИСК АБИТУРИЕНТОВ..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border-2 border-slate-600 bg-slate-700 text-white font-mono placeholder-slate-400 uppercase"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleExportReport("Отчет по абитуриентам")}
                    className="flex items-center gap-2 px-4 py-2 bg-red-800 text-red-200 border-2 border-red-600 font-mono font-bold uppercase"
                  >
                    <FileText className="h-4 w-4" />
                    ЭКСПОРТ PDF
                  </button>
                </div>
              </div>
            </div>

            {/* Таблица абитуриентов */}
            <div className="bg-slate-800 border-2 border-slate-600">
              <div className="px-6 py-4 border-b-2 border-slate-600 bg-slate-700">
                <h3 className="text-lg font-mono font-bold text-white flex items-center gap-2 uppercase">
                  <GraduationCap className="h-5 w-5 text-green-400" />
                  ПРОГРЕСС АБИТУРИЕНТОВ ({filteredApplicants.length})
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-slate-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-mono font-bold text-white uppercase tracking-wider border-r border-slate-600">
                        АБИТУРИЕНТ
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-mono font-bold text-white uppercase tracking-wider border-r border-slate-600">
                        НАПРАВЛЕНИЕ
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-mono font-bold text-white uppercase tracking-wider border-r border-slate-600">
                        ПРОФИЛЬ
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-mono font-bold text-white uppercase tracking-wider border-r border-slate-600">
                        ТЕСТЫ
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-mono font-bold text-white uppercase tracking-wider border-r border-slate-600">
                        ЛУЧШИЙ БАЛЛ
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-mono font-bold text-white uppercase tracking-wider">
                        ПОСЛЕДНЯЯ АКТИВНОСТЬ
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-slate-700">
                    {filteredApplicants.map((applicant) => (
                      <tr key={applicant.applicantId} className="bg-slate-800">
                        <td className="px-6 py-4 border-r border-slate-700">
                          <div className="text-sm font-mono font-bold text-white">
                            {applicant.applicantName}
                          </div>
                        </td>
                        <td className="px-6 py-4 border-r border-slate-700">
                          <div className="text-sm font-mono text-white">
                            {applicant.directionName}
                          </div>
                          <div className="text-xs font-mono text-slate-400">
                            {applicant.instituteName}
                          </div>
                        </td>
                        <td className="px-6 py-4 border-r border-slate-700">
                          {applicant.profileComplete ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-mono font-bold bg-green-800 text-green-200 border border-green-600 uppercase">
                              <CheckCircle className="h-3 w-3" />
                              ЗАПОЛНЕН
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-mono font-bold bg-yellow-800 text-yellow-200 border border-yellow-600 uppercase">
                              <AlertTriangle className="h-3 w-3" />
                              НЕ ЗАПОЛНЕН
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 border-r border-slate-700">
                          <div className="text-sm font-mono text-white">
                            {applicant.testsCompleted} / {applicant.testsAvailable}
                          </div>
                          <div className="text-xs font-mono text-slate-400 uppercase">ЗАВЕРШЕНО</div>
                        </td>
                        <td className="px-6 py-4 border-r border-slate-700">
                          <div className="text-sm font-mono font-bold text-white">
                            {applicant.bestScore > 0 ? `${applicant.bestScore}%` : "—"}
                          </div>
                          {applicant.averageScore > 0 && (
                            <div className="text-xs font-mono text-slate-400 uppercase">
                              СРЕДНИЙ: {applicant.averageScore}%
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm font-mono text-slate-300">
                          {applicant.lastActivity
                            ? new Date(applicant.lastActivity).toLocaleDateString("ru-RU")
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "testing" && (
          <div className="space-y-6">
            {/* Статистика тестирования */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-800 border-2 border-slate-600 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Target className="h-8 w-8 text-blue-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-mono font-bold text-slate-300 uppercase">
                      ВСЕГО ВОПРОСОВ
                    </p>
                    <p className="text-2xl font-mono font-bold text-white">
                      {overallStats.totalQuestions}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800 border-2 border-slate-600 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Clock className="h-8 w-8 text-orange-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-mono font-bold text-slate-300 uppercase">
                      СРЕДНЕЕ ВРЕМЯ ТЕСТА
                    </p>
                    <p className="text-2xl font-mono font-bold text-white">—</p>
                    <p className="text-xs text-slate-400 font-mono uppercase">БУДЕТ РАССЧИТАНО</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800 border-2 border-slate-600 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Award className="h-8 w-8 text-yellow-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-mono font-bold text-slate-300 uppercase">
                      СРЕДНИЙ БАЛЛ
                    </p>
                    <p className="text-2xl font-mono font-bold text-white">—</p>
                    <p className="text-xs text-slate-400 font-mono uppercase">БУДЕТ РАССЧИТАН</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Статистика по тестам */}
            <div className="bg-slate-800 border-2 border-slate-600">
              <div className="px-6 py-4 border-b-2 border-slate-600 bg-slate-700">
                <h3 className="text-lg font-mono font-bold text-white flex items-center gap-2 uppercase">
                  <TestTube className="h-5 w-5 text-indigo-400" />
                  СТАТИСТИКА ПО ТЕСТАМ
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-slate-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-mono font-bold text-white uppercase tracking-wider border-r border-slate-600">
                        ТЕСТ
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-mono font-bold text-white uppercase tracking-wider border-r border-slate-600">
                        НАПРАВЛЕНИЕ
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-mono font-bold text-white uppercase tracking-wider border-r border-slate-600">
                        КУРАТОР
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-mono font-bold text-white uppercase tracking-wider border-r border-slate-600">
                        ВОПРОСЫ
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-mono font-bold text-white uppercase tracking-wider border-r border-slate-600">
                        МАКС. БАЛЛ
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-mono font-bold text-white uppercase tracking-wider">
                        СТАТУС
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-slate-700">
                    {tests.map((test) => {
                      const direction = directions.find((d) => d.$id === test.directionId);
                      const curator = curators.find((c) => c.$id === test.curatorId);

                      return (
                        <tr key={test.$id} className="bg-slate-800">
                          <td className="px-6 py-4 border-r border-slate-700">
                            <div className="text-sm font-mono font-bold text-white">
                              {test.title}
                            </div>
                            {test.description && (
                              <div className="text-xs font-mono text-slate-400 line-clamp-2">
                                {test.description}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 border-r border-slate-700">
                            <div className="text-sm font-mono text-white">
                              {direction?.name || "НЕ НАЙДЕНО"}
                            </div>
                            <div className="text-xs font-mono text-slate-400">
                              {direction?.code}
                            </div>
                          </td>
                          <td className="px-6 py-4 border-r border-slate-700">
                            <div className="text-sm font-mono text-white">
                              {curator?.name || "НЕ НАЙДЕН"}
                            </div>
                          </td>
                          <td className="px-6 py-4 border-r border-slate-700">
                            <div className="text-sm font-mono text-white text-center">
                              {test.totalQuestions}
                            </div>
                          </td>
                          <td className="px-6 py-4 border-r border-slate-700">
                            <div className="text-sm font-mono text-white text-center">
                              {test.maxScore}
                            </div>
                            <div className="text-xs font-mono text-slate-400 text-center uppercase">
                              ПРОХОДНОЙ: {test.passingScore}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {test.isPublished ? (
                              <span className="inline-flex items-center px-2 py-1 text-xs font-mono font-bold bg-green-800 text-green-200 border border-green-600 uppercase">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                ОПУБЛИКОВАН
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 text-xs font-mono font-bold bg-yellow-800 text-yellow-200 border border-yellow-600 uppercase">
                                <Clock className="h-3 w-3 mr-1" />
                                ЧЕРНОВИК
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Статистика по кураторам */}
            <div className="bg-slate-800 border-2 border-slate-600">
              <div className="px-6 py-4 border-b-2 border-slate-600 bg-slate-700">
                <h3 className="text-lg font-mono font-bold text-white flex items-center gap-2 uppercase">
                  <Users className="h-5 w-5 text-purple-400" />
                  АКТИВНОСТЬ КУРАТОРОВ
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {curatorStats.map((curator) => (
                    <div
                      key={curator.curatorId}
                      className="bg-slate-700 border border-slate-600 p-4"
                    >
                      <h4 className="font-mono font-bold text-white mb-2">
                        {curator.curatorName}
                      </h4>
                      <div className="space-y-2 text-sm font-mono">
                        <div className="flex justify-between border-b border-slate-600 pb-1">
                          <span className="text-slate-300">ВСЕГО ТЕСТОВ:</span>
                          <span className="font-bold text-white">{curator.totalTests}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-600 pb-1">
                          <span className="text-slate-300">ОПУБЛИКОВАНО:</span>
                          <span className="font-bold text-green-400">
                            {curator.publishedTests}
                          </span>
                        </div>
                        <div className="flex justify-between border-b border-slate-600 pb-1">
                          <span className="text-slate-300">ВОПРОСОВ:</span>
                          <span className="font-bold text-white">
                            {curator.totalQuestions}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "export" && (
          <div className="space-y-6">
            {/* Настройки экспорта */}
            <div className="bg-slate-800 border-2 border-slate-600 p-6">
              <h3 className="text-lg font-mono font-bold text-white mb-4 flex items-center gap-2 uppercase">
                <Download className="h-5 w-5 text-blue-400" />
                НАСТРОЙКИ ЭКСПОРТА
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-mono font-bold text-white mb-2 uppercase">
                    ФОРМАТ ЭКСПОРТА
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="exportFormat"
                        value="PDF"
                        checked={exportFormat === "PDF"}
                        onChange={(e) => setExportFormat(e.target.value as "PDF")}
                        className="mr-2 bg-slate-700 border-2 border-slate-600"
                      />
                      <FileText className="h-4 w-4 text-red-400 mr-2" />
                      <span className="font-mono text-white uppercase">PDF ДОКУМЕНТ</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-mono font-bold text-white mb-2 uppercase">
                    ПЕРИОД ОТЧЕТА
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="date"
                      value={reportFilters.startDate}
                      onChange={(e) =>
                        setReportFilters((prev) => ({
                          ...prev,
                          startDate: e.target.value,
                        }))
                      }
                      className="px-3 py-2 border-2 border-slate-600 bg-slate-700 text-white font-mono"
                    />
                    <input
                      type="date"
                      value={reportFilters.endDate}
                      onChange={(e) =>
                        setReportFilters((prev) => ({
                          ...prev,
                          endDate: e.target.value,
                        }))
                      }
                      className="px-3 py-2 border-2 border-slate-600 bg-slate-700 text-white font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Доступные отчеты */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  title: "Общий отчет",
                  description: "ПОЛНАЯ СТАТИСТИКА СИСТЕМЫ",
                  icon: BarChart3,
                  color: "bg-blue-800 border-blue-600",
                },
                {
                  title: "Отчет по абитуриентам",
                  description: "ПРОГРЕСС И РЕЗУЛЬТАТЫ АБИТУРИЕНТОВ",
                  icon: GraduationCap,
                  color: "bg-green-800 border-green-600",
                },
                {
                  title: "Статистика тестирования",
                  description: "АНАЛИЗ РЕЗУЛЬТАТОВ ТЕСТОВ",
                  icon: TestTube,
                  color: "bg-indigo-800 border-indigo-600",
                },
                {
                  title: "Отчет по институтам",
                  description: "СТАТИСТИКА ПО ИНСТИТУТАМ",
                  icon: Building,
                  color: "bg-purple-800 border-purple-600",
                },
                {
                  title: "Активность кураторов",
                  description: "СТАТИСТИКА РАБОТЫ КУРАТОРОВ",
                  icon: Users,
                  color: "bg-orange-800 border-orange-600",
                },
                {
                  title: "Анализ времени",
                  description: "ВРЕМЯ ПРОХОЖДЕНИЯ ТЕСТОВ",
                  icon: Clock,
                  color: "bg-yellow-800 border-yellow-600",
                },
              ].map((report) => (
                <div
                  key={report.title}
                  className="bg-slate-800 border-2 border-slate-600 p-6"
                >
                  <div className="flex items-center mb-4">
                    <div className={`${report.color} border-2 p-3 text-white mr-4`}>
                      <report.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-mono font-bold text-white">
                        {report.title}
                      </h4>
                      <p className="text-sm font-mono text-slate-400">{report.description}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleExportReport(report.title)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 text-slate-300 bg-slate-700 border-2 border-slate-600 font-mono font-bold uppercase"
                  >
                    <Download className="h-4 w-4" />
                    ЭКСПОРТИРОВАТЬ
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Информационная панель */}
        <div className="mt-8 bg-blue-900 border-2 border-blue-600 p-6">
          <div className="flex items-start gap-3">
            <TrendingUp className="h-5 w-5 text-blue-400 mt-0.5" />
            <div>
              <h3 className="text-sm font-mono font-bold text-blue-200 mb-2 uppercase">
                ВОЗМОЖНОСТИ ОТЧЕТОВ
              </h3>
              <ul className="text-sm font-mono text-blue-300 space-y-1">
                <li>• ПОДРОБНАЯ АНАЛИТИКА ПО ВСЕМ АСПЕКТАМ СИСТЕМЫ ТЕСТИРОВАНИЯ</li>
                <li>• ЭКСПОРТ ДАННЫХ В ФОРМАТЕ PDF</li>
                <li>• ФИЛЬТРАЦИЯ ОТЧЕТОВ ПО ДАТАМ, ИНСТИТУТАМ И НАПРАВЛЕНИЯМ</li>
                <li>• МОНИТОРИНГ ПРОГРЕССА АБИТУРИЕНТОВ И АКТИВНОСТИ КУРАТОРОВ</li>
                <li>• СТАТИСТИКА РЕЗУЛЬТАТОВ ТЕСТИРОВАНИЯ И АНАЛИЗ ВРЕМЕНИ</li>
                <li>• АВТОМАТИЧЕСКОЕ ОБНОВЛЕНИЕ ДАННЫХ В РЕЖИМЕ РЕАЛЬНОГО ВРЕМЕНИ</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}