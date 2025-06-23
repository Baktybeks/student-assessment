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
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; 
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
            border-bottom: 3px solid #ec4899; 
            padding-bottom: 20px;
          }
          
          .header h1 { 
            color: #ec4899; 
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          
          .header .subtitle { 
            color: #666; 
            font-size: 14px;
            margin: 5px 0;
          }
          
          .stats-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); 
            gap: 15px; 
            margin: 25px 0; 
          }
          
          .stat-card { 
            border: 2px solid #e5e7eb; 
            padding: 20px; 
            border-radius: 10px; 
            text-align: center;
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          }
          
          .stat-number { 
            font-size: 32px; 
            font-weight: bold; 
            color: #ec4899; 
            display: block;
            margin-bottom: 5px;
          }
          
          .stat-label {
            color: #495057;
            font-size: 13px;
            font-weight: 500;
          }
          
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 25px 0; 
            font-size: 11px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          
          th, td { 
            border: 1px solid #dee2e6; 
            padding: 10px 8px; 
            text-align: left; 
          }
          
          th { 
            background: linear-gradient(135deg, #ec4899 0%, #be185d 100%); 
            color: white; 
            font-weight: bold; 
            font-size: 12px;
          }
          
          tr:nth-child(even) {
            background-color: #f8f9fa;
          }
          
          tr:hover {
            background-color: #e9ecef;
          }
          
          h2 {
            color: #212529;
            margin: 30px 0 15px 0;
            font-size: 20px;
            border-left: 4px solid #ec4899;
            padding-left: 15px;
          }
          
          .section {
            margin-bottom: 40px;
            page-break-inside: avoid;
          }
          
          .footer {
            margin-top: 50px;
            text-align: center;
            color: #6c757d;
            font-size: 10px;
            border-top: 1px solid #dee2e6;
            padding-top: 20px;
          }
          
          .summary-info {
            background: #f1f3f4;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #ec4899;
          }
          
          .summary-info h3 {
            color: #ec4899;
            font-size: 14px;
            margin-bottom: 10px;
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
              border: 1px solid #000 !important;
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
                    <td style="color: ${applicant.profileComplete ? '#28a745' : '#dc3545'}">
                      ${applicant.profileComplete ? '✓ Заполнен' : '✗ Не заполнен'}
                    </td>
                    <td>${applicant.testsCompleted}/${applicant.testsAvailable}</td>
                    <td style="font-weight: bold; color: ${applicant.bestScore > 60 ? '#28a745' : applicant.bestScore > 0 ? '#fd7e14' : '#6c757d'}">
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
                      <td>${direction?.name || 'Не найдено'}</td>
                      <td>${curator?.name || 'Не найден'}</td>
                      <td style="text-align: center">${test.totalQuestions}</td>
                      <td style="text-align: center">${test.maxScore}</td>
                      <td style="color: ${test.isPublished ? '#28a745' : '#fd7e14'}; font-weight: bold">
                        ${test.isPublished ? '✓ Опубликован' : '⏳ Черновик'}
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
                      <td style="text-align: center; color: ${efficiency > 2 ? '#28a745' : efficiency > 1 ? '#fd7e14' : '#dc3545'}">${efficiency} тест/напр.</td>
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
        toast.info("Открытие диалога печати для сохранения в PDF...");
        
        await generatePDFFile(type);
        
        setTimeout(() => {
          toast.success(`PDF отчет "${type}" готов! Используйте Ctrl+P для сохранения в PDF.`);
        }, 1500);
      } else {
        toast.info("Генерация Excel отчета...");
        
        const csvBlob = generateExcelFile(type);
        const filename = `${type.replace(/\s+/g, '_')}_${timestamp}.csv`;
        
        downloadFile(csvBlob, filename);
        
        setTimeout(() => {
          toast.success(`Excel файл "${type}" загружен в папку Загрузки!`);
        }, 500);
      }
    } catch (error) {
      toast.error(`Ошибка при экспорте: ${(error as Error).message}`);
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
    { id: "overview", label: "Обзор", icon: BarChart3 },
    { id: "applicants", label: "Абитуриенты", icon: GraduationCap },
    { id: "testing", label: "Тестирование", icon: TestTube },
    { id: "export", label: "Экспорт", icon: Download },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Заголовок */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <FileText className="h-8 w-8 text-pink-500" />
              <h1 className="text-3xl font-bold text-gray-900">
                Отчеты и аналитика
              </h1>
            </div>
            <p className="text-gray-600">
              Детальные отчеты и статистика системы тестирования
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => handleExportReport("Общий отчет")}
              className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
            >
              <Download className="h-4 w-4" />
              Экспорт отчета
            </button>
          </div>
        </div>
      </div>

      {/* Навигация по вкладкам */}
      <div className="mb-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? "border-pink-500 text-pink-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                    {overallStats.totalUsers}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow border">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <GraduationCap className="h-8 w-8 text-green-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Активных абитуриентов
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {overallStats.activeApplicants}
                  </p>
                  <p className="text-xs text-gray-500">
                    из {overallStats.totalApplicants} всего
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow border">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TestTube className="h-8 w-8 text-indigo-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Опубликованных тестов
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {overallStats.publishedTests}
                  </p>
                  <p className="text-xs text-gray-500">
                    из {overallStats.totalTests} созданных
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
                  <p className="text-sm font-medium text-gray-600">
                    Институтов и направлений
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {overallStats.totalInstitutes}
                  </p>
                  <p className="text-xs text-gray-500">
                    {overallStats.totalDirections} направлений
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Статистика по институтам */}
          <div className="bg-white rounded-lg shadow border">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Building className="h-5 w-5 text-purple-500" />
                Статистика по институтам
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {instituteStats.map((institute) => (
                  <div
                    key={institute.instituteId}
                    className="bg-gray-50 rounded-lg p-4"
                  >
                    <h4 className="font-medium text-gray-900 mb-2">
                      {institute.instituteName}
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Направления:</span>
                        <span className="font-medium">
                          {institute.totalDirections}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Абитуриенты:</span>
                        <span className="font-medium">
                          {institute.totalApplicants}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Тесты:</span>
                        <span className="font-medium">
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
          <div className="bg-white rounded-lg shadow border p-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Поиск абитуриентов..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => handleExportReport("Отчет по абитуриентам")}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <FileText className="h-4 w-4" />
                  Экспорт PDF
                </button>
              </div>
            </div>
          </div>

          {/* Таблица абитуриентов */}
          <div className="bg-white rounded-lg shadow border">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-green-500" />
                Прогресс абитуриентов ({filteredApplicants.length})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Абитуриент
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Направление
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Профиль
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Тесты
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Лучший балл
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Последняя активность
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredApplicants.map((applicant) => (
                    <tr key={applicant.applicantId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {applicant.applicantName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {applicant.directionName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {applicant.instituteName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {applicant.profileComplete ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                            <CheckCircle className="h-3 w-3" />
                            Заполнен
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                            <AlertTriangle className="h-3 w-3" />
                            Не заполнен
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {applicant.testsCompleted} / {applicant.testsAvailable}
                        </div>
                        <div className="text-xs text-gray-500">завершено</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {applicant.bestScore > 0 ? `${applicant.bestScore}%` : "—"}
                        </div>
                        {applicant.averageScore > 0 && (
                          <div className="text-xs text-gray-500">
                            средний: {applicant.averageScore}%
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow border">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Target className="h-8 w-8 text-blue-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Всего вопросов
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {overallStats.totalQuestions}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow border">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Clock className="h-8 w-8 text-orange-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Среднее время теста
                  </p>
                  <p className="text-2xl font-bold text-gray-900">—</p>
                  <p className="text-xs text-gray-500">будет рассчитано</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow border">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Award className="h-8 w-8 text-yellow-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Средний балл
                  </p>
                  <p className="text-2xl font-bold text-gray-900">—</p>
                  <p className="text-xs text-gray-500">будет рассчитан</p>
                </div>
              </div>
            </div>
          </div>

          {/* Статистика по тестам */}
          <div className="bg-white rounded-lg shadow border">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <TestTube className="h-5 w-5 text-indigo-500" />
                Статистика по тестам
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Тест
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Направление
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Куратор
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Вопросы
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Макс. балл
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Статус
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tests.map((test) => {
                    const direction = directions.find((d) => d.$id === test.directionId);
                    const curator = curators.find((c) => c.$id === test.curatorId);

                    return (
                      <tr key={test.$id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {test.title}
                          </div>
                          {test.description && (
                            <div className="text-xs text-gray-500 line-clamp-2">
                              {test.description}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {direction?.name || "Не найдено"}
                          </div>
                          <div className="text-xs text-gray-500">
                            {direction?.code}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {curator?.name || "Не найден"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {test.totalQuestions}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {test.maxScore}
                          </div>
                          <div className="text-xs text-gray-500">
                            проходной: {test.passingScore}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {test.isPublished ? (
                            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Опубликован
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                              <Clock className="h-3 w-3 mr-1" />
                              Черновик
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
          <div className="bg-white rounded-lg shadow border">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-500" />
                Активность кураторов
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {curatorStats.map((curator) => (
                  <div
                    key={curator.curatorId}
                    className="bg-gray-50 rounded-lg p-4"
                  >
                    <h4 className="font-medium text-gray-900 mb-2">
                      {curator.curatorName}
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Всего тестов:</span>
                        <span className="font-medium">{curator.totalTests}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Опубликовано:</span>
                        <span className="font-medium text-green-600">
                          {curator.publishedTests}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Вопросов:</span>
                        <span className="font-medium">
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
          <div className="bg-white rounded-lg shadow border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Download className="h-5 w-5 text-pink-500" />
              Настройки экспорта
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Формат экспорта
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="exportFormat"
                      value="PDF"
                      checked={exportFormat === "PDF"}
                      onChange={(e) => setExportFormat(e.target.value as "PDF")}
                      className="mr-2"
                    />
                    <FileText className="h-4 w-4 text-red-500 mr-2" />
                    PDF документ
                  </label>
                 
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Период отчета
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
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
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
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Доступные отчеты */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: "Общий отчет",
                description: "Полная статистика системы",
                icon: BarChart3,
                color: "bg-blue-500",
              },
              {
                title: "Отчет по абитуриентам",
                description: "Прогресс и результаты абитуриентов",
                icon: GraduationCap,
                color: "bg-green-500",
              },
              {
                title: "Статистика тестирования",
                description: "Анализ результатов тестов",
                icon: TestTube,
                color: "bg-indigo-500",
              },
              {
                title: "Отчет по институтам",
                description: "Статистика по институтам",
                icon: Building,
                color: "bg-purple-500",
              },
              {
                title: "Активность кураторов",
                description: "Статистика работы кураторов",
                icon: Users,
                color: "bg-orange-500",
              },
              {
                title: "Анализ времени",
                description: "Время прохождения тестов",
                icon: Clock,
                color: "bg-yellow-500",
              },
            ].map((report) => (
              <div
                key={report.title}
                className="bg-white rounded-lg shadow border p-6"
              >
                <div className="flex items-center mb-4">
                  <div
                    className={`${report.color} p-3 rounded-lg text-white mr-4`}
                  >
                    <report.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {report.title}
                    </h4>
                    <p className="text-sm text-gray-500">{report.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleExportReport(report.title)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  Экспортировать
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Информационная панель */}
      <div className="mt-8 bg-pink-50 border border-pink-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <TrendingUp className="h-5 w-5 text-pink-600 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-pink-900 mb-2">
              Возможности отчетов
            </h3>
            <ul className="text-sm text-pink-800 space-y-1">
              <li>• Подробная аналитика по всем аспектам системы тестирования</li>
              <li>• Экспорт данных в формате PDF</li>
              <li>• Фильтрация отчетов по датам, институтам и направлениям</li>
              <li>• Мониторинг прогресса абитуриентов и активности кураторов</li>
              <li>• Статистика результатов тестирования и анализ времени</li>
              <li>• Автоматическое обновление данных в режиме реального времени</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}