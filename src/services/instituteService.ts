// src/services/instituteService.ts

import { Query, ID } from "appwrite";
import { databases } from "./appwriteClient";
import { appwriteConfig } from "@/constants/appwriteConfig";
import {
  Institute,
  Direction,
  CreateInstituteDto,
  UpdateInstituteDto,
  CreateDirectionDto,
  UpdateDirectionDto,
  DirectionWithInstitute,
} from "@/types";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export const instituteApi = {
  // === ИНСТИТУТЫ ===

  getAllInstitutes: async (): Promise<Institute[]> => {
    try {
      const response = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.collections.institutes,
        [Query.orderAsc("name")]
      );
      return response.documents as unknown as Institute[];
    } catch (error) {
      console.error("Ошибка при получении институтов:", error);
      return [];
    }
  },

  getActiveInstitutes: async (): Promise<Institute[]> => {
    try {
      const response = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.collections.institutes,
        [Query.equal("isActive", true), Query.orderAsc("name")]
      );
      return response.documents as unknown as Institute[];
    } catch (error) {
      console.error("Ошибка при получении активных институтов:", error);
      return [];
    }
  },

  getInstituteById: async (id: string): Promise<Institute | null> => {
    try {
      const response = await databases.getDocument(
        appwriteConfig.databaseId,
        appwriteConfig.collections.institutes,
        id
      );
      return response as unknown as Institute;
    } catch (error) {
      console.error("Ошибка при получении института:", error);
      return null;
    }
  },

  createInstitute: async (
    data: CreateInstituteDto,
    createdBy: string
  ): Promise<Institute> => {
    try {
      const instituteData = {
        ...data,
        isActive: true,
        createdBy,
        createdAt: new Date().toISOString(),
      };

      const response = await databases.createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.collections.institutes,
        ID.unique(),
        instituteData
      );
      return response as unknown as Institute;
    } catch (error) {
      console.error("Ошибка при создании института:", error);
      throw error;
    }
  },

  updateInstitute: async (
    id: string,
    data: UpdateInstituteDto
  ): Promise<Institute> => {
    try {
      const response = await databases.updateDocument(
        appwriteConfig.databaseId,
        appwriteConfig.collections.institutes,
        id,
        data
      );
      return response as unknown as Institute;
    } catch (error) {
      console.error("Ошибка при обновлении института:", error);
      throw error;
    }
  },

  deleteInstitute: async (id: string): Promise<boolean> => {
    try {
      await databases.deleteDocument(
        appwriteConfig.databaseId,
        appwriteConfig.collections.institutes,
        id
      );
      return true;
    } catch (error) {
      console.error("Ошибка при удалении института:", error);
      throw error;
    }
  },

  checkInstituteCodeExists: async (
    code: string,
    excludeId?: string
  ): Promise<boolean> => {
    try {
      const queries = [Query.equal("code", code)];
      if (excludeId) {
        queries.push(Query.notEqual("$id", excludeId));
      }

      const response = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.collections.institutes,
        queries
      );
      return response.total > 0;
    } catch (error) {
      console.error("Ошибка при проверке кода института:", error);
      return false;
    }
  },

  // === НАПРАВЛЕНИЯ ===

  getAllDirections: async (): Promise<DirectionWithInstitute[]> => {
    try {
      const response = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.collections.directions,
        [Query.orderAsc("name")]
      );

      const directions = response.documents as unknown as Direction[];

      // Получаем информацию об институтах
      const institutes = await instituteApi.getAllInstitutes();
      const instituteMap = new Map(institutes.map((inst) => [inst.$id, inst]));

      return directions.map((direction) => ({
        ...direction,
        institute: instituteMap.get(direction.instituteId),
      }));
    } catch (error) {
      console.error("Ошибка при получении направлений:", error);
      return [];
    }
  },

  getActiveDirections: async (): Promise<DirectionWithInstitute[]> => {
    try {
      const response = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.collections.directions,
        [Query.equal("isActive", true), Query.orderAsc("name")]
      );

      const directions = response.documents as unknown as Direction[];

      // Получаем информацию об институтах
      const institutes = await instituteApi.getActiveInstitutes();
      const instituteMap = new Map(institutes.map((inst) => [inst.$id, inst]));

      return directions.map((direction) => ({
        ...direction,
        institute: instituteMap.get(direction.instituteId),
      }));
    } catch (error) {
      console.error("Ошибка при получении активных направлений:", error);
      return [];
    }
  },

  getDirectionsByInstitute: async (
    instituteId: string
  ): Promise<Direction[]> => {
    try {
      const response = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.collections.directions,
        [
          Query.equal("instituteId", instituteId),
          Query.equal("isActive", true),
          Query.orderAsc("name"),
        ]
      );
      return response.documents as unknown as Direction[];
    } catch (error) {
      console.error("Ошибка при получении направлений института:", error);
      return [];
    }
  },

  getDirectionById: async (
    id: string
  ): Promise<DirectionWithInstitute | null> => {
    try {
      const response = await databases.getDocument(
        appwriteConfig.databaseId,
        appwriteConfig.collections.directions,
        id
      );

      const direction = response as unknown as Direction;
      const institute = await instituteApi.getInstituteById(
        direction.instituteId
      );

      return {
        ...direction,
        institute: institute || undefined,
      };
    } catch (error) {
      console.error("Ошибка при получении направления:", error);
      return null;
    }
  },

  createDirection: async (
    data: CreateDirectionDto,
    createdBy: string
  ): Promise<Direction> => {
    try {
      const directionData = {
        ...data,
        isActive: true,
        createdBy,
        createdAt: new Date().toISOString(),
      };

      const response = await databases.createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.collections.directions,
        ID.unique(),
        directionData
      );
      return response as unknown as Direction;
    } catch (error) {
      console.error("Ошибка при создании направления:", error);
      throw error;
    }
  },

  updateDirection: async (
    id: string,
    data: UpdateDirectionDto
  ): Promise<Direction> => {
    try {
      const response = await databases.updateDocument(
        appwriteConfig.databaseId,
        appwriteConfig.collections.directions,
        id,
        data
      );
      return response as unknown as Direction;
    } catch (error) {
      console.error("Ошибка при обновлении направления:", error);
      throw error;
    }
  },

  deleteDirection: async (id: string): Promise<boolean> => {
    try {
      await databases.deleteDocument(
        appwriteConfig.databaseId,
        appwriteConfig.collections.directions,
        id
      );
      return true;
    } catch (error) {
      console.error("Ошибка при удалении направления:", error);
      throw error;
    }
  },

  checkDirectionCodeExists: async (
    code: string,
    instituteId: string,
    excludeId?: string
  ): Promise<boolean> => {
    try {
      const queries = [
        Query.equal("code", code),
        Query.equal("instituteId", instituteId),
      ];

      if (excludeId) {
        queries.push(Query.notEqual("$id", excludeId));
      }

      const response = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.collections.directions,
        queries
      );
      return response.total > 0;
    } catch (error) {
      console.error("Ошибка при проверке кода направления:", error);
      return false;
    }
  },

  // === СТАТИСТИКА ===

  getInstituteStats: async () => {
    try {
      const [institutes, directions] = await Promise.all([
        instituteApi.getAllInstitutes(),
        instituteApi.getAllDirections(),
      ]);

      const activeInstitutes = institutes.filter((inst) => inst.isActive);
      const activeDirections = directions.filter((dir) => dir.isActive);

      const instituteStats = institutes.map((institute) => {
        const instituteDirs = directions.filter(
          (dir) => dir.instituteId === institute.$id
        );
        const activeDirs = instituteDirs.filter((dir) => dir.isActive);

        return {
          institute,
          totalDirections: instituteDirs.length,
          activeDirections: activeDirs.length,
        };
      });

      return {
        totalInstitutes: institutes.length,
        activeInstitutes: activeInstitutes.length,
        totalDirections: directions.length,
        activeDirections: activeDirections.length,
        instituteStats,
      };
    } catch (error) {
      console.error("Ошибка при получении статистики институтов:", error);
      return {
        totalInstitutes: 0,
        activeInstitutes: 0,
        totalDirections: 0,
        activeDirections: 0,
        instituteStats: [],
      };
    }
  },
};

// Ключи для React Query
export const instituteKeys = {
  all: ["institutes"] as const,
  lists: () => [...instituteKeys.all, "list"] as const,
  list: (filters: string) => [...instituteKeys.lists(), { filters }] as const,
  details: () => [...instituteKeys.all, "detail"] as const,
  detail: (id: string) => [...instituteKeys.details(), id] as const,
  stats: () => [...instituteKeys.all, "stats"] as const,
};

export const directionKeys = {
  all: ["directions"] as const,
  lists: () => [...directionKeys.all, "list"] as const,
  list: (filters: string) => [...directionKeys.lists(), { filters }] as const,
  details: () => [...directionKeys.all, "detail"] as const,
  detail: (id: string) => [...directionKeys.details(), id] as const,
  byInstitute: (instituteId: string) =>
    [...directionKeys.all, "institute", instituteId] as const,
};

// React Query хуки для институтов
export const useInstitutes = () => {
  return useQuery({
    queryKey: instituteKeys.list("all"),
    queryFn: instituteApi.getAllInstitutes,
  });
};

export const useActiveInstitutes = () => {
  return useQuery({
    queryKey: instituteKeys.list("active"),
    queryFn: instituteApi.getActiveInstitutes,
  });
};

export const useInstitute = (id: string) => {
  return useQuery({
    queryKey: instituteKeys.detail(id),
    queryFn: () => instituteApi.getInstituteById(id),
    enabled: !!id,
  });
};

export const useCreateInstitute = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      data,
      createdBy,
    }: {
      data: CreateInstituteDto;
      createdBy: string;
    }) => instituteApi.createInstitute(data, createdBy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: instituteKeys.lists() });
      queryClient.invalidateQueries({ queryKey: instituteKeys.stats() });
    },
  });
};

export const useUpdateInstitute = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateInstituteDto }) =>
      instituteApi.updateInstitute(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: instituteKeys.lists() });
      queryClient.invalidateQueries({ queryKey: instituteKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: instituteKeys.stats() });
    },
  });
};

export const useDeleteInstitute = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => instituteApi.deleteInstitute(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: instituteKeys.lists() });
      queryClient.invalidateQueries({ queryKey: instituteKeys.stats() });
    },
  });
};

// React Query хуки для направлений
export const useDirections = () => {
  return useQuery({
    queryKey: directionKeys.list("all"),
    queryFn: instituteApi.getAllDirections,
  });
};

export const useActiveDirections = () => {
  return useQuery({
    queryKey: directionKeys.list("active"),
    queryFn: instituteApi.getActiveDirections,
  });
};

export const useDirectionsByInstitute = (instituteId: string) => {
  return useQuery({
    queryKey: directionKeys.byInstitute(instituteId),
    queryFn: () => instituteApi.getDirectionsByInstitute(instituteId),
    enabled: !!instituteId,
  });
};

export const useDirection = (id: string) => {
  return useQuery({
    queryKey: directionKeys.detail(id),
    queryFn: () => instituteApi.getDirectionById(id),
    enabled: !!id,
  });
};

export const useCreateDirection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      data,
      createdBy,
    }: {
      data: CreateDirectionDto;
      createdBy: string;
    }) => instituteApi.createDirection(data, createdBy),
    onSuccess: (newDirection) => {
      queryClient.invalidateQueries({ queryKey: directionKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: directionKeys.byInstitute(newDirection.instituteId),
      });
      queryClient.invalidateQueries({ queryKey: instituteKeys.stats() });
    },
  });
};

export const useUpdateDirection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDirectionDto }) =>
      instituteApi.updateDirection(id, data),
    onSuccess: (updatedDirection, { id }) => {
      queryClient.invalidateQueries({ queryKey: directionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: directionKeys.detail(id) });
      queryClient.invalidateQueries({
        queryKey: directionKeys.byInstitute(updatedDirection.instituteId),
      });
      queryClient.invalidateQueries({ queryKey: instituteKeys.stats() });
    },
  });
};

export const useDeleteDirection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => instituteApi.deleteDirection(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: directionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: instituteKeys.stats() });
    },
  });
};

// Хук для статистики институтов
export const useInstituteStats = () => {
  return useQuery({
    queryKey: instituteKeys.stats(),
    queryFn: instituteApi.getInstituteStats,
  });
};
