// src/services/testService.ts

import { Query, ID } from "appwrite";
import { databases } from "./appwriteClient";
import { appwriteConfig } from "@/constants/appwriteConfig";
import {
  Test,
  Question,
  TestWithDetails,
  CreateTestDto,
  UpdateTestDto,
  CreateQuestionDto,
  UpdateQuestionDto,
  TestImportData,
  QuestionImportData,
  ImportResult,
} from "@/types";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { instituteApi } from "./instituteService";

export const testApi = {
  // === ТЕСТЫ ===

  getAllTests: async (): Promise<TestWithDetails[]> => {
    try {
      const response = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.collections.tests,
        [Query.orderDesc("$createdAt")]
      );

      const tests = response.documents as unknown as Test[];
      return await enrichTestsWithDetails(tests);
    } catch (error) {
      console.error("Ошибка при получении тестов:", error);
      return [];
    }
  },

  getTestsByCurator: async (curatorId: string): Promise<TestWithDetails[]> => {
    try {
      const response = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.collections.tests,
        [Query.equal("curatorId", curatorId), Query.orderDesc("$createdAt")]
      );

      const tests = response.documents as unknown as Test[];
      return await enrichTestsWithDetails(tests);
    } catch (error) {
      console.error("Ошибка при получении тестов куратора:", error);
      return [];
    }
  },

  getTestsByDirection: async (
    directionId: string
  ): Promise<TestWithDetails[]> => {
    try {
      const response = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.collections.tests,
        [
          Query.equal("directionId", directionId),
          Query.equal("isActive", true),
          Query.equal("isPublished", true),
          Query.orderAsc("title"),
        ]
      );

      const tests = response.documents as unknown as Test[];
      return await enrichTestsWithDetails(tests);
    } catch (error) {
      console.error("Ошибка при получении тестов направления:", error);
      return [];
    }
  },

  getPublishedTests: async (): Promise<TestWithDetails[]> => {
    try {
      const response = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.collections.tests,
        [
          Query.equal("isActive", true),
          Query.equal("isPublished", true),
          Query.orderAsc("title"),
        ]
      );

      const tests = response.documents as unknown as Test[];
      return await enrichTestsWithDetails(tests);
    } catch (error) {
      console.error("Ошибка при получении опубликованных тестов:", error);
      return [];
    }
  },

  getTestById: async (id: string): Promise<TestWithDetails | null> => {
    try {
      const response = await databases.getDocument(
        appwriteConfig.databaseId,
        appwriteConfig.collections.tests,
        id
      );

      const test = response as unknown as Test;
      const enriched = await enrichTestsWithDetails([test]);
      return enriched[0] || null;
    } catch (error) {
      console.error("Ошибка при получении теста:", error);
      return null;
    }
  },

  createTest: async (data: CreateTestDto, curatorId: string): Promise<Test> => {
    try {
      const testData = {
        ...data,
        curatorId,
        totalQuestions: 0,
        maxScore: 100,
        passingScore: data.passingScore || 60,
        isActive: true,
        isPublished: false,
        createdAt: new Date().toISOString(),
      };

      const response = await databases.createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.collections.tests,
        ID.unique(),
        testData
      );
      return response as unknown as Test;
    } catch (error) {
      console.error("Ошибка при создании теста:", error);
      throw error;
    }
  },

  updateTest: async (id: string, data: UpdateTestDto): Promise<Test> => {
    try {
      const updateData = {
        ...data,
        updatedAt: new Date().toISOString(),
      };

      const response = await databases.updateDocument(
        appwriteConfig.databaseId,
        appwriteConfig.collections.tests,
        id,
        updateData
      );
      return response as unknown as Test;
    } catch (error) {
      console.error("Ошибка при обновлении теста:", error);
      throw error;
    }
  },

  publishTest: async (id: string): Promise<Test> => {
    try {
      // Проверяем, есть ли вопросы в тесте
      const questions = await testApi.getQuestionsByTest(id);
      if (questions.length === 0) {
        throw new Error("Нельзя опубликовать тест без вопросов");
      }

      const response = await databases.updateDocument(
        appwriteConfig.databaseId,
        appwriteConfig.collections.tests,
        id,
        {
          isPublished: true,
          updatedAt: new Date().toISOString(),
        }
      );
      return response as unknown as Test;
    } catch (error) {
      console.error("Ошибка при публикации теста:", error);
      throw error;
    }
  },

  unpublishTest: async (id: string): Promise<Test> => {
    try {
      const response = await databases.updateDocument(
        appwriteConfig.databaseId,
        appwriteConfig.collections.tests,
        id,
        {
          isPublished: false,
          updatedAt: new Date().toISOString(),
        }
      );
      return response as unknown as Test;
    } catch (error) {
      console.error("Ошибка при снятии теста с публикации:", error);
      throw error;
    }
  },

  deleteTest: async (id: string): Promise<boolean> => {
    try {
      // Сначала удаляем все вопросы теста
      const questions = await testApi.getQuestionsByTest(id);
      await Promise.all(
        questions.map((question) => testApi.deleteQuestion(question.$id))
      );

      // Затем удаляем сам тест
      await databases.deleteDocument(
        appwriteConfig.databaseId,
        appwriteConfig.collections.tests,
        id
      );
      return true;
    } catch (error) {
      console.error("Ошибка при удалении теста:", error);
      throw error;
    }
  },

  // === ВОПРОСЫ ===

  getQuestionsByTest: async (testId: string): Promise<Question[]> => {
    try {
      const response = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.collections.questions,
        [Query.equal("testId", testId), Query.orderAsc("order")]
      );
      return response.documents as unknown as Question[];
    } catch (error) {
      console.error("Ошибка при получении вопросов теста:", error);
      return [];
    }
  },

  getQuestionById: async (id: string): Promise<Question | null> => {
    try {
      const response = await databases.getDocument(
        appwriteConfig.databaseId,
        appwriteConfig.collections.questions,
        id
      );
      return response as unknown as Question;
    } catch (error) {
      console.error("Ошибка при получении вопроса:", error);
      return null;
    }
  },

  createQuestion: async (data: CreateQuestionDto): Promise<Question> => {
    try {
      // Получаем следующий порядковый номер
      const existingQuestions = await testApi.getQuestionsByTest(data.testId);
      const nextOrder = existingQuestions.length + 1;

      const questionData = {
        ...data,
        points: data.points || 1,
        order: nextOrder,
        createdAt: new Date().toISOString(),
      };

      const response = await databases.createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.collections.questions,
        ID.unique(),
        questionData
      );

      // Обновляем количество вопросов и максимальный балл в тесте
      await updateTestMetrics(data.testId);

      return response as unknown as Question;
    } catch (error) {
      console.error("Ошибка при создании вопроса:", error);
      throw error;
    }
  },

  updateQuestion: async (
    id: string,
    data: UpdateQuestionDto
  ): Promise<Question> => {
    try {
      const response = await databases.updateDocument(
        appwriteConfig.databaseId,
        appwriteConfig.collections.questions,
        id,
        data
      );

      // Если изменились баллы, обновляем метрики теста
      if (data.points !== undefined) {
        const question = response as unknown as Question;
        await updateTestMetrics(question.testId);
      }

      return response as unknown as Question;
    } catch (error) {
      console.error("Ошибка при обновлении вопроса:", error);
      throw error;
    }
  },

  deleteQuestion: async (id: string): Promise<boolean> => {
    try {
      const question = await testApi.getQuestionById(id);
      if (!question) {
        throw new Error("Вопрос не найден");
      }

      await databases.deleteDocument(
        appwriteConfig.databaseId,
        appwriteConfig.collections.questions,
        id
      );

      // Обновляем порядок оставшихся вопросов
      await reorderQuestions(question.testId, question.order);

      // Обновляем метрики теста
      await updateTestMetrics(question.testId);

      return true;
    } catch (error) {
      console.error("Ошибка при удалении вопроса:", error);
      throw error;
    }
  },

  reorderQuestions: async (
    testId: string,
    questionOrders: { id: string; order: number }[]
  ): Promise<void> => {
    try {
      await Promise.all(
        questionOrders.map(({ id, order }) =>
          databases.updateDocument(
            appwriteConfig.databaseId,
            appwriteConfig.collections.questions,
            id,
            { order }
          )
        )
      );
    } catch (error) {
      console.error("Ошибка при изменении порядка вопросов:", error);
      throw error;
    }
  },

  // === ИМПОРТ/ЭКСПОРТ ===

  importTest: async (
    importData: TestImportData,
    directionId: string,
    curatorId: string
  ): Promise<ImportResult> => {
    try {
      const result: ImportResult = {
        success: false,
        questionsImported: 0,
        errors: [],
        warnings: [],
      };

      // Создаем тест
      const testData: CreateTestDto = {
        title: importData.title,
        description: importData.description,
        directionId,
        timeLimit: importData.timeLimit,
        passingScore: importData.passingScore,
      };

      const test = await testApi.createTest(testData, curatorId);
      result.testId = test.$id;

      // Импортируем вопросы
      for (let i = 0; i < importData.questions.length; i++) {
        const questionData = importData.questions[i];

        try {
          await testApi.createQuestion({
            testId: test.$id,
            questionText: questionData.questionText,
            optionA: questionData.optionA,
            optionB: questionData.optionB,
            optionC: questionData.optionC,
            optionD: questionData.optionD,
            correctAnswer: questionData.correctAnswer,
            points: questionData.points || 1,
          });

          result.questionsImported++;
        } catch (error) {
          result.errors.push(`Вопрос ${i + 1}: ${(error as Error).message}`);
        }
      }

      result.success = result.questionsImported > 0;

      if (result.errors.length > 0) {
        result.warnings.push(
          `${result.errors.length} вопросов не удалось импортировать`
        );
      }

      return result;
    } catch (error) {
      console.error("Ошибка при импорте теста:", error);
      return {
        success: false,
        questionsImported: 0,
        errors: [(error as Error).message],
        warnings: [],
      };
    }
  },

  exportTest: async (testId: string): Promise<TestImportData | null> => {
    try {
      const test = await testApi.getTestById(testId);
      const questions = await testApi.getQuestionsByTest(testId);

      if (!test) {
        throw new Error("Тест не найден");
      }

      return {
        title: test.title,
        description: test.description,
        timeLimit: test.timeLimit,
        passingScore: test.passingScore,
        questions: questions.map((q) => ({
          questionText: q.questionText,
          optionA: q.optionA,
          optionB: q.optionB,
          optionC: q.optionC,
          optionD: q.optionD,
          correctAnswer: q.correctAnswer,
          points: q.points,
        })),
      };
    } catch (error) {
      console.error("Ошибка при экспорте теста:", error);
      return null;
    }
  },

  // === СТАТИСТИКА ===

  getTestStats: async (testId: string) => {
    try {
      // Здесь будем получать статистику по прохождениям теста
      // Пока возвращаем базовую информацию
      const test = await testApi.getTestById(testId);
      const questions = await testApi.getQuestionsByTest(testId);

      if (!test) {
        return null;
      }

      return {
        testId,
        title: test.title,
        totalQuestions: questions.length,
        maxScore: questions.reduce((sum, q) => sum + q.points, 0),
        averageQuestionPoints:
          questions.length > 0
            ? questions.reduce((sum, q) => sum + q.points, 0) / questions.length
            : 0,
        // Дополнительная статистика будет добавлена при реализации результатов
      };
    } catch (error) {
      console.error("Ошибка при получении статистики теста:", error);
      return null;
    }
  },
};

// Вспомогательные функции
const enrichTestsWithDetails = async (
  tests: Test[]
): Promise<TestWithDetails[]> => {
  try {
    // Получаем все направления и кураторов
    const [directions, curators] = await Promise.all([
      instituteApi.getAllDirections(),
      // Здесь нужно будет импортировать userApi для получения кураторов
      // userApi.getUsersByRole(UserRole.CURATOR)
    ]);

    return tests.map((test) => {
      const direction = directions.find((d) => d.$id === test.directionId);

      return {
        ...test,
        direction,
        institute: direction?.institute,
        // curator будет добавлен после создания userApi
        questionsCount: test.totalQuestions,
      };
    });
  } catch (error) {
    console.error("Ошибка при обогащении тестов:", error);
    return tests.map((test) => ({
      ...test,
      questionsCount: test.totalQuestions,
    }));
  }
};

const updateTestMetrics = async (testId: string): Promise<void> => {
  try {
    const questions = await testApi.getQuestionsByTest(testId);
    const totalQuestions = questions.length;
    const maxScore = questions.reduce((sum, q) => sum + q.points, 0);

    await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.collections.tests,
      testId,
      {
        totalQuestions,
        maxScore,
        updatedAt: new Date().toISOString(),
      }
    );
  } catch (error) {
    console.error("Ошибка при обновлении метрик теста:", error);
  }
};

const reorderQuestions = async (
  testId: string,
  deletedOrder: number
): Promise<void> => {
  try {
    const questions = await testApi.getQuestionsByTest(testId);

    // Обновляем порядок для вопросов, которые идут после удаленного
    const questionsToUpdate = questions
      .filter((q) => q.order > deletedOrder)
      .map((q) => ({ id: q.$id, order: q.order - 1 }));

    if (questionsToUpdate.length > 0) {
      await testApi.reorderQuestions(testId, questionsToUpdate);
    }
  } catch (error) {
    console.error("Ошибка при переупорядочивании вопросов:", error);
  }
};

// Ключи для React Query
export const testKeys = {
  all: ["tests"] as const,
  lists: () => [...testKeys.all, "list"] as const,
  list: (filters: string) => [...testKeys.lists(), { filters }] as const,
  details: () => [...testKeys.all, "detail"] as const,
  detail: (id: string) => [...testKeys.details(), id] as const,
  byCurator: (curatorId: string) =>
    [...testKeys.all, "curator", curatorId] as const,
  byDirection: (directionId: string) =>
    [...testKeys.all, "direction", directionId] as const,
  published: () => [...testKeys.all, "published"] as const,
  stats: (testId: string) => [...testKeys.all, "stats", testId] as const,
};

export const questionKeys = {
  all: ["questions"] as const,
  byTest: (testId: string) => [...questionKeys.all, "test", testId] as const,
  detail: (id: string) => [...questionKeys.all, "detail", id] as const,
};

// React Query хуки для тестов
export const useTests = () => {
  return useQuery({
    queryKey: testKeys.list("all"),
    queryFn: testApi.getAllTests,
  });
};

export const useTestsByCurator = (curatorId: string) => {
  return useQuery({
    queryKey: testKeys.byCurator(curatorId),
    queryFn: () => testApi.getTestsByCurator(curatorId),
    enabled: !!curatorId,
  });
};

export const useTestsByDirection = (directionId: string) => {
  return useQuery({
    queryKey: testKeys.byDirection(directionId),
    queryFn: () => testApi.getTestsByDirection(directionId),
    enabled: !!directionId,
  });
};

export const usePublishedTests = () => {
  return useQuery({
    queryKey: testKeys.published(),
    queryFn: testApi.getPublishedTests,
  });
};

export const useTest = (id: string) => {
  return useQuery({
    queryKey: testKeys.detail(id),
    queryFn: () => testApi.getTestById(id),
    enabled: !!id,
  });
};

export const useCreateTest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      data,
      curatorId,
    }: {
      data: CreateTestDto;
      curatorId: string;
    }) => testApi.createTest(data, curatorId),
    onSuccess: (newTest) => {
      queryClient.invalidateQueries({ queryKey: testKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: testKeys.byCurator(newTest.curatorId),
      });
      queryClient.invalidateQueries({
        queryKey: testKeys.byDirection(newTest.directionId),
      });
    },
  });
};

export const useUpdateTest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTestDto }) =>
      testApi.updateTest(id, data),
    onSuccess: (updatedTest, { id }) => {
      queryClient.invalidateQueries({ queryKey: testKeys.lists() });
      queryClient.invalidateQueries({ queryKey: testKeys.detail(id) });
      queryClient.invalidateQueries({
        queryKey: testKeys.byCurator(updatedTest.curatorId),
      });
      queryClient.invalidateQueries({
        queryKey: testKeys.byDirection(updatedTest.directionId),
      });
    },
  });
};

export const usePublishTest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => testApi.publishTest(id),
    onSuccess: (updatedTest, id) => {
      queryClient.invalidateQueries({ queryKey: testKeys.lists() });
      queryClient.invalidateQueries({ queryKey: testKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: testKeys.published() });
      queryClient.invalidateQueries({
        queryKey: testKeys.byCurator(updatedTest.curatorId),
      });
      queryClient.invalidateQueries({
        queryKey: testKeys.byDirection(updatedTest.directionId),
      });
    },
  });
};

export const useDeleteTest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => testApi.deleteTest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: testKeys.lists() });
      queryClient.invalidateQueries({ queryKey: testKeys.published() });
    },
  });
};

// React Query хуки для вопросов
export const useQuestionsByTest = (testId: string) => {
  return useQuery({
    queryKey: questionKeys.byTest(testId),
    queryFn: () => testApi.getQuestionsByTest(testId),
    enabled: !!testId,
  });
};

export const useQuestion = (id: string) => {
  return useQuery({
    queryKey: questionKeys.detail(id),
    queryFn: () => testApi.getQuestionById(id),
    enabled: !!id,
  });
};

export const useCreateQuestion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateQuestionDto) => testApi.createQuestion(data),
    onSuccess: (newQuestion) => {
      queryClient.invalidateQueries({
        queryKey: questionKeys.byTest(newQuestion.testId),
      });
      queryClient.invalidateQueries({
        queryKey: testKeys.detail(newQuestion.testId),
      });
    },
  });
};

export const useUpdateQuestion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateQuestionDto }) =>
      testApi.updateQuestion(id, data),
    onSuccess: (updatedQuestion, { id }) => {
      queryClient.invalidateQueries({
        queryKey: questionKeys.byTest(updatedQuestion.testId),
      });
      queryClient.invalidateQueries({ queryKey: questionKeys.detail(id) });
      queryClient.invalidateQueries({
        queryKey: testKeys.detail(updatedQuestion.testId),
      });
    },
  });
};

export const useDeleteQuestion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => testApi.deleteQuestion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: questionKeys.all });
      queryClient.invalidateQueries({ queryKey: testKeys.all });
    },
  });
};

export const useImportTest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      importData,
      directionId,
      curatorId,
    }: {
      importData: TestImportData;
      directionId: string;
      curatorId: string;
    }) => testApi.importTest(importData, directionId, curatorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: testKeys.lists() });
    },
  });
};
