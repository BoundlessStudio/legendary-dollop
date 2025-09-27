export const extractString = (value: unknown): string | undefined => {
  if (typeof value === 'string') {
    return value;
  }

  if (Array.isArray(value)) {
    for (const entry of value) {
      if (typeof entry === 'string') {
        return entry;
      }
    }
  }

  return undefined;
};

export const extractNumber = (value: unknown): number | undefined => {
  const candidate = extractString(value);
  if (!candidate) {
    return undefined;
  }

  const parsed = Number(candidate);
  return Number.isNaN(parsed) ? undefined : parsed;
};

export const extractStringArray = (value: unknown): string[] | undefined => {
  if (Array.isArray(value)) {
    const result = value.filter((entry): entry is string => typeof entry === 'string');
    return result.length > 0 ? result : undefined;
  }

  if (typeof value === 'string' && value.length > 0) {
    return [value];
  }

  return undefined;
};
