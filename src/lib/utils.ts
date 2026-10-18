import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

/** Elige un gajo al azar respetando los pesos de probabilidad. */
export function pickWeighted<T extends { probability: number }>(items: T[], rand = Math.random()): T {
  const total = items.reduce((s, it) => s + Math.max(0, it.probability || 0), 0);
  if (total <= 0) return items[Math.floor(rand * items.length)];
  let target = rand * total;
  for (const it of items) {
    target -= Math.max(0, it.probability || 0);
    if (target < 0) return it;
  }
  return items[items.length - 1];
}
