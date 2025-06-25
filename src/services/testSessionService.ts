// src/services/testSessionService.ts

import { Query, ID } from "appwrite";
import { databases } from "./appwriteClient";
import { appwriteConfig } from "@/constants/appwriteConfig";
import {
  TestSession,
//   TestAnswer,
  TestResult,
//   CreateTestSessionDto,
//   SubmitAnswerDto,
//   FinishTestSessionDto,
  TestSessionWithDetails,
} from "@/types";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { testApi } from "./testService";

export const testSessionApi = {
  // === ТЕСТОВЫЕ СЕССИИ ===

  createTestSession: async (
    data: any
  ): Promise<TestSession> => {
    try {
      // Проверяем, нет ли уже активной сессии для этого теста и пользователя
      const existingSessions = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.collections.testSessions,
        [
          Query.equal("testId", data.testId),
          Query.equal("applicantId", data.applicantId),
          Query.equal("status", "IN_PROGRESS"),
        ]
      );

      if (existingSessions.documents.length > 0) {
        throw new Error("У вас уже есть активная сессия этого теста");
      }

      // Получаем информацию о тесте
      const test = await testApi.getTestById(data.testId);
      if (!test) {
        throw new Error("Тест не найден");
      }

      // Создаем сессию
      const sessionData = {
        testId: data.testId,
        applicantId: data.applicantId,
        startedAt: new Date().toISOString(),
        timeLimit: test.timeLimit,
        status: "IN_PROGRESS",
        currentQuestionIndex: 0,
        totalQuestions: test.totalQuestions,
        answeredQuestions: 0,
        createdAt: new Date().toISOString(),
      };

      const response = await databases.createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.collections.testSessions,
        ID.unique(),
        sessionData
      );

      return response as unknown as TestSession;
    } catch (error) {
      console.error("Ошибка при создании тестовой сессии:", error);
      throw error;
    }
  },

  getActiveSession: async (
    testId: string,
    applicantId: string
  ): Promise<TestSession | null> => {
    try {
      const response = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.collections.testSessions,
        [
          Query.equal("testId", testId),
          Query.equal("applicantId", applicantId),
          Query.equal("status", "IN_PROGRESS"),
        ]
      );

      if (response.documents.length === 0) {
        return null;
      }

      return response.documents[0] as unknown as TestSession;
    } catch (error) {
      console.error("Ошибка при получении активной сессии:", error);
      return null;
    }
  },

  getSessionById: async (sessionId: string): Promise<TestSessionWithDetails | null> => {
    try {
      const response = await databases.getDocument(
        appwriteConfig.databaseId,
        appwriteConfig.collections.testSessions,
        sessionId
      );

      const session = response as unknown as TestSession;
      
      // Получаем детали теста
      const test = await testApi.getTestById(session.testId);
      
      // Получаем ответы пользователя
      const answers = await testSessionApi.getSessionAnswers(sessionId);

      return {
        ...session,
        // test,
        // answers,
      };
    } catch (error) {
      console.error("Ошибка при получении сессии:", error);
      return null;
    }
  },

  getSessionsByApplicant: async (applicantId: string): Promise<TestSession[]> => {
    try {
      const response = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.collections.testSessions,
        [
          Query.equal("applicantId", applicantId),
          Query.orderDesc("startedAt"),
        ]
      );

      return response.documents as unknown as TestSession[];
    } catch (error) {
      console.error("Ошибка при получении сессий абитуриента:", error);
      return [];
    }
  },

  // === ОТВЕТЫ НА ВОПРОСЫ ===

  submitAnswer: async (data: any): Promise<any> => {
    // try {
    //   // Проверяем, есть ли уже ответ на этот вопрос в этой сессии
    //   const existingAnswers = await databases.listDocuments(
    //     appwriteConfig.databaseId,
    //     appwriteConfig.collections?.testAnswers,
    //     [
    //       Query.equal("sessionId", data.sessionId),
    //       Query.equal("questionId", data.questionId),
    //     ]
    //   );

    //   let answer;

    //   if (existingAnswers.documents.length > 0) {
    //     // Обновляем существующий ответ
    //     answer = await databases.updateDocument(
    //       appwriteConfig.databaseId,
    //       appwriteConfig.collections.testAnswers,
    //       existingAnswers.documents[0].$id,
    //       {
    //         selectedOption: data.selectedOption,
    //         answeredAt: new Date().toISOString(),
    //       }
    //     );
    //   } else {
    //     // Создаем новый ответ
    //     const answerData = {
    //       sessionId: data.sessionId,
    //       questionId: data.questionId,
    //       selectedOption: data.selectedOption,
    //       answeredAt: new Date().toISOString(),
    //     };

    //     answer = await databases.createDocument(
    //       appwriteConfig.databaseId,
    //       appwriteConfig.collections.testAnswers,
    //       ID.unique(),
    //       answerData
    //     );

    //     // Увеличиваем счетчик отвеченных вопросов
    //     await testSessionApi.updateSessionProgress(data.sessionId);
    //   }

    //   return answer as unknown as TestAnswer;
    // } catch (error) {
    //   console.error("Ошибка при сохранении ответа:", error);
    //   throw error;
    // }
  },

  getSessionAnswers: async (sessionId: string) => {
    // try {
    //   const response = await databases.listDocuments(
    //     appwriteConfig.databaseId,
    //     // appwriteConfig.collections.testAnswers,
    //     // [Query.equal("sessionId", sessionId)]
    //   );

    //   return response.documents as unknown as any[];
    // } catch (error) {
    //   console.error("Ошибка при получении ответов сессии:", error);
    //   return [];
    // }
  },

  // === ЗАВЕРШЕНИЕ ТЕСТИРОВАНИЯ ===

  finishTestSession: async (
    sessionId: string,
    data: any
  ): Promise<TestResult> => {
    try {
      // Получаем сессию и ответы
      const session = await testSessionApi.getSessionById(sessionId);
      if (!session) {
        throw new Error("Сессия не найдена");
      }

      if (session.status !== "IN_PROGRESS") {
        throw new Error("Сессия уже завершена");
      }

      // Получаем все вопросы теста
      const questions = await testApi.getQuestionsByTest(session.testId);
      const answers = session.answers || [];

      // Подсчитываем результат
      let correctAnswers = 0;
      let totalScore = 0;
      let maxPossibleScore = 0;

      const detailedResults = questions.map((question) => {

        const userAnswer = answers;
        const isCorrect = userAnswer
        
        maxPossibleScore += question.points;
        
        if (isCorrect) {
          correctAnswers++;
          totalScore += question.points;
        }

        return {
          questionId: question.$id,
          userAnswer: userAnswer || null,
          correctAnswer: question.correctAnswer,
          isCorrect,
          points: isCorrect ? question.points : 0,
          maxPoints: question.points,
        };
      });

      const scorePercentage = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;
      const isPassed = scorePercentage >= (session.test?.passingScore || 60);

      // Обновляем статус сессии
      await databases.updateDocument(
        appwriteConfig.databaseId,
        appwriteConfig.collections.testSessions,
        sessionId,
        {
          status: "COMPLETED",
          finishedAt: new Date().toISOString(),
          finishReason: data.finishReason || "MANUAL",
        }
      );

      // Создаем результат
      const resultData = {
        sessionId,
        testId: session.testId,
        applicantId: session.applicantId,
        totalQuestions: questions.length,
        answeredQuestions: answers.length,
        correctAnswers,
        totalScore,
        maxPossibleScore,
        scorePercentage: Math.round(scorePercentage * 100) / 100,
        isPassed,
        timeSpent: data.timeSpent || 0,
        detailedResults: JSON.stringify(detailedResults),
        createdAt: new Date().toISOString(),
      };

      const result = await databases.createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.collections.testResults,
        ID.unique(),
        resultData
      );

      return result as unknown as TestResult;
    } catch (error) {
      console.error("Ошибка при завершении тестовой сессии:", error);
      throw error;
    }
  },

  // === ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ===

  updateSessionProgress: async (sessionId: string): Promise<void> => {
    try {
      const answers = await testSessionApi.getSessionAnswers(sessionId);
      
      await databases.updateDocument(
        appwriteConfig.databaseId,
        appwriteConfig.collections.testSessions,
        sessionId,
        {
          answeredQuestions: answers,
          updatedAt: new Date().toISOString(),
        }
      );
    } catch (error) {
      console.error("Ошибка при обновлении прогресса сессии:", error);
    }
  },

  checkTimeLimit: async (sessionId: string) => {
    // try {
    //   const session = await testSessionApi.getSessionById(sessionId);
    //   if (!session || !session.timeLimit) {
    //     return true; // Нет лимита времени
    //   }

    //   const startTime = new Date(session.startedAt).getTime();
    //   const currentTime = new Date().getTime();
    //   const elapsedMinutes = (currentTime - startTime) / (1000 * 60);

    //   return elapsedMinutes <= session.timeLimit;
    // } catch (error) {
    //   console.error("Ошибка при проверке лимита времени:", error);
    //   return false;
    // }
  },

  getTimeRemaining: async (sessionId: string) => {
    // try {
    //   const session = await testSessionApi.getSessionById(sessionId);
    //   if (!session || !session.timeLimit) {
    //     return null; // Нет лимита времени
    //   }

    //   const startTime = new Date(session.startedAt).getTime();
    //   const currentTime = new Date().getTime();
    //   const elapsedMinutes = (currentTime - startTime) / (1000 * 60);
    //   const remainingMinutes = session.timeLimit - elapsedMinutes;

    //   return Math.max(0, remainingMinutes);
    // } catch (error) {
    //   console.error("Ошибка при получении оставшегося времени:", error);
    //   return null;
    // }
  },

  // === РЕЗУЛЬТАТЫ ===

  getApplicantResults: async (applicantId: string): Promise<TestResult[]> => {
    try {
      const response = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.collections.testResults,
        [
          Query.equal("applicantId", applicantId),
          Query.orderDesc("createdAt"),
        ]
      );

      return response.documents as unknown as TestResult[];
    } catch (error) {
      console.error("Ошибка при получении результатов абитуриента:", error);
      return [];
    }
  },

  getTestResult: async (resultId: string): Promise<TestResult | null> => {
    try {
      const response = await databases.getDocument(
        appwriteConfig.databaseId,
        appwriteConfig.collections.testResults,
        resultId
      );

      return response as unknown as TestResult;
    } catch (error) {
      console.error("Ошибка при получении результата теста:", error);
      return null;
    }
  },
};

// Ключи для React Query
export const testSessionKeys = {
  all: ["testSessions"] as const,
  sessions: () => [...testSessionKeys.all, "session"] as const,
  session: (id: string) => [...testSessionKeys.sessions(), id] as const,
  byApplicant: (applicantId: string) => 
    [...testSessionKeys.all, "applicant", applicantId] as const,
  activeSession: (testId: string, applicantId: string) => 
    [...testSessionKeys.all, "active", testId, applicantId] as const,
  answers: (sessionId: string) => 
    [...testSessionKeys.all, "answers", sessionId] as const,
  results: () => [...testSessionKeys.all, "results"] as const,
  result: (id: string) => [...testSessionKeys.results(), id] as const,
  resultsByApplicant: (applicantId: string) => 
    [...testSessionKeys.results(), "applicant", applicantId] as const,
};

// React Query хуки
export const useCreateTestSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => 
      testSessionApi.createTestSession(data),
    onSuccess: (newSession) => {
      queryClient.invalidateQueries({ 
        queryKey: testSessionKeys.byApplicant(newSession.applicantId) 
      });
      queryClient.invalidateQueries({
        queryKey: testSessionKeys.activeSession(newSession.testId, newSession.applicantId)
      });
    },
  });
};

export const useActiveSession = (testId: string, applicantId: string) => {
  return useQuery({
    queryKey: testSessionKeys.activeSession(testId, applicantId),
    queryFn: () => testSessionApi.getActiveSession(testId, applicantId),
    enabled: !!testId && !!applicantId,
  });
};

export const useSession = (sessionId: string) => {
  return useQuery({
    queryKey: testSessionKeys.session(sessionId),
    queryFn: () => testSessionApi.getSessionById(sessionId),
    enabled: !!sessionId,
  });
};

export const useSessionsByApplicant = (applicantId: string) => {
  return useQuery({
    queryKey: testSessionKeys.byApplicant(applicantId),
    queryFn: () => testSessionApi.getSessionsByApplicant(applicantId),
    enabled: !!applicantId,
  });
};

export const useSubmitAnswer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => testSessionApi.submitAnswer(data),
    onSuccess: (_, { sessionId }) => {
      queryClient.invalidateQueries({ 
        queryKey: testSessionKeys.answers(sessionId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: testSessionKeys.session(sessionId) 
      });
    },
  });
};

export const useFinishTestSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      sessionId, 
      data 
    }: { 
      sessionId: string; 
      data: any;
    }) => testSessionApi.finishTestSession(sessionId, data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ 
        queryKey: testSessionKeys.session(result.sessionId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: testSessionKeys.byApplicant(result.applicantId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: testSessionKeys.resultsByApplicant(result.applicantId) 
      });
    },
  });
};

export const useApplicantResults = (applicantId: string) => {
  return useQuery({
    queryKey: testSessionKeys.resultsByApplicant(applicantId),
    queryFn: () => testSessionApi.getApplicantResults(applicantId),
    enabled: !!applicantId,
  });
};

export const useTestResult = (resultId: string) => {
  return useQuery({
    queryKey: testSessionKeys.result(resultId),
    queryFn: () => testSessionApi.getTestResult(resultId),
    enabled: !!resultId,
  });
};