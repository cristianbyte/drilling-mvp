const DEFAULT_LOCALE = "es-CO";
const DATE_KEY_LOCALE = "sv-SE";

export function getBrowserTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

export function getDateKey(
  value = Date.now(),
  timeZone = getBrowserTimeZone(),
) {
  return new Intl.DateTimeFormat(DATE_KEY_LOCALE, {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

export function getTodayDateKey(timeZone = getBrowserTimeZone()) {
  return getDateKey(Date.now(), timeZone);
}

export function formatTime(
  value,
  timeZone = getBrowserTimeZone(),
  locale = DEFAULT_LOCALE,
  options = {},
) {
  if (!value) return "-";

  return new Date(value).toLocaleTimeString(locale, {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    ...options,
  });
}

export function formatDateOnly(
  value,
  timeZone = getBrowserTimeZone(),
  locale = DEFAULT_LOCALE,
) {
  if (!value) return "";
  return new Date(value).toLocaleDateString(locale, { timeZone });
}

export function formatDateTime(
  value,
  timeZone = getBrowserTimeZone(),
  locale = DEFAULT_LOCALE,
) {
  if (!value) return "";

  return new Date(value).toLocaleString(locale, {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}
