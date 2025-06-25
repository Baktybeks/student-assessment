// src/services/profileService.ts

import { Query, ID } from "appwrite";
import { databases } from "./appwriteClient";
import { appwriteConfig } from "@/constants/appwriteConfig";
import {
  ApplicantProfile,
  ApplicantWithProfile,
  UpdateApplicantProfileDto,
  DirectionWithInstitute,
  User,
} from "@/types";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { instituteApi } from "./instituteService";

export const profileApi = {
  // === ПРОФИЛИ АБИТУРИЕНТОВ ===

  getProfileByUserId: async (userId: string): Promise<ApplicantProfile | null> => {
    try {
      const response = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.collections.applicantProfiles,
        [Query.equal("userId", userId)]
      );

      if (response.documents.length === 0) {
        return null;
      }

      return response.documents[0] as unknown as ApplicantProfile;
    } catch (error) {
      console.error("Ошибка при получении профиля абитуриента:", error);
      return null;
    }
  },

  getProfileById: async (profileId: string): Promise<ApplicantProfile | null> => {
    try {
      const response = await databases.getDocument(
        appwriteConfig.databaseId,
        appwriteConfig.collections.applicantProfiles,
        profileId
      );
      return response as unknown as ApplicantProfile;
    } catch (error) {
      console.error("Ошибка при получении профиля:", error);
      return null;
    }
  },

  createProfile: async (
    userId: string,
    directionId: string
  ): Promise<ApplicantProfile> => {
    try {
      const profileData = {
        userId,
        firstName: "",
        lastName: "",
        middleName: "",
        birthDate: new Date().toISOString(),
        passportNumber: "",
        passportIssueDate: new Date().toISOString(),
        passportIssuedBy: "",
        citizenship: "Российская Федерация",
        phone: "",
        directionId,
        isProfileComplete: false,
        createdAt: new Date().toISOString(),
      };

      const response = await databases.createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.collections.applicantProfiles,
        ID.unique(),
        profileData
      );
      return response as unknown as ApplicantProfile;
    } catch (error) {
      console.error("Ошибка при создании профиля:", error);
      throw error;
    }
  },

  updateProfile: async (
    profileId: string,
    data: UpdateApplicantProfileDto
  ): Promise<ApplicantProfile> => {
    try {
      // Проверяем, заполнены ли все обязательные поля
      const isComplete = Boolean(
        data.firstName &&
        data.lastName &&
        data.birthDate &&
        data.passportNumber &&
        data.passportIssueDate &&
        data.passportIssuedBy &&
        data.citizenship &&
        data.phone &&
        data.directionId
      );

      const updateData = {
        ...data,
        isProfileComplete: isComplete,
        updatedAt: new Date().toISOString(),
      };

      const response = await databases.updateDocument(
        appwriteConfig.databaseId,
        appwriteConfig.collections.applicantProfiles,
        profileId,
        updateData
      );
      return response as unknown as ApplicantProfile;
    } catch (error) {
      console.error("Ошибка при обновлении профиля:", error);
      throw error;
    }
  },

  deleteProfile: async (profileId: string): Promise<boolean> => {
    try {
      await databases.deleteDocument(
        appwriteConfig.databaseId,
        appwriteConfig.collections.applicantProfiles,
        profileId
      );
      return true;
    } catch (error) {
      console.error("Ошибка при удалении профиля:", error);
      throw error;
    }
  },

  // === ПОЛУЧЕНИЕ РАСШИРЕННЫХ ДАННЫХ ===

  getApplicantWithProfile: async (
    userId: string
  ): Promise<ApplicantWithProfile | null> => {
    try {
      // Получаем пользователя
      const userResponse = await databases.getDocument(
        appwriteConfig.databaseId,
        appwriteConfig.collections.users,
        userId
      );
      const user = userResponse as unknown as User;

      // Получаем профиль
      const profile = await profileApi.getProfileByUserId(userId);

      if (!profile) {
        return {
          ...user,
          profile: undefined,
          direction: undefined,
          institute: undefined,
        };
      }

      // Получаем направление и институт
      const direction = await instituteApi.getDirectionById(profile.directionId);

      return {
        ...user,
        profile,
        direction: direction || undefined,
        institute: direction?.institute || undefined,
      };
    } catch (error) {
      console.error("Ошибка при получении абитуриента с профилем:", error);
      return null;
    }
  },

  getAllApplicantsWithProfiles: async (): Promise<ApplicantWithProfile[]> => {
    try {
      // Получаем всех абитуриентов
      const usersResponse = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.collections.users,
        [Query.equal("role", "APPLICANT"), Query.orderAsc("name")]
      );

      const users = usersResponse.documents as unknown as User[];

      // Получаем все профили
      const profilesResponse = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.collections.applicantProfiles,
        [Query.orderDesc("$createdAt")]
      );

      const profiles = profilesResponse.documents as unknown as ApplicantProfile[];
      const profileMap = new Map(profiles.map(p => [p.userId, p]));

      // Получаем направления и институты
      const directions = await instituteApi.getAllDirections();
      const directionMap = new Map(directions.map(d => [d.$id, d]));

      // Объединяем данные
      return users.map(user => {
        const profile = profileMap.get(user.$id);
        const direction = profile ? directionMap.get(profile.directionId) : undefined;

        return {
          ...user,
          profile,
          direction,
          institute: direction?.institute,
        };
      });
    } catch (error) {
      console.error("Ошибка при получении абитуриентов с профилями:", error);
      return [];
    }
  },

  // === СТАТИСТИКА ===

  getProfileStats: async () => {
    try {
      const profilesResponse = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.collections.applicantProfiles
      );

      const profiles = profilesResponse.documents as unknown as ApplicantProfile[];

      const complete = profiles.filter(p => p.isProfileComplete).length;
      const incomplete = profiles.filter(p => !p.isProfileComplete).length;

      // Статистика по направлениям
      const directionStats = new Map<string, number>();
      profiles.forEach(profile => {
        const count = directionStats.get(profile.directionId) || 0;
        directionStats.set(profile.directionId, count + 1);
      });

      return {
        total: profiles.length,
        complete,
        incomplete,
        completionRate: profiles.length > 0 ? (complete / profiles.length) * 100 : 0,
        directionStats: Array.from(directionStats.entries()).map(([directionId, count]) => ({
          directionId,
          count,
        })),
      };
    } catch (error) {
      console.error("Ошибка при получении статистики профилей:", error);
      return {
        total: 0,
        complete: 0,
        incomplete: 0,
        completionRate: 0,
        directionStats: [],
      };
    }
  },

  // === ВАЛИДАЦИЯ ===

  validateProfileData: (data: Partial<UpdateApplicantProfileDto>) => {
    const errors: string[] = [];

    if (data.firstName && data.firstName.trim().length < 2) {
      errors.push("Имя должно содержать минимум 2 символа");
    }

    if (data.lastName && data.lastName.trim().length < 2) {
      errors.push("Фамилия должна содержать минимум 2 символа");
    }

    if (data.passportNumber) {
      // Проверка формата российского паспорта: 4 цифры пробел 6 цифр
      const passportRegex = /^\d{4}\s\d{6}$/;
      if (!passportRegex.test(data.passportNumber)) {
        errors.push("Неверный формат номера паспорта (пример: 1234 567890)");
      }
    }

    if (data.phone) {
      // Проверка российского номера телефона
       const phoneRegex = /^(\+996|0)?[\s\-]?(5|7|9)[0-9]{2}[\s\-]?[0-9]{3}[\s\-]?[0-9]{3}$/;
      if (!phoneRegex.test(data.phone)) {
        errors.push("Неверный формат номера телефона");
      }
    }

    if (data.birthDate) {
      const birthDate = new Date(data.birthDate);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      
      if (age < 14 || age > 100) {
        errors.push("Некорректная дата рождения");
      }
    }

    return errors;
  },
};

// Ключи для React Query
export const profileKeys = {
  all: ["profiles"] as const,
  lists: () => [...profileKeys.all, "list"] as const,
  list: (filters: string) => [...profileKeys.lists(), { filters }] as const,
  details: () => [...profileKeys.all, "detail"] as const,
  detail: (id: string) => [...profileKeys.details(), id] as const,
  byUser: (userId: string) => [...profileKeys.all, "user", userId] as const,
  stats: () => [...profileKeys.all, "stats"] as const,
};

// React Query хуки
export const useProfileByUserId = (userId: string) => {
  return useQuery({
    queryKey: profileKeys.byUser(userId),
    queryFn: () => profileApi.getProfileByUserId(userId),
    enabled: !!userId,
  });
};

export const useProfile = (profileId: string) => {
  return useQuery({
    queryKey: profileKeys.detail(profileId),
    queryFn: () => profileApi.getProfileById(profileId),
    enabled: !!profileId,
  });
};

export const useApplicantWithProfile = (userId: string) => {
  return useQuery({
    queryKey: [...profileKeys.byUser(userId), "with-details"],
    queryFn: () => profileApi.getApplicantWithProfile(userId),
    enabled: !!userId,
  });
};

export const useAllApplicantsWithProfiles = () => {
  return useQuery({
    queryKey: profileKeys.list("all-with-details"),
    queryFn: profileApi.getAllApplicantsWithProfiles,
  });
};

export const useCreateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, directionId }: { userId: string; directionId: string }) =>
      profileApi.createProfile(userId, directionId),
    onSuccess: (newProfile) => {
      queryClient.invalidateQueries({ queryKey: profileKeys.byUser(newProfile.userId) });
      queryClient.invalidateQueries({ queryKey: profileKeys.lists() });
      queryClient.invalidateQueries({ queryKey: profileKeys.stats() });
    },
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      profileId, 
      data 
    }: { 
      profileId: string; 
      data: UpdateApplicantProfileDto;
    }) => profileApi.updateProfile(profileId, data),
    onSuccess: (updatedProfile, { profileId }) => {
      queryClient.invalidateQueries({ queryKey: profileKeys.detail(profileId) });
      queryClient.invalidateQueries({ queryKey: profileKeys.byUser(updatedProfile.userId) });
      queryClient.invalidateQueries({ queryKey: profileKeys.lists() });
      queryClient.invalidateQueries({ queryKey: profileKeys.stats() });
    },
  });
};

export const useDeleteProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (profileId: string) => profileApi.deleteProfile(profileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.lists() });
      queryClient.invalidateQueries({ queryKey: profileKeys.stats() });
    },
  });
};

export const useProfileStats = () => {
  return useQuery({
    queryKey: profileKeys.stats(),
    queryFn: profileApi.getProfileStats,
  });
};