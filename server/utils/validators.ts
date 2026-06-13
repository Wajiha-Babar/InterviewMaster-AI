import { HttpError } from "./httpError";

export function assertString(value: unknown, field: string, min = 1, max = 5000) {
  if (typeof value !== "string" || value.trim().length < min || value.length > max) {
    throw new HttpError(400, `${field} must be between ${min} and ${max} characters.`);
  }
  return value.trim();
}

export function assertEmail(value: unknown) {
  const email = assertString(value, "email", 5, 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new HttpError(400, "Enter a valid email address.");
  }
  return email;
}

export function assertPassword(value: unknown) {
  const password = assertString(value, "password", 8, 128);
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    throw new HttpError(400, "Password must be at least 8 characters and include a letter and a number.");
  }
  return password;
}
