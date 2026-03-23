import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Replaces any non-alphanumeric characters with underscores for safe filenames. */
export function createSafeFilename(name: string): string {
  return name.replace(/[^a-z0-9]/gi, '_')
}
