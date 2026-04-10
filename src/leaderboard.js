export const LEADERBOARD_LIMIT = 10;

export function normalizePlayerName(name) {
  return String(name ?? "").trim().replace(/\s+/g, " ").slice(0, 16);
}

export function upsertLeaderboard(entries, candidate) {
  const name = normalizePlayerName(candidate?.name);
  const score = Number(candidate?.score ?? 0);
  const updatedAt = Number(candidate?.updatedAt ?? 0);

  if (!name || !Number.isFinite(score) || score < 0) {
    return sanitizeEntries(entries);
  }

  const current = sanitizeEntries(entries);
  const index = current.findIndex((entry) => entry.name.toLowerCase() === name.toLowerCase());

  if (index === -1) {
    return sortEntries([...current, { name, score, updatedAt }]).slice(0, LEADERBOARD_LIMIT);
  }

  const existing = current[index];
  const next = {
    name: existing.name,
    score: Math.max(existing.score, score),
    updatedAt: score > existing.score ? updatedAt : existing.updatedAt
  };

  const merged = [...current];
  merged[index] = next;
  return sortEntries(merged).slice(0, LEADERBOARD_LIMIT);
}

export function getPlayerRank(entries, name) {
  const normalized = normalizePlayerName(name);
  if (!normalized) {
    return null;
  }

  const current = sortEntries(sanitizeEntries(entries));
  const index = current.findIndex((entry) => entry.name.toLowerCase() === normalized.toLowerCase());
  return index === -1 ? null : index + 1;
}

export function getPlayerBest(entries, name) {
  const normalized = normalizePlayerName(name);
  if (!normalized) {
    return 0;
  }

  const current = sanitizeEntries(entries);
  const entry = current.find((item) => item.name.toLowerCase() === normalized.toLowerCase());
  return entry?.score ?? 0;
}

export function sanitizeEntries(entries) {
  if (!Array.isArray(entries)) {
    return [];
  }

  return entries
    .map((entry) => ({
      name: normalizePlayerName(entry?.name),
      score: Number(entry?.score ?? 0),
      updatedAt: Number(entry?.updatedAt ?? 0)
    }))
    .filter((entry) => entry.name && Number.isFinite(entry.score) && entry.score >= 0);
}

function sortEntries(entries) {
  return [...entries].sort((left, right) => {
    if (right.score !== left.score) {
      return right.score - left.score;
    }

    if (left.updatedAt !== right.updatedAt) {
      return left.updatedAt - right.updatedAt;
    }

    return left.name.localeCompare(right.name);
  });
}
