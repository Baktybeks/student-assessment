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

// Ключ для localStorage
const PROFILE_BACKUP_KEY = "profile_backup_data";

export const profileApi = {
  // === ЛОКАЛЬНОЕ СОХРАНЕНИЕ ===

  saveToLocalStorage: (data: UpdateApplicantProfileDto, userId: string) => {
    try {
      const backupData = {
        ...data,
        userId,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem(PROFILE_BACKUP_KEY, JSON.stringify(backupData));
      console.log("Данные профиля сохранены в localStorage");
    } catch (error) {
      console.error("Ошибка при сохранении в localStorage:", error);
    }
  },

  loadFromLocalStorage: (): UpdateApplicantProfileDto | null => {
    try {
      const data = localStorage.getItem(PROFILE_BACKUP_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        // Убираем служебные поля
        const { userId, timestamp, ...profileData } = parsed;
        return profileData;
      }
      return null;
    } catch (error) {
      console.error("Ошибка при загрузке из localStorage:", error);
      return null;
    }
  },

  clearLocalStorage: () => {
    try {
      localStorage.removeItem(PROFILE_BACKUP_KEY);
      console.log("Данные профиля очищены из localStorage");
    } catch (error) {
      console.error("Ошибка при очистке localStorage:", error);
    }
  },

  // === ПРОФИЛИ АБИТУРИЕНТОВ ===

  getProfileByUserId: async (userId: string): Promise<ApplicantProfile | null> => {
    try {
      if (!userId) {
        console.warn("getProfileByUserId: пустой userId");
        return null;
      }

      const response = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.collections.applicantProfiles,
        [Query.equal("userId", userId)]
      );

      if (response.documents.length === 0) {
        console.log(`Профиль для пользователя ${userId} не найден`);
        return null;
      }

      const profile = response.documents[0] as unknown as ApplicantProfile;
      console.log(`Профиль загружен для пользователя ${userId}:`, profile);
      return profile;
    } catch (error) {
      console.error("Ошибка при получении профиля абитуриента:", error);
      
      // Сохраняем ошибку для отладки
      if (error instanceof Error) {
        console.error("Детали ошибки:", {
          message: error.message,
          name: error.name,
          stack: error.stack,
        });
      }
      
      return null;
    }
  },

  getProfileById: async (profileId: string): Promise<ApplicantProfile | null> => {
    try {
      if (!profileId) {
        console.warn("getProfileById: пустой profileId");
        return null;
      }

      const response = await databases.getDocument(
        appwriteConfig.databaseId,
        appwriteConfig.collections.applicantProfiles,
        profileId
      );
      
      const profile = response as unknown as ApplicantProfile;
      console.log(`Профиль загружен по ID ${profileId}:`, profile);
      return profile;
    } catch (error) {
      console.error("Ошибка при получении профиля:", error);
      
      if (error instanceof Error) {
        console.error("Детали ошибки:", {
          message: error.message,
          name: error.name,
          stack: error.stack,
        });
      }
      
      return null;
    }
  },

  createProfile: async (
    userId: string,
    directionId: string
  ): Promise<ApplicantProfile> => {
    try {
      if (!userId || !directionId) {
        throw new Error("Не указаны обязательные параметры: userId или directionId");
      }

      console.log(`Создание профиля для пользователя ${userId}, направление ${directionId}`);

      const profileData = {
        userId,
        firstName: "",
        lastName: "",
        middleName: "",
        birthDate: new Date().toISOString(),
        passportNumber: "",
        passportIssueDate: new Date().toISOString(),
        passportIssuedBy: "",
        citizenship: "Кыргызская Республика",
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
      
      const newProfile = response as unknown as ApplicantProfile;
      console.log("Профиль успешно создан:", newProfile);
      return newProfile;
    } catch (error) {
      console.error("Ошибка при создании профиля:", error);
      
      if (error instanceof Error) {
        console.error("Детали ошибки создания:", {
          message: error.message,
          name: error.name,
          stack: error.stack,
        });
      }
      
      throw error;
    }
  },

  updateProfile: async (
    profileId: string,
    data: UpdateApplicantProfileDto
  ): Promise<ApplicantProfile> => {
    try {
      if (!profileId) {
        throw new Error("Не указан ID профиля");
      }

      console.log(`Обновление профиля ${profileId}:`, data);

      // Проверяем, заполнены ли все обязательные поля
      const isComplete = Boolean(
        data.firstName?.trim() &&
        data.lastName?.trim() &&
        data.birthDate &&
        data.passportNumber?.trim() &&
        data.passportIssueDate &&
        data.passportIssuedBy?.trim() &&
        data.citizenship?.trim() &&
        data.phone?.trim() &&
        data.directionId
      );

      console.log("Проверка полноты профиля:", {
        firstName: !!data.firstName?.trim(),
        lastName: !!data.lastName?.trim(),
        birthDate: !!data.birthDate,
        passportNumber: !!data.passportNumber?.trim(),
        passportIssueDate: !!data.passportIssueDate,
        passportIssuedBy: !!data.passportIssuedBy?.trim(),
        citizenship: !!data.citizenship?.trim(),
        phone: !!data.phone?.trim(),
        directionId: !!data.directionId,
        isComplete,
      });

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
      
      const updatedProfile = response as unknown as ApplicantProfile;
      console.log("Профиль успешно обновлен:", updatedProfile);
      
      // Очищаем localStorage после успешного обновления
      profileApi.clearLocalStorage();
      
      return updatedProfile;
    } catch (error) {
      console.error("Ошибка при обновлении профиля:", error);
      
      if (error instanceof Error) {
        console.error("Детали ошибки обновления:", {
          message: error.message,
          name: error.name,
          stack: error.stack,
        });
      }
      
      throw error;
    }
  },

  deleteProfile: async (profileId: string): Promise<boolean> => {
    try {
      if (!profileId) {
        throw new Error("Не указан ID профиля");
      }

      console.log(`Удаление профиля ${profileId}`);

      await databases.deleteDocument(
        appwriteConfig.databaseId,
        appwriteConfig.collections.applicantProfiles,
        profileId
      );
      
      console.log("Профиль успешно удален");
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
      if (!userId) {
        console.warn("getApplicantWithProfile: пустой userId");
        return null;
      }

      console.log(`Получение абитуриента с профилем для пользователя ${userId}`);

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

      const result = {
        ...user,
        profile,
        direction: direction || undefined,
        institute: direction?.institute || undefined,
      };

      console.log("Абитуриент с профилем загружен:", result);
      return result;
    } catch (error) {
      console.error("Ошибка при получении абитуриента с профилем:", error);
      return null;
    }
  },

  getAllApplicantsWithProfiles: async (): Promise<ApplicantWithProfile[]> => {
    try {
      console.log("Получение всех абитуриентов с профилями");

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
      const result = users.map(user => {
        const profile = profileMap.get(user.$id);
        const direction = profile ? directionMap.get(profile.directionId) : undefined;

        return {
          ...user,
          profile,
          direction,
          institute: direction?.institute,
        };
      });

      console.log(`Загружено ${result.length} абитуриентов с профилями`);
      return result;
    } catch (error) {
      console.error("Ошибка при получении абитуриентов с профилями:", error);
      return [];
    }
  },

  // === СТАТИСТИКА ===

  getProfileStats: async () => {
    try {
      console.log("Получение статистики профилей");

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

      const stats = {
        total: profiles.length,
        complete,
        incomplete,
        completionRate: profiles.length > 0 ? (complete / profiles.length) * 100 : 0,
        directionStats: Array.from(directionStats.entries()).map(([directionId, count]) => ({
          directionId,
          count,
        })),
      };

      console.log("Статистика профилей:", stats);
      return stats;
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

  validateProfileData: (data: Partial<UpdateApplicantProfileDto>): string[] => {
    const errors: string[] = [];

    console.log("Валидация данных профиля:", data);

    if (data.firstName && data.firstName.trim().length < 2) {
      errors.push("ИМЯ ДОЛЖНО СОДЕРЖАТЬ МИНИМУМ 2 СИМВОЛА");
    }

    if (data.lastName && data.lastName.trim().length < 2) {
      errors.push("ФАМИЛИЯ ДОЛЖНА СОДЕРЖАТЬ МИНИМУМ 2 СИМВОЛА");
    }

    if (data.passportNumber) {
      // Проверка формата кыргызского паспорта: AN1234567 (2 буквы + 7 цифр)
      const kgPassportRegex = /^[A-Z]{2}\d{7}$/;
      // Проверка формата российского паспорта: 1234 567890 (4 цифры пробел 6 цифр)
      const ruPassportRegex = /^\d{4}\s\d{6}$/;
      
      if (!kgPassportRegex.test(data.passportNumber.replace(/\s/g, '')) && 
          !ruPassportRegex.test(data.passportNumber)) {
        errors.push("НЕВЕРНЫЙ ФОРМАТ НОМЕРА ПАСПОРТА (КЫРГЫЗСКИЙ: AN1234567, РОССИЙСКИЙ: 1234 567890)");
      }
    }

   
    if (data.birthDate) {
      const birthDate = new Date(data.birthDate);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      
      if (age < 14 || age > 100) {
        errors.push("НЕКОРРЕКТНАЯ ДАТА РОЖДЕНИЯ (ВОЗРАСТ ДОЛЖЕН БЫТЬ ОТ 14 ДО 100 ЛЕТ)");
      }
      
      if (birthDate > today) {
        errors.push("ДАТА РОЖДЕНИЯ НЕ МОЖЕТ БЫТЬ В БУДУЩЕМ");
      }
    }

    if (data.passportIssueDate) {
      const issueDate = new Date(data.passportIssueDate);
      const today = new Date();
      
      if (issueDate > today) {
        errors.push("ДАТА ВЫДАЧИ ПАСПОРТА НЕ МОЖЕТ БЫТЬ В БУДУЩЕМ");
      }
      
      // Проверяем, что паспорт выдан после даты рождения
      if (data.birthDate) {
        const birthDate = new Date(data.birthDate);
        const minIssueDate = new Date(birthDate);
        minIssueDate.setFullYear(birthDate.getFullYear() + 14); // Минимальный возраст для получения паспорта
        
        if (issueDate < minIssueDate) {
          errors.push("ДАТА ВЫДАЧИ ПАСПОРТА НЕКОРРЕКТНА (СЛИШКОМ РАННЯЯ)");
        }
      }
    }

    if (data.passportIssuedBy && data.passportIssuedBy.trim().length < 10) {
      errors.push("НАЗВАНИЕ ОРГАНА, ВЫДАВШЕГО ПАСПОРТ, СЛИШКОМ КОРОТКОЕ");
    }

    console.log("Результат валидации:", errors.length === 0 ? "УСПЕШНО" : errors);
    return errors;
  },

  // === УТИЛИТЫ ===

  formatPhoneNumber: (phone: string): string => {
    
    
   
    
    
    
    return phone; // Возвращаем как есть, если не удалось отформатировать
},

  formatPassportNumber: (passport: string): string => {
    // Убираем пробелы
    const clean = passport.replace(/\s/g, '');
    
    // Кыргызский паспорт: AN1234567 -> AN 1234567
    if (/^[A-Z]{2}\d{7}$/.test(clean)) {
      return `${clean.slice(0, 2)} ${clean.slice(2)}`;
    }
    
    // Российский паспорт: 1234567890 -> 1234 567890
    if (/^\d{10}$/.test(clean)) {
      return `${clean.slice(0, 4)} ${clean.slice(4)}`;
    }
    
    return passport; // Возвращаем как есть
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
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

export const useProfile = (profileId: string) => {
  return useQuery({
    queryKey: profileKeys.detail(profileId),
    queryFn: () => profileApi.getProfileById(profileId),
    enabled: !!profileId,
    retry: 3,
  });
};

export const useApplicantWithProfile = (userId: string) => {
  return useQuery({
    queryKey: [...profileKeys.byUser(userId), "with-details"],
    queryFn: () => profileApi.getApplicantWithProfile(userId),
    enabled: !!userId,
    retry: 3,
  });
};

export const useAllApplicantsWithProfiles = () => {
  return useQuery({
    queryKey: profileKeys.list("all-with-details"),
    queryFn: profileApi.getAllApplicantsWithProfiles,
    retry: 2,
  });
};

export const useCreateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, directionId }: { userId: string; directionId: string }) =>
      profileApi.createProfile(userId, directionId),
    onSuccess: (newProfile) => {
      console.log("Профиль создан, обновляем кэш");
      queryClient.invalidateQueries({ queryKey: profileKeys.byUser(newProfile.userId) });
      queryClient.invalidateQueries({ queryKey: profileKeys.lists() });
      queryClient.invalidateQueries({ queryKey: profileKeys.stats() });
    },
    onError: (error, variables) => {
      console.error("Ошибка создания профиля:", error);
      // Сохраняем данные в localStorage для восстановления
      const formData: UpdateApplicantProfileDto = {
        firstName: "",
        lastName: "",
        middleName: "",
        birthDate: "",
        passportNumber: "",
        passportIssueDate: "",
        passportIssuedBy: "",
        citizenship: "Кыргызская Республика",
        phone: "",
        directionId: variables.directionId,
      };
      profileApi.saveToLocalStorage(formData, variables.userId);
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
    onMutate: async ({ profileId, data }) => {
      console.log("Начало мутации обновления профиля");
      // Сохраняем данные в localStorage на случай ошибки
      profileApi.saveToLocalStorage(data, profileId);
    },
    onSuccess: (updatedProfile, { profileId }) => {
      console.log("Профиль обновлен, обновляем кэш");
      queryClient.invalidateQueries({ queryKey: profileKeys.detail(profileId) });
      queryClient.invalidateQueries({ queryKey: profileKeys.byUser(updatedProfile.userId) });
      queryClient.invalidateQueries({ queryKey: profileKeys.lists() });
      queryClient.invalidateQueries({ queryKey: profileKeys.stats() });
      
      // Очищаем localStorage после успешного обновления
      profileApi.clearLocalStorage();
    },
    onError: (error, { data, profileId }) => {
      console.error("Ошибка обновления профиля:", error);
      // Данные уже сохранены в onMutate, просто логируем
      console.log("Данные сохранены в localStorage для восстановления");
    },
  });
};

export const useDeleteProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (profileId: string) => profileApi.deleteProfile(profileId),
    onSuccess: () => {
      console.log("Профиль удален, обновляем кэш");
      queryClient.invalidateQueries({ queryKey: profileKeys.lists() });
      queryClient.invalidateQueries({ queryKey: profileKeys.stats() });
      
      // Очищаем localStorage
      profileApi.clearLocalStorage();
    },
    onError: (error) => {
      console.error("Ошибка удаления профиля:", error);
    },
  });
};

export const useProfileStats = () => {
  return useQuery({
    queryKey: profileKeys.stats(),
    queryFn: profileApi.getProfileStats,
    retry: 2,
  });
};