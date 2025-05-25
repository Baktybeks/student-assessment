// src/services/authService.ts

import { appwriteConfig } from "@/constants/appwriteConfig";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Client, Account, ID, Databases, Query } from "appwrite";
import { User, UserRole } from "@/types";
import { toast } from "react-toastify";

const {
  projectId: PROJECT_ID,
  endpoint: ENDPOINT,
  databaseId: DATABASE_ID,
  collections,
} = appwriteConfig;

export type GetUserResult = User | { notActivated: true } | null;

const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID);
const account = new Account(client);
const database = new Databases(client);

export const authApi = {
  getCurrentUser: async (): Promise<User | null | { notActivated: true }> => {
    try {
      console.log("Получаем текущую сессию пользователя...");
      let session;
      try {
        session = await account.get();
      } catch (err: any) {
        if (err.code === 401) {
          console.log("Пользователь не авторизован (гость)");
          return null;
        }
        throw err;
      }

      if (!session) {
        console.log("Сессия не найдена");
        return null;
      }

      const users = await database.listDocuments(
        DATABASE_ID,
        collections.users,
        [Query.equal("email", session.email)]
      );

      if (users.documents.length === 0) {
        console.log("Информация о пользователе не найдена в базе данных");
        return null;
      }

      const userData = users.documents[0];

      // Проверяем заблокирован ли пользователь
      if (userData.isBlocked) {
        await account.deleteSession("current");
        throw new Error("Ваш аккаунт заблокирован администратором.");
      }

      if (!userData.isActive && userData.role !== UserRole.ADMIN) {
        console.log("Пользователь не активирован");
        return { notActivated: true };
      }

      console.log("Пользователь найден:", userData.name);
      return userData as unknown as User;
    } catch (error) {
      console.error("Ошибка при получении текущего пользователя:", error);
      return null;
    }
  },

  register: async (
    name: string,
    email: string,
    password: string,
    role?: UserRole,
    directionId?: string
  ): Promise<User> => {
    try {
      console.log(`Регистрация пользователя: ${email}...`);

      // Проверяем, есть ли администраторы в системе
      const adminCheck = await database.listDocuments(
        DATABASE_ID,
        collections.users,
        [Query.equal("role", UserRole.ADMIN)]
      );

      const finalRole =
        adminCheck.total === 0 ? UserRole.ADMIN : role || UserRole.APPLICANT;

      // Создаем пользователя в Appwrite Auth
      const authUser = await account.create(ID.unique(), email, password, name);

      // Создаем документ пользователя в базе данных
      const userData = {
        name,
        email,
        role: finalRole,
        isActive: finalRole === UserRole.ADMIN ? true : false,
        isBlocked: false,
        createdAt: new Date().toISOString(),
      };

      const user = await database.createDocument(
        DATABASE_ID,
        collections.users,
        authUser.$id,
        userData
      );

      // Если это абитуриент и указано направление, создаем профиль
      if (finalRole === UserRole.APPLICANT && directionId) {
        try {
          await database.createDocument(
            DATABASE_ID,
            collections.applicantProfiles,
            ID.unique(),
            {
              userId: user.$id,
              firstName: "",
              lastName: "",
              birthDate: new Date().toISOString(),
              passportNumber: "",
              passportIssueDate: new Date().toISOString(),
              passportIssuedBy: "",
              citizenship: "Российская Федерация",
              phone: "",
              directionId,
              isProfileComplete: false,
              createdAt: new Date().toISOString(),
            }
          );
        } catch (profileError) {
          console.error(
            "Ошибка при создании профиля абитуриента:",
            profileError
          );
        }
      }

      console.log("Пользователь успешно зарегистрирован:", user.$id);
      if (finalRole === UserRole.ADMIN) {
        console.log(
          "Пользователь назначен Администратором (первый пользователь в системе)"
        );
      }
      return user as unknown as User;
    } catch (error) {
      console.error("Ошибка при регистрации пользователя:", error);
      throw error;
    }
  },

  login: async (email: string, password: string): Promise<User> => {
    try {
      console.log(`Вход пользователя: ${email}...`);

      // Проверяем существующую сессию
      let existingUser = null;
      try {
        existingUser = await authApi.getCurrentUser();
      } catch (e) {
        // Продолжаем, если ошибка
      }

      // Если сессия существует, удаляем её
      if (existingUser) {
        await account.deleteSession("current");
      }

      // Создаем новую сессию
      await account.createEmailPasswordSession(email, password);

      // Проверяем данные пользователя
      const userResult = await authApi.getCurrentUser();

      // Обработка неактивированного пользователя
      if (
        userResult &&
        typeof userResult === "object" &&
        "notActivated" in userResult
      ) {
        await account.deleteSession("current");
        throw new Error(
          "Ваш аккаунт ожидает активации администратором или куратором."
        );
      }

      if (!userResult) {
        throw new Error("Не удалось получить данные пользователя");
      }
      return userResult as User;
    } catch (error: any) {
      if (
        error.message &&
        error.message.includes(
          "Creation of a session is prohibited when a session is active"
        )
      ) {
        console.error("Обнаружена активная сессия");

        const currentUser = await authApi.getCurrentUser();
        if (
          currentUser &&
          typeof currentUser === "object" &&
          "notActivated" in currentUser
        ) {
          throw new Error(
            "Ваш аккаунт ожидает активации администратором или куратором."
          );
        }
      }
      console.error("Ошибка при входе в систему:", error);
      throw error;
    }
  },

  logout: async (): Promise<boolean> => {
    try {
      console.log("Выход из системы...");
      await account.deleteSession("current");
      console.log("Сессия успешно удалена");
      return true;
    } catch (error) {
      console.error("Ошибка при выходе из системы:", error);
      throw error;
    }
  },

  activateUser: async (userId: string): Promise<User> => {
    try {
      console.log(`Активация пользователя с ID: ${userId}...`);
      const user = await database.updateDocument(
        DATABASE_ID,
        collections.users,
        userId,
        { isActive: true }
      );
      console.log("Пользователь успешно активирован");
      return user as unknown as User;
    } catch (error) {
      console.error("Ошибка при активации пользователя:", error);
      throw error;
    }
  },

  deactivateUser: async (userId: string): Promise<User> => {
    try {
      console.log(`Деактивация пользователя с ID: ${userId}...`);
      const user = await database.updateDocument(
        DATABASE_ID,
        collections.users,
        userId,
        { isActive: false }
      );
      console.log("Пользователь успешно деактивирован");
      return user as unknown as User;
    } catch (error) {
      console.error("Ошибка при деактивации пользователя:", error);
      throw error;
    }
  },

  blockUser: async (userId: string): Promise<User> => {
    try {
      console.log(`Блокировка пользователя с ID: ${userId}...`);
      const user = await database.updateDocument(
        DATABASE_ID,
        collections.users,
        userId,
        { isBlocked: true, isActive: false }
      );
      console.log("Пользователь успешно заблокирован");
      return user as unknown as User;
    } catch (error) {
      console.error("Ошибка при блокировке пользователя:", error);
      throw error;
    }
  },

  unblockUser: async (userId: string): Promise<User> => {
    try {
      console.log(`Разблокировка пользователя с ID: ${userId}...`);
      const user = await database.updateDocument(
        DATABASE_ID,
        collections.users,
        userId,
        { isBlocked: false }
      );
      console.log("Пользователь успешно разблокирован");
      return user as unknown as User;
    } catch (error) {
      console.error("Ошибка при разблокировке пользователя:", error);
      throw error;
    }
  },

  createUser: async (
    name: string,
    email: string,
    password: string,
    role: UserRole,
    createdBy: string
  ): Promise<User> => {
    try {
      console.log(`Создание пользователя: ${email} с ролью ${role}...`);

      // Создаем пользователя в Appwrite Auth
      const authUser = await account.create(ID.unique(), email, password, name);

      // Создаем документ пользователя в базе данных
      const userData = {
        name,
        email,
        role,
        isActive: false,
        isBlocked: false,
        createdAt: new Date().toISOString(),
        createdBy,
      };

      const user = await database.createDocument(
        DATABASE_ID,
        collections.users,
        authUser.$id,
        userData
      );

      console.log("Пользователь успешно создан:", user.$id);
      return user as unknown as User;
    } catch (error) {
      console.error("Ошибка при создании пользователя:", error);
      throw error;
    }
  },

  updateUserRole: async (userId: string, role: UserRole): Promise<User> => {
    try {
      console.log(`Обновление роли пользователя ${userId} на ${role}...`);
      const user = await database.updateDocument(
        DATABASE_ID,
        collections.users,
        userId,
        { role }
      );
      console.log("Роль пользователя успешно обновлена");
      return user as unknown as User;
    } catch (error) {
      console.error("Ошибка при обновлении роли пользователя:", error);
      throw error;
    }
  },

  deleteUser: async (userId: string): Promise<boolean> => {
    try {
      console.log(`Удаление пользователя с ID: ${userId}...`);
      await database.deleteDocument(DATABASE_ID, collections.users, userId);
      console.log("Пользователь успешно удален");
      return true;
    } catch (error) {
      console.error("Ошибка при удалении пользователя:", error);
      throw error;
    }
  },
};

// Ключи для React Query
export const authKeys = {
  all: ["auth"] as const,
  user: () => [...authKeys.all, "user"] as const,
  users: () => [...authKeys.all, "users"] as const,
  pendingUsers: () => [...authKeys.all, "pending"] as const,
  usersByRole: (role: UserRole) => [...authKeys.users(), role] as const,
};

// React Query хуки
export const useCurrentUser = () => {
  return useQuery<GetUserResult>({
    queryKey: authKeys.user(),
    queryFn: authApi.getCurrentUser,
    staleTime: 1000 * 60 * 5, // 5 минут
  });
};

export const useRegister = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      name,
      email,
      password,
      role,
      directionId,
    }: {
      name: string;
      email: string;
      password: string;
      role?: UserRole;
      directionId?: string;
    }) => authApi.register(name, email, password, role, directionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.users() });
    },
  });
};

export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authApi.login(email, password),
    onSuccess: (data) => {
      queryClient.setQueryData(authKeys.user(), data);
    },
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      queryClient.setQueryData(authKeys.user(), null);
      queryClient.clear();
    },
  });
};

export const useActivateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => authApi.activateUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.users() });
      queryClient.invalidateQueries({ queryKey: authKeys.pendingUsers() });
    },
  });
};

export const useDeactivateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => authApi.deactivateUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.users() });
    },
  });
};

export const useBlockUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => authApi.blockUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.users() });
    },
  });
};

export const useUnblockUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => authApi.unblockUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.users() });
    },
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      name,
      email,
      password,
      role,
      createdBy,
    }: {
      name: string;
      email: string;
      password: string;
      role: UserRole;
      createdBy: string;
    }) => authApi.createUser(name, email, password, role, createdBy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.users() });
      queryClient.invalidateQueries({ queryKey: authKeys.pendingUsers() });
    },
  });
};

// Хук для получения списка неактивированных пользователей
export const usePendingUsers = () => {
  return useQuery({
    queryKey: authKeys.pendingUsers(),
    queryFn: async () => {
      try {
        const result = await database.listDocuments(
          DATABASE_ID,
          collections.users,
          [Query.equal("isActive", false), Query.equal("isBlocked", false)]
        );
        console.log(
          "Результат запроса неактивированных пользователей:",
          result
        );
        return result.documents as unknown as User[];
      } catch (error) {
        console.error(
          "Ошибка при получении неактивированных пользователей:",
          error
        );
        return [];
      }
    },
  });
};

// Хуки для получения пользователей по ролям
export const useUsersByRole = (role: UserRole) => {
  return useQuery({
    queryKey: authKeys.usersByRole(role),
    queryFn: async () => {
      try {
        const result = await database.listDocuments(
          DATABASE_ID,
          collections.users,
          [Query.equal("role", role), Query.orderAsc("name")]
        );
        return result.documents as unknown as User[];
      } catch (error) {
        console.error(
          `Ошибка при получении пользователей с ролью ${role}:`,
          error
        );
        return [];
      }
    },
  });
};

// Специфичные хуки для конкретных ролей
export const useAdmins = () => useUsersByRole(UserRole.ADMIN);
export const useCurators = () => useUsersByRole(UserRole.CURATOR);
export const useApplicants = () => useUsersByRole(UserRole.APPLICANT);

// Хуки для активных пользователей по ролям
export const useActiveUsersByRole = (role: UserRole) => {
  return useQuery({
    queryKey: [...authKeys.usersByRole(role), "active"],
    queryFn: async () => {
      try {
        const result = await database.listDocuments(
          DATABASE_ID,
          collections.users,
          [
            Query.equal("role", role),
            Query.equal("isActive", true),
            Query.equal("isBlocked", false),
            Query.orderAsc("name"),
          ]
        );
        return result.documents as unknown as User[];
      } catch (error) {
        console.error(
          `Ошибка при получении активных пользователей с ролью ${role}:`,
          error
        );
        return [];
      }
    },
  });
};

export const useActiveCurators = () => useActiveUsersByRole(UserRole.CURATOR);
export const useActiveApplicants = () =>
  useActiveUsersByRole(UserRole.APPLICANT);

// Хук для получения заблокированных пользователей
export const useBlockedUsers = () => {
  return useQuery({
    queryKey: [...authKeys.users(), "blocked"],
    queryFn: async () => {
      try {
        const result = await database.listDocuments(
          DATABASE_ID,
          collections.users,
          [Query.equal("isBlocked", true), Query.orderDesc("$createdAt")]
        );
        return result.documents as unknown as User[];
      } catch (error) {
        console.error(
          "Ошибка при получении заблокированных пользователей:",
          error
        );
        return [];
      }
    },
  });
};

// Хук для получения всех пользователей
export const useAllUsers = () => {
  return useQuery({
    queryKey: authKeys.users(),
    queryFn: async () => {
      try {
        const result = await database.listDocuments(
          DATABASE_ID,
          collections.users,
          [Query.orderDesc("$createdAt")]
        );
        return result.documents as unknown as User[];
      } catch (error) {
        console.error("Ошибка при получении списка пользователей:", error);
        return [];
      }
    },
  });
};

// Хук для поиска пользователей
export const useSearchUsers = (searchTerm: string, role?: UserRole) => {
  return useQuery({
    queryKey: [...authKeys.users(), "search", searchTerm, role],
    queryFn: async () => {
      try {
        const queries = [Query.orderAsc("name")];

        if (role) {
          queries.push(Query.equal("role", role));
        }

        const result = await database.listDocuments(
          DATABASE_ID,
          collections.users,
          queries
        );

        const users = result.documents as unknown as User[];
        const searchLower = searchTerm.toLowerCase();

        return users.filter(
          (user) =>
            user.name.toLowerCase().includes(searchLower) ||
            user.email.toLowerCase().includes(searchLower)
        );
      } catch (error) {
        console.error("Ошибка при поиске пользователей:", error);
        return [];
      }
    },
    enabled: searchTerm.length >= 2, // Запускаем поиск только при введении минимум 2 символов
  });
};
