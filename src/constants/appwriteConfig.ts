// src/constants/appwriteConfig.ts

export const appwriteConfig = {
  endpoint:
    process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1",
  projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "",
  databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "",
  collections: {
    users: process.env.NEXT_PUBLIC_USERS_COLLECTION_ID || "users",
    institutes:
      process.env.NEXT_PUBLIC_INSTITUTES_COLLECTION_ID || "institutes",
    directions:
      process.env.NEXT_PUBLIC_DIRECTIONS_COLLECTION_ID || "directions",
    tests: process.env.NEXT_PUBLIC_TESTS_COLLECTION_ID || "tests",
    questions: process.env.NEXT_PUBLIC_QUESTIONS_COLLECTION_ID || "questions",
    testSessions:
      process.env.NEXT_PUBLIC_TEST_SESSIONS_COLLECTION_ID || "test_sessions",
    testResults:
      process.env.NEXT_PUBLIC_TEST_RESULTS_COLLECTION_ID || "test_results",
    applicantProfiles:
      process.env.NEXT_PUBLIC_APPLICANT_PROFILES_COLLECTION_ID ||
      "applicant_profiles",
    curatorAssignments:
      process.env.NEXT_PUBLIC_CURATOR_ASSIGNMENTS_COLLECTION_ID ||
      "curator_assignments",
  },
} as const;

// Типы для TypeScript
export type CollectionName = keyof typeof appwriteConfig.collections;

// Валидация переменных окружения
const requiredEnvVars = [
  "NEXT_PUBLIC_APPWRITE_ENDPOINT",
  "NEXT_PUBLIC_APPWRITE_PROJECT_ID",
  "NEXT_PUBLIC_APPWRITE_DATABASE_ID",
  // Collection IDs
  "NEXT_PUBLIC_USERS_COLLECTION_ID",
  "NEXT_PUBLIC_INSTITUTES_COLLECTION_ID",
  "NEXT_PUBLIC_DIRECTIONS_COLLECTION_ID",
  "NEXT_PUBLIC_TESTS_COLLECTION_ID",
  "NEXT_PUBLIC_QUESTIONS_COLLECTION_ID",
  "NEXT_PUBLIC_TEST_SESSIONS_COLLECTION_ID",
  "NEXT_PUBLIC_TEST_RESULTS_COLLECTION_ID",
  "NEXT_PUBLIC_APPLICANT_PROFILES_COLLECTION_ID",
  "NEXT_PUBLIC_CURATOR_ASSIGNMENTS_COLLECTION_ID",
] as const;

// Проверка отсутствующих переменных
const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.warn(
    `⚠️ Отсутствуют необходимые переменные окружения: ${missingEnvVars.join(
      ", "
    )}`
  );

  if (process.env.NODE_ENV !== "development") {
    console.error(
      "❌ В production режиме все переменные окружения обязательны!"
    );
  }
}

// Функция для получения ID коллекции с валидацией
export const getCollectionId = (collectionName: CollectionName): string => {
  const id = appwriteConfig.collections[collectionName];
  if (!id) {
    throw new Error(`ID коллекции ${collectionName} не найден в конфигурации`);
  }
  return id;
};

// Вспомогательная функция для проверки конфигурации
export const validateAppwriteConfig = (): boolean => {
  const { endpoint, projectId, databaseId } = appwriteConfig;

  if (!endpoint || !projectId || !databaseId) {
    console.error("❌ Основные параметры Appwrite не настроены");
    return false;
  }

  const emptyCollections = Object.entries(appwriteConfig.collections)
    .filter(([_, id]) => !id)
    .map(([name]) => name);

  if (emptyCollections.length > 0) {
    console.error(
      `❌ Не настроены ID коллекций: ${emptyCollections.join(", ")}`
    );
    return false;
  }

  console.log("✅ Конфигурация Appwrite валидна");
  return true;
};

// Экспорт для использования в других частях приложения
export default appwriteConfig;
