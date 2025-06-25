// src/types/testing.ts

export enum UserRole {
  ADMIN = "ADMIN",
  CURATOR = "CURATOR",
  APPLICANT = "APPLICANT",
}

export const UserRoleLabels: Record<UserRole, string> = {
  [UserRole.ADMIN]: "Администратор",
  [UserRole.CURATOR]: "Куратор",
  [UserRole.APPLICANT]: "Абитуриент",
};

export const UserRoleColors: Record<UserRole, string> = {
  [UserRole.ADMIN]: "bg-red-100 text-red-800",
  [UserRole.CURATOR]: "bg-blue-100 text-blue-800",
  [UserRole.APPLICANT]: "bg-green-100 text-green-800",
};

export const getRoleLabel = (role: UserRole): string => {
  return UserRoleLabels[role] || role;
};

export const getRoleColor = (role: UserRole): string => {
  return UserRoleColors[role] || "bg-gray-100 text-gray-800";
};

export interface BaseDocument {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  $permissions: string[];
  $databaseId: string;
  $collectionId: string;
}

export type TestGrade =
  | "неудовлетворительно"
  | "удовлетворительно"
  | "хорошо"
  | "отлично";
export type QuestionOption = "A" | "B" | "C" | "D";
export type SessionStatus =
  | "IN_PROGRESS"
  | "COMPLETED"
  | "ABANDONED"
  | "TIME_UP";

export interface User extends BaseDocument {
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  isBlocked: boolean;
  createdBy?: string;
}

export interface Institute extends BaseDocument {
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
  createdBy: string;
}

export interface Direction extends BaseDocument {
  name: string;
  code: string;
  instituteId: string;
  description?: string;
  isActive: boolean;
  createdBy: string;
}

export interface Test extends BaseDocument {
  title: string;
  description?: string;
  directionId: string;
  curatorId: string;
  timeLimit?: number; // в минутах
  totalQuestions: number;
  maxScore: number;
  passingScore: number;
  isActive: boolean;
  isPublished: boolean;
  updatedAt?: string;
}

export interface Question extends BaseDocument {
  testId: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: QuestionOption;
  points: number;
  order: number;
}

export interface TestSession extends BaseDocument {
  applicantId: string;
  testId: string;
  status: SessionStatus;
  startedAt: string;
  completedAt?: string;
  timeSpent?: number; // в секундах
  currentQuestionIndex: number;
  answers?: string; // JSON строка с ответами
  score?: number;
  correctAnswers: number;
  totalQuestions: number;
  grade?: TestGrade;
}

export interface TestResult extends BaseDocument {
  sessionId: string;
  applicantId: string;
  testId: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  timeSpent: number; // в секундах
  grade: TestGrade;
  isPassed: boolean;
  completedAt: string;
  detailedAnswers?: string; // JSON с детальными ответами
}

export interface ApplicantProfile extends BaseDocument {
  userId: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  birthDate: string;
  passportNumber: string;
  passportIssueDate: string;
  passportIssuedBy: string;
  citizenship: string;
  phone: string;
  directionId: string;
  isProfileComplete: boolean;
  updatedAt?: string;
}

export interface CuratorAssignment extends BaseDocument {
  curatorId: string;
  instituteId: string;
  assignedBy: string;
}

// DTO (Data Transfer Objects)

export interface CreateInstituteDto {
  name: string;
  code: string;
  description?: string;
}

export interface UpdateInstituteDto {
  name?: string;
  code?: string;
  description?: string;
  isActive?: boolean;
}

export interface CreateDirectionDto {
  name: string;
  code: string;
  instituteId: string;
  description?: string;
}

export interface UpdateDirectionDto {
  name?: string;
  code?: string;
  description?: string;
  isActive?: boolean;
}

export interface CreateTestDto {
  title: string;
  description?: string;
  directionId: string;
  timeLimit?: number;
  passingScore?: number;
}

export interface UpdateTestDto {
  title?: string;
  description?: string;
  timeLimit?: number;
  passingScore?: number;
  isActive?: boolean;
  isPublished?: boolean;
}

export interface CreateQuestionDto {
  testId: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: QuestionOption;
  points?: number;
}

export interface UpdateQuestionDto {
  questionText?: string;
  optionA?: string;
  optionB?: string;
  optionC?: string;
  optionD?: string;
  correctAnswer?: QuestionOption;
  points?: number;
}

export interface UpdateApplicantProfileDto {
  firstName: string;
  lastName: string;
  middleName?: string;
  birthDate: string;
  passportNumber: string;
  passportIssueDate: string;
  passportIssuedBy: string;
  citizenship: string;
  phone: string;
  directionId: string;
}

export interface TestAnswerDto {
  questionId: string;
  selectedOption: QuestionOption;
  isSkipped?: boolean;
}

export interface StartTestSessionDto {
  testId: string;
}

export interface SubmitTestAnswerDto {
  sessionId: string;
  answers: TestAnswerDto[];
}

export interface AssignCuratorDto {
  curatorId: string;
  instituteId: string;
}

// Расширенные интерфейсы с связанными данными

export interface TestWithDetails extends Test {
  direction?: Direction;
  curator?: User;
  institute?: Institute;
  questionsCount?: number;
}

export interface ApplicantWithProfile extends User {
  profile?: ApplicantProfile;
  direction?: Direction;
  institute?: Institute;
}

export interface TestSessionWithDetails extends TestSession {
  test?: TestWithDetails;
  applicant?: User;
  result?: TestResult;
}

export interface TestResultWithDetails extends TestResult {
  test?: TestWithDetails;
  applicant?: ApplicantWithProfile;
  session?: TestSession;
}

export interface DirectionWithInstitute extends Direction {
  institute?: Institute;
}

export interface CuratorWithAssignments extends User {
  assignments?: CuratorAssignment[];
  institutes?: Institute[];
}

// Интерфейсы для статистики и отчетов

export interface TestStatistics {
  testId: string;
  testTitle: string;
  totalAttempts: number;
  completedAttempts: number;
  averageScore: number;
  averageTime: number; // в минутах
  passRate: number; // процент прошедших
  gradeDistribution: {
    excellent: number;
    good: number;
    satisfactory: number;
    unsatisfactory: number;
  };
}

export interface DirectionStatistics {
  directionId: string;
  directionName: string;
  instituteId: string;
  instituteName: string;
  totalApplicants: number;
  activeApplicants: number;
  completedTests: number;
  averageScore: number;
  passRate: number;
}

export interface InstituteStatistics {
  instituteId: string;
  instituteName: string;
  totalDirections: number;
  totalApplicants: number;
  totalTests: number;
  completedTests: number;
  averageScore: number;
  passRate: number;
}

export interface QuestionAnalysis {
  questionId: string;
  questionText: string;
  correctAnswers: number;
  totalAnswers: number;
  correctRate: number;
  optionDistribution: {
    A: number;
    B: number;
    C: number;
    D: number;
  };
}

export interface CuratorStatistics {
  curatorId: string;
  curatorName: string;
  totalTests: number;
  publishedTests: number;
  totalQuestions: number;
  totalAttempts: number;
  averageScore: number;
  institutes: string[];
}

export interface ApplicantProgress {
  applicantId: string;
  applicantName: string;
  directionName: string;
  instituteName: string;
  profileComplete: boolean;
  testsAvailable: number;
  testsCompleted: number;
  averageScore: number;
  bestScore: number;
  lastActivity?: string;
}

export interface TimeSpentAnalysis {
  averageTimePerQuestion: number; // в секундах
  fastestCompletion: number;
  slowestCompletion: number;
  medianTime: number;
  timeDistribution: {
    under30min: number;
    between30and60: number;
    between60and90: number;
    over90min: number;
  };
}

export interface ReportFilters {
  startDate?: string;
  endDate?: string;
  instituteIds?: string[];
  directionIds?: string[];
  curatorIds?: string[];
  testIds?: string[];
  grade?: TestGrade;
  minScore?: number;
  maxScore?: number;
}

export interface ExportOptions {
  format: "PDF" | "EXCEL" | "WORD";
  includeCharts: boolean;
  includeDetails: boolean;
  groupBy?: "institute" | "direction" | "curator" | "test";
}

// Константы для оценок
export const GRADE_SCALE = {
  EXCELLENT: { min: 87, max: 100, label: "отлично" },
  GOOD: { min: 74, max: 86, label: "хорошо" },
  SATISFACTORY: { min: 61, max: 73, label: "удовлетворительно" },
  UNSATISFACTORY: { min: 0, max: 60, label: "неудовлетворительно" },
} as const;

export const getTestGrade = (score: number): TestGrade => {
  if (score >= GRADE_SCALE.EXCELLENT.min) return GRADE_SCALE.EXCELLENT.label;
  if (score >= GRADE_SCALE.GOOD.min) return GRADE_SCALE.GOOD.label;
  if (score >= GRADE_SCALE.SATISFACTORY.min)
    return GRADE_SCALE.SATISFACTORY.label;
  return GRADE_SCALE.UNSATISFACTORY.label;
};

export const getGradeColor = (grade: TestGrade | string) => {
  switch (grade) {
    case "отлично":
      return "text-green-600 bg-green-50 border-green-200";
    case "хорошо":
      return "text-blue-600 bg-blue-50 border-blue-200";
    case "удовлетворительно":
      return "text-yellow-600 bg-yellow-50 border-yellow-200";
    case "неудовлетворительно":
      return "text-red-600 bg-red-50 border-red-200";
    default:
      return "text-gray-600 bg-gray-50 border-gray-200";
  }
};

export const getScoreColor = (score: number) => {
  if (score >= 87) return "text-green-600 bg-green-50";
  if (score >= 74) return "text-blue-600 bg-blue-50";
  if (score >= 61) return "text-yellow-600 bg-yellow-50";
  return "text-red-600 bg-red-50";
};

// Утилиты для работы с временем
export const formatTimeSpent = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${hours}ч ${minutes}м ${remainingSeconds}с`;
  } else if (minutes > 0) {
    return `${minutes}м ${remainingSeconds}с`;
  } else {
    return `${remainingSeconds}с`;
  }
};

export const formatTimeRemaining = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes > 0) {
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  } else {
    return `0:${remainingSeconds.toString().padStart(2, "0")}`;
  }
};

// Валидация данных
export const validatePassportNumber = (passport: string): boolean => {
  // Проверка формата российского паспорта: 4 цифры пробел 6 цифр
  const passportRegex = /^\d{4}\s\d{6}$/;
  return passportRegex.test(passport);
};

export const validatePhoneNumber = (phone: string): boolean => {
  // Проверка российского номера телефона
  const phoneRegex =
    /^(\+7|8)?[\s\-]?\(?[489][0-9]{2}\)?[\s\-]?[0-9]{3}[\s\-]?[0-9]{2}[\s\-]?[0-9]{2}$/;
  return phoneRegex.test(phone);
};

// Интерфейсы для импорта/экспорта тестов
export interface TestImportData {
  title: string;
  description?: string;
  timeLimit?: number;
  passingScore?: number;
  questions: QuestionImportData[];
}

export interface QuestionImportData {
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: QuestionOption;
  points?: number;
}

export interface ImportResult {
  success: boolean;
  testId?: string;
  questionsImported: number;
  errors: string[];
  warnings: string[];
}

// Настройки системы
export interface SystemSettings {
  maxTestDuration: number; // максимальная длительность теста в минутах
  defaultPassingScore: number;
  allowTestRetake: boolean;
  showResultsImmediately: boolean;
  requireProfileCompletion: boolean;
  autoActivateApplicants: boolean;
}

// Уведомления
export interface Notification {
  id: string;
  userId: string;
  type: "info" | "warning" | "error" | "success";
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
}

// Аудит и логи
export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface RecentAction {
  type: string; // Тип действия
  title: string; // Заголовок действия
  description: string; // Описание действия
  time: string; // Время выполнения
  icon: React.ComponentType<{ className?: string }>; // Компонент иконки
  color: string; // CSS классы для цвета
}

