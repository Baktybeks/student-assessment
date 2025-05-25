// src/services/appwriteClient.ts
import { Client, Databases, Account } from "appwrite";
import { appwriteConfig } from "@/constants/appwriteConfig";

const client = new Client()
  .setEndpoint(appwriteConfig.endpoint)
  .setProject(appwriteConfig.projectId);

export const databases = new Databases(client);
export const account = new Account(client);

export { client };

export const appwriteHelpers = {
  handleAppwriteError: (error: any) => {
    console.error("Appwrite error:", error);

    if (error.code === 401) {
      return new Error("Не авторизован");
    }

    if (error.code === 403) {
      return new Error("Нет доступа");
    }

    if (error.code === 404) {
      return new Error("Не найдено");
    }

    if (error.code === 409) {
      return new Error("Конфликт данных");
    }

    if (error.message) {
      return new Error(error.message);
    }

    return new Error("Произошла ошибка");
  },

  // Проверка подключения к Appwrite
  checkHealth: async () => {
    try {
      await account.get();
      return true;
    } catch (error: unknown) {
      const appwriteError = error as any;
      if (appwriteError.code === 401) {
        try {
          await (client as any).call("GET", "/health");
          return true;
        } catch (healthError: unknown) {
          console.error("Appwrite health check failed:", healthError);
          return false;
        }
      }
      console.error("Appwrite health check failed:", error);
      return false;
    }
  },
};

export default client;
