export type UserSnapshot = {
  nickname?: string;
  email?: string;
  credits?: number;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function pickFirst(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null) {
      return record[key];
    }
  }
  return undefined;
}

function parseNumberish(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const cleaned = value.replace(/[^0-9.-]/g, "");
    if (!cleaned) return undefined;
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  const objectValue = asRecord(value);
  if (objectValue) {
    const nested =
      pickFirst(objectValue, [
        "value",
        "amount",
        "credit",
        "credits",
        "currentCredit",
        "currentCredits",
        "balance",
      ]) ?? undefined;
    if (nested !== undefined) {
      return parseNumberish(nested);
    }
  }

  return undefined;
}

function parseText(value: unknown) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

export function parseUserSnapshot(raw: unknown): UserSnapshot {
  const top = asRecord(raw) ?? {};
  const payload =
    asRecord(top.data) ?? asRecord(top.result) ?? asRecord(raw) ?? {};

  const nickname = parseText(
    pickFirst(payload, [
      "nickname",
      "nickName",
      "name",
      "userName",
      "username",
    ]),
  );
  const email = parseText(
    pickFirst(payload, ["email", "mail", "userEmail", "accountEmail"]),
  );
  const credits = parseNumberish(
    pickFirst(payload, [
      "credits",
      "credit",
      "currentCredit",
      "currentCredits",
      "availableCredit",
      "remainingCredit",
      "balance",
      "point",
      "points",
    ]),
  );

  return {
    nickname,
    email,
    credits,
  };
}
