// src/utils/dateUtils.ts

/**
 * Форматирует дату для отображения в локальном времени
 */
export const formatLocalDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const dateOptions: Intl.DateTimeFormatOptions = {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  };

  const timeOptions: Intl.DateTimeFormatOptions = {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
  };

  return (
    date.toLocaleDateString("ru-RU", dateOptions) +
    " " +
    date.toLocaleTimeString("ru-RU", timeOptions)
  );
};

/**
 * Форматирует дату для отображения только даты в локальном времени
 */
export const formatLocalDate = (dateString: string): string => {
  const date = new Date(dateString);
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return date.toLocaleDateString("ru-RU", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

/**
 * Конвертирует локальное время из datetime-local в ISO строку
 * с сохранением локального времени (без сдвига в UTC)
 */
export const convertLocalDateTimeToISO = (localDateTime: string): string => {
  const localDate = new Date(localDateTime);
  // Компенсируем автоматический сдвиг в UTC
  return new Date(
    localDate.getTime() - localDate.getTimezoneOffset() * 60000
  ).toISOString();
};

/**
 * Конвертирует ISO строку в формат для datetime-local input
 */
export const convertISOToLocalDateTime = (isoString: string): string => {
  const date = new Date(isoString);
  // Получаем локальное время с учетом часового пояса
  const localDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
};

/**
 * Получает минимальную дату/время для datetime-local input (текущее время)
 */
export const getMinDateTime = (): string => {
  const now = new Date();
  return now.toISOString().slice(0, 16);
};

/**
 * Получает рекомендуемую дату/время (следующий час от текущего времени)
 */
export const getDefaultDateTime = (): string => {
  const now = new Date();
  now.setHours(now.getHours() + 1);
  now.setMinutes(0);
  now.setSeconds(0);
  return now.toISOString().slice(0, 16);
};

/**
 * Проверяет, является ли дата прошедшей
 */
export const isPastDate = (dateString: string): boolean => {
  return new Date(dateString) < new Date();
};

/**
 * Проверяет, является ли дата сегодняшней
 */
export const isToday = (dateString: string): boolean => {
  const date = new Date(dateString);
  const today = new Date();

  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

/**
 * Получает относительное описание даты (сегодня, завтра, вчера, и т.д.)
 */
export const getRelativeDateDescription = (dateString: string): string => {
  const date = new Date(dateString);
  const today = new Date();
  const diffTime = date.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Сегодня";
  if (diffDays === 1) return "Завтра";
  if (diffDays === -1) return "Вчера";
  if (diffDays > 1 && diffDays <= 7) return `Через ${diffDays} дней`;
  if (diffDays < -1 && diffDays >= -7)
    return `${Math.abs(diffDays)} дней назад`;

  return formatLocalDate(dateString);
};
