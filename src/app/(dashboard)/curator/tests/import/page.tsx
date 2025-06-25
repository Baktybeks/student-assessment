// src/app/(dashboard)/curator/tests/import/page.tsx
"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useImportTest } from "@/services/testService";
import { instituteApi } from "@/services/instituteService";
import { useQuery } from "@tanstack/react-query";
import { TestImportData, QuestionImportData, QuestionOption } from "@/types";
import { toast } from "react-toastify";
import {
  Upload,
  FileText,
  AlertTriangle,
  CheckCircle,
  Download,
  Eye,
  ArrowLeft,
  FileSpreadsheet,
  FileImage,
  Loader2,
  X,
  Play,
  AlertCircle,
  Info,
  BookOpen,
  Target,
  Clock,
} from "lucide-react";

type ImportStep = "upload" | "preview" | "import" | "result";
type FileFormat = "csv" | "excel" | "json" | "pdf";

interface ParsedData {
  testData: TestImportData;
  errors: string[];
  warnings: string[];
}

interface ImportStats {
  totalQuestions: number;
  totalPoints: number;
  avgPointsPerQuestion: number;
  hasTimeLimit: boolean;
  hasPassingScore: boolean;
}

export default function TestImportPage() {
  const router = useRouter();
  const { user } = useAuth();
  const importMutation = useImportTest();

  // Получаем направления для выбора
  const { data: directions = [] } = useQuery({
    queryKey: ["directions"],
    queryFn: instituteApi.getAllDirections,
  });

  // Состояние
  const [currentStep, setCurrentStep] = useState<ImportStep>("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileFormat, setFileFormat] = useState<FileFormat | null>(null);
  const [directionId, setDirectionId] = useState<string>("");
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);

  // Поддерживаемые форматы файлов
  const supportedFormats = {
    csv: {
      extensions: [".csv"],
      mimeTypes: ["text/csv"],
      icon: FileSpreadsheet,
      description: "CSV файл с вопросами и ответами",
    },
    excel: {
      extensions: [".xlsx", ".xls"],
      mimeTypes: [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
      ],
      icon: FileSpreadsheet,
      description: "Excel таблица с тестом",
    },
    json: {
      extensions: [".json"],
      mimeTypes: ["application/json"],
      icon: FileText,
      description: "JSON файл с структурированными данными",
    },
    pdf: {
      extensions: [".pdf"],
      mimeTypes: ["application/pdf"],
      icon: FileImage,
      description: "PDF документ с тестом",
    },
  };

  // Определение формата файла
  const detectFileFormat = (file: File): FileFormat | null => {
    const extension = file.name.toLowerCase().substring(file.name.lastIndexOf("."));
    
    for (const [format, config] of Object.entries(supportedFormats)) {
      if (config.extensions.includes(extension) || config.mimeTypes.includes(file.type)) {
        return format as FileFormat;
      }
    }
    return null;
  };

  // Парсинг CSV
  const parseCSV = async (file: File): Promise<ParsedData> => {
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      throw new Error("CSV файл должен содержать заголовки и данные");
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/['"]/g, ''));
    const errors: string[] = [];
    const warnings: string[] = [];
    const questions: QuestionImportData[] = [];

    // Ожидаемые заголовки
    const requiredHeaders = ['questionText', 'optionA', 'optionB', 'optionC', 'optionD', 'correctAnswer'];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    
    if (missingHeaders.length > 0) {
      throw new Error(`Отсутствуют обязательные колонки: ${missingHeaders.join(', ')}`);
    }

    // Парсим данные
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/['"]/g, ''));
      
      if (values.length !== headers.length) {
        errors.push(`Строка ${i + 1}: неверное количество колонок`);
        continue;
      }

      const questionData: any = {};
      headers.forEach((header, index) => {
        questionData[header] = values[index];
      });

      // Валидация
      if (!questionData.questionText?.trim()) {
        errors.push(`Строка ${i + 1}: пустой текст вопроса`);
        continue;
      }

      if (!['A', 'B', 'C', 'D'].includes(questionData.correctAnswer)) {
        errors.push(`Строка ${i + 1}: неверный правильный ответ (должен быть A, B, C или D)`);
        continue;
      }

      questions.push({
        questionText: questionData.questionText,
        optionA: questionData.optionA || '',
        optionB: questionData.optionB || '',
        optionC: questionData.optionC || '',
        optionD: questionData.optionD || '',
        correctAnswer: questionData.correctAnswer as QuestionOption,
        points: parseInt(questionData.points) || 1,
      });
    }

    const testData: TestImportData = {
      title: `Импортированный тест ${new Date().toLocaleDateString()}`,
      description: `Тест импортирован из файла ${file.name}`,
      questions,
    };

    return { testData, errors, warnings };
  };

  // Парсинг Excel
  const parseExcel = async (file: File): Promise<ParsedData> => {
    // Используем FileReader для чтения как ArrayBuffer
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          // Здесь бы использовался SheetJS для парсинга Excel
          // Для примера возвращаем базовую структуру
          const testData: TestImportData = {
            title: `Тест из ${file.name}`,
            description: `Импортировано из Excel файла`,
            questions: [
              {
                questionText: "Пример вопроса из Excel",
                optionA: "Вариант А",
                optionB: "Вариант Б", 
                optionC: "Вариант В",
                optionD: "Вариант Г",
                correctAnswer: "A" as QuestionOption,
                points: 1,
              }
            ],
          };

          resolve({
            testData,
            errors: [],
            warnings: ["Excel парсер в разработке - показан пример данных"],
          });
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error("Ошибка чтения файла"));
      reader.readAsArrayBuffer(file);
    });
  };

  // Парсинг JSON
  const parseJSON = async (file: File): Promise<ParsedData> => {
    const text = await file.text();
    
    try {
      const data = JSON.parse(text);
      const errors: string[] = [];
      const warnings: string[] = [];

      // Валидация структуры
      if (!data.title) {
        warnings.push("Заголовок теста не указан, будет использован по умолчанию");
      }

      if (!Array.isArray(data.questions)) {
        throw new Error("Поле 'questions' должно быть массивом");
      }

      // Валидация вопросов
      data.questions.forEach((q: any, index: number) => {
        if (!q.questionText) {
          errors.push(`Вопрос ${index + 1}: отсутствует текст вопроса`);
        }
        if (!['A', 'B', 'C', 'D'].includes(q.correctAnswer)) {
          errors.push(`Вопрос ${index + 1}: неверный правильный ответ`);
        }
      });

      const testData: TestImportData = {
        title: data.title || `Импортированный тест ${new Date().toLocaleDateString()}`,
        description: data.description,
        timeLimit: data.timeLimit,
        passingScore: data.passingScore,
        questions: data.questions,
      };

      return { testData, errors, warnings };
    } catch (error) {
      throw new Error(`Ошибка парсинга JSON: ${(error as Error).message}`);
    }
  };

  // Парсинг PDF (базовая реализация)
  const parsePDF = async (file: File): Promise<ParsedData> => {
    // Здесь бы использовался PDF.js или другой парсер
    // Для примера возвращаем заглушку
    const warnings = ["PDF парсер в разработке - требуется дополнительная настройка"];
    
    const testData: TestImportData = {
      title: `Тест из ${file.name}`,
      description: `Импортировано из PDF файла`,
      questions: [],
    };

    return {
      testData,
      errors: ["PDF парсинг пока не реализован"],
      warnings,
    };
  };

  // Основная функция парсинга
  const parseFile = async (file: File, format: FileFormat): Promise<ParsedData> => {
    switch (format) {
      case "csv":
        return parseCSV(file);
      case "excel":
        return parseExcel(file);
      case "json":
        return parseJSON(file);
      case "pdf":
        return parsePDF(file);
      default:
        throw new Error("Неподдерживаемый формат файла");
    }
  };

  // Обработка выбора файла
  const handleFileSelect = useCallback((file: File) => {
    const format = detectFileFormat(file);
    
    if (!format) {
      toast.error("Неподдерживаемый формат файла");
      return;
    }

    setSelectedFile(file);
    setFileFormat(format);
    toast.success(`Файл выбран: ${file.name}`);
  }, []);

  // Drag & Drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    
    if (files.length > 1) {
      toast.error("Выберите только один файл");
      return;
    }

    if (files[0]) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  // Обработка загрузки через input
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Переход к превью
  const handleProcessFile = async () => {
    if (!selectedFile || !fileFormat || !directionId) {
      toast.error("Выберите файл и направление");
      return;
    }

    setIsProcessing(true);
    
    try {
      const parsed = await parseFile(selectedFile, fileFormat);
      setParsedData(parsed);
      
      if (parsed.errors.length > 0) {
        toast.warning(`Обнаружены ошибки: ${parsed.errors.length}`);
      } else {
        toast.success("Файл успешно обработан");
      }
      
      setCurrentStep("preview");
    } catch (error) {
      toast.error(`Ошибка обработки файла: ${(error as Error).message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Выполнение импорта
  const handleImport = async () => {
    if (!parsedData || !directionId || !user) {
      return;
    }

    try {
      const result = await importMutation.mutateAsync({
        importData: parsedData.testData,
        directionId,
        curatorId: user.$id,
      });

      setImportResult(result);
      setCurrentStep("result");
      
      if (result.success) {
        toast.success(`Тест успешно импортирован! Вопросов: ${result.questionsImported}`);
      } else {
        toast.error("Импорт завершился с ошибками");
      }
    } catch (error) {
      toast.error(`Ошибка импорта: ${(error as Error).message}`);
    }
  };

  // Сброс состояния
  const resetImport = () => {
    setSelectedFile(null);
    setFileFormat(null);
    setDirectionId("");
    setParsedData(null);
    setImportResult(null);
    setCurrentStep("upload");
  };

  // Вычисляем статистику для превью
  const getImportStats = (data: TestImportData): ImportStats => {
    const totalQuestions = data.questions.length;
    const totalPoints = data.questions.reduce((sum, q) => sum + (q.points || 1), 0);
    
    return {
      totalQuestions,
      totalPoints,
      avgPointsPerQuestion: totalQuestions > 0 ? totalPoints / totalQuestions : 0,
      hasTimeLimit: !!data.timeLimit,
      hasPassingScore: !!data.passingScore,
    };
  };

  if (!user) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Ошибка доступа</h2>
          <p className="text-gray-600">Пользователь не авторизован</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Заголовок */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => router.push("/curator/tests")}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Upload className="h-8 w-8 text-blue-500" />
              <h1 className="text-3xl font-bold text-gray-900">Импорт теста</h1>
            </div>
            <p className="text-gray-600">
              Загрузите файл с тестом для автоматического импорта вопросов
            </p>
          </div>
        </div>

        {/* Прогресс */}
        <div className="flex items-center gap-4 mb-6">
          {[
            { key: "upload", label: "Загрузка", icon: Upload },
            { key: "preview", label: "Превью", icon: Eye },
            { key: "import", label: "Импорт", icon: Play },
            { key: "result", label: "Результат", icon: CheckCircle },
          ].map((step, index) => {
            const isActive = currentStep === step.key;
            const isCompleted = ["upload", "preview", "import", "result"].indexOf(currentStep) > index;
            const StepIcon = step.icon;

            return (
              <React.Fragment key={step.key}>
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                  isActive ? "bg-blue-100 text-blue-700" : 
                  isCompleted ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                }`}>
                  <StepIcon className="h-4 w-4" />
                  <span className="text-sm font-medium">{step.label}</span>
                </div>
                {index < 3 && (
                  <div className={`h-0.5 w-8 ${
                    isCompleted ? "bg-green-300" : "bg-gray-300"
                  }`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Шаг 1: Загрузка файла */}
      {currentStep === "upload" && (
        <div className="space-y-6">
          {/* Поддерживаемые форматы */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">
              Поддерживаемые форматы файлов
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(supportedFormats).map(([format, config]) => {
                const Icon = config.icon;
                return (
                  <div key={format} className="bg-white p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-3 mb-2">
                      <Icon className="h-6 w-6 text-blue-600" />
                      <span className="font-medium text-blue-900 uppercase">
                        {format}
                      </span>
                    </div>
                    <p className="text-sm text-blue-700">{config.description}</p>
                    <p className="text-xs text-blue-600 mt-1">
                      {config.extensions.join(", ")}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Выбор направления */}
          <div className="bg-white rounded-lg shadow border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Выберите направление
            </h3>
            <select
              value={directionId}
              onChange={(e) => setDirectionId(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Выберите направление...</option>
              {directions.map((direction) => (
                <option key={direction.$id} value={direction.$id}>
                  {direction.name} ({direction.institute?.name})
                </option>
              ))}
            </select>
          </div>

          {/* Загрузка файла */}
          <div className="bg-white rounded-lg shadow border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Загрузите файл с тестом
            </h3>
            
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors"
            >
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                Перетащите файл сюда или выберите
              </p>
              <p className="text-gray-600 mb-4">
                CSV, Excel, JSON или PDF файл с тестом
              </p>
              
              <input
                type="file"
                onChange={handleFileInput}
                accept=".csv,.xlsx,.xls,.json,.pdf"
                className="hidden"
                id="file-input"
              />
              <label
                htmlFor="file-input"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
              >
                <Upload className="h-4 w-4" />
                Выбрать файл
              </label>
            </div>

            {selectedFile && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-6 w-6 text-gray-600" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{selectedFile.name}</p>
                    <p className="text-sm text-gray-600">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • {fileFormat?.toUpperCase()}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setFileFormat(null);
                    }}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Кнопка продолжить */}
          <div className="flex justify-end">
            <button
              onClick={handleProcessFile}
              disabled={!selectedFile || !directionId || isProcessing}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
              {isProcessing ? "Обработка..." : "Обработать файл"}
            </button>
          </div>
        </div>
      )}

      {/* Шаг 2: Превью данных */}
      {currentStep === "preview" && parsedData && (
        <div className="space-y-6">
          {/* Общая информация о тесте */}
          <div className="bg-white rounded-lg shadow border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Информация о тесте
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Название теста
                </label>
                <input
                  type="text"
                  value={parsedData.testData.title}
                  onChange={(e) => setParsedData({
                    ...parsedData,
                    testData: { ...parsedData.testData, title: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Описание
                </label>
                <textarea
                  value={parsedData.testData.description || ""}
                  onChange={(e) => setParsedData({
                    ...parsedData,
                    testData: { ...parsedData.testData, description: e.target.value }
                  })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Время на прохождение (минуты)
                </label>
                <input
                  type="number"
                  value={parsedData.testData.timeLimit || ""}
                  onChange={(e) => setParsedData({
                    ...parsedData,
                    testData: { ...parsedData.testData, timeLimit: parseInt(e.target.value) || undefined }
                  })}
                  placeholder="Не ограничено"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Проходной балл (%)
                </label>
                <input
                  type="number"
                  value={parsedData.testData.passingScore || ""}
                  onChange={(e) => setParsedData({
                    ...parsedData,
                    testData: { ...parsedData.testData, passingScore: parseInt(e.target.value) || undefined }
                  })}
                  placeholder="60"
                  min="0"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Статистика */}
          {(() => {
            const stats = getImportStats(parsedData.testData);
            return (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg shadow border">
                  <div className="flex items-center">
                    <BookOpen className="h-8 w-8 text-blue-500 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Вопросов</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.totalQuestions}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow border">
                  <div className="flex items-center">
                    <Target className="h-8 w-8 text-green-500 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Всего баллов</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.totalPoints}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow border">
                  <div className="flex items-center">
                    <Clock className="h-8 w-8 text-orange-500 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Время</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stats.hasTimeLimit ? `${parsedData.testData.timeLimit}м` : "∞"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow border">
                  <div className="flex items-center">
                    <CheckCircle className="h-8 w-8 text-purple-500 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Проходной</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stats.hasPassingScore ? `${parsedData.testData.passingScore}%` : "60%"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Ошибки и предупреждения */}
          {(parsedData.errors.length > 0 || parsedData.warnings.length > 0) && (
            <div className="space-y-4">
              {parsedData.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <h4 className="text-sm font-medium text-red-800">
                      Ошибки ({parsedData.errors.length})
                    </h4>
                  </div>
                  <ul className="text-sm text-red-700 space-y-1">
                    {parsedData.errors.slice(0, 5).map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                    {parsedData.errors.length > 5 && (
                      <li className="font-medium">...и еще {parsedData.errors.length - 5}</li>
                    )}
                  </ul>
                </div>
              )}

              {parsedData.warnings.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="h-5 w-5 text-yellow-600" />
                    <h4 className="text-sm font-medium text-yellow-800">
                      Предупреждения ({parsedData.warnings.length})
                    </h4>
                  </div>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    {parsedData.warnings.map((warning, index) => (
                      <li key={index}>• {warning}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Превью вопросов */}
          <div className="bg-white rounded-lg shadow border">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Превью вопросов ({parsedData.testData.questions.length})
              </h3>
            </div>

            <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
              {parsedData.testData.questions.slice(0, 10).map((question, index) => (
                <div key={index} className="p-4">
                  <div className="flex items-start gap-3">
                    <span className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 text-sm font-medium rounded-full">
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 mb-2">
                        {question.questionText}
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {[
                          { key: "A", value: question.optionA },
                          { key: "B", value: question.optionB },
                          { key: "C", value: question.optionC },
                          { key: "D", value: question.optionD },
                        ].map((option) => (
                          <div
                            key={option.key}
                            className={`p-2 rounded ${
                              option.key === question.correctAnswer
                                ? "bg-green-100 text-green-800 font-medium"
                                : "bg-gray-50 text-gray-700"
                            }`}
                          >
                            <span className="font-medium">{option.key}:</span> {option.value}
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        Баллов: {question.points || 1} • Правильный ответ: {question.correctAnswer}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {parsedData.testData.questions.length > 10 && (
                <div className="p-4 text-center text-gray-500">
                  ...и еще {parsedData.testData.questions.length - 10} вопросов
                </div>
              )}
            </div>
          </div>

          {/* Кнопки управления */}
          <div className="flex justify-between">
            <button
              onClick={() => setCurrentStep("upload")}
              className="flex items-center gap-2 px-6 py-3 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Назад
            </button>

            <button
              onClick={handleImport}
              disabled={parsedData.errors.length > 0 || importMutation.isPending}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {importMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              {importMutation.isPending ? "Импорт..." : "Импортировать тест"}
            </button>
          </div>
        </div>
      )}

      {/* Шаг 3: Импорт (показывается автоматически) */}
      {currentStep === "import" && (
        <div className="text-center py-12">
          <Loader2 className="h-16 w-16 text-blue-600 animate-spin mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Импорт теста...
          </h3>
          <p className="text-gray-600">
            Пожалуйста, подождите, идет сохранение вопросов
          </p>
        </div>
      )}

      {/* Шаг 4: Результат */}
      {currentStep === "result" && importResult && (
        <div className="space-y-6">
          <div className={`rounded-lg p-6 ${
            importResult.success ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
          }`}>
            <div className="flex items-center gap-3 mb-4">
              {importResult.success ? (
                <CheckCircle className="h-8 w-8 text-green-600" />
              ) : (
                <AlertTriangle className="h-8 w-8 text-red-600" />
              )}
              <div>
                <h3 className={`text-lg font-semibold ${
                  importResult.success ? "text-green-900" : "text-red-900"
                }`}>
                  {importResult.success ? "Импорт завершен успешно!" : "Импорт завершен с ошибками"}
                </h3>
                <p className={`text-sm ${
                  importResult.success ? "text-green-700" : "text-red-700"
                }`}>
                  Импортировано вопросов: {importResult.questionsImported}
                </p>
              </div>
            </div>

            {importResult.errors.length > 0 && (
              <div className="mb-4">
                <h4 className="font-medium text-red-800 mb-2">Ошибки:</h4>
                <ul className="text-sm text-red-700 space-y-1">
                  {importResult.errors.map((error: string, index: number) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}

            {importResult.warnings.length > 0 && (
              <div>
                <h4 className="font-medium text-yellow-800 mb-2">Предупреждения:</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  {importResult.warnings.map((warning: string, index: number) => (
                    <li key={index}>• {warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="flex justify-between">
            <button
              onClick={resetImport}
              className="flex items-center gap-2 px-6 py-3 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Upload className="h-4 w-4" />
              Импортировать еще
            </button>

            <div className="flex gap-3">
              <button
                onClick={() => router.push("/curator/tests")}
                className="flex items-center gap-2 px-6 py-3 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Все тесты
              </button>

              {importResult.success && importResult.testId && (
                <button
                  onClick={() => router.push(`/curator/tests/${importResult.testId}/edit`)}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Редактировать тест
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}