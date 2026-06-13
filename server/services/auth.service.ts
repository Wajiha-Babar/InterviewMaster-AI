import { addDays } from "../utils/dates";
import { HttpError } from "../utils/httpError";
import { createId } from "../utils/ids";
import { hashPassword, verifyPassword } from "../utils/passwords";
import { createSessionToken, hashToken } from "../utils/tokens";
import { assertEmail, assertPassword, assertString } from "../utils/validators";
import { repositories } from "../repositories";
import { publicUser } from "../repositories/memory.repository";

export async function signUp(input: { email: unknown; password: unknown; name: unknown }) {
  const email = assertEmail(input.email);
  const password = assertPassword(input.password);
  const name = assertString(input.name, "name", 2, 80);

  const existing = await repositories.users.findByEmail(email);
  if (existing) throw new HttpError(409, "An account with this email already exists.");

  const user = await repositories.users.create({
    id: createId("usr"),
    email,
    name,
    passwordHash: await hashPassword(password),
    preferredMode: "daily",
    streak: 0,
    completedSessionsCount: 0,
    createdAt: new Date().toISOString(),
  });

  return createAuthResponse(user.id, publicUser(user));
}

export async function signIn(input: { email: unknown; password: unknown }) {
  const email = assertEmail(input.email);
  const password = assertString(input.password, "password", 1, 128);
  const user = await repositories.users.findByEmail(email);

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    throw new HttpError(401, "Invalid email or password.");
  }

  return createAuthResponse(user.id, publicUser(user));
}

export async function updateProfile(userId: string, input: Record<string, unknown>) {
  return repositories.profiles.updateProfile(userId, {
    targetRole: assertString(input.targetRole, "targetRole", 2, 100),
    experienceLevel: assertString(input.experienceLevel, "experienceLevel", 2, 80),
    dreamCompany: typeof input.dreamCompany === "string" ? input.dreamCompany.trim().slice(0, 100) : "",
    interviewDate: typeof input.interviewDate === "string" ? input.interviewDate.trim().slice(0, 80) : "",
    preferredMode: input.preferredMode === "mock" || input.preferredMode === "coding" || input.preferredMode === "behavioral" ? input.preferredMode : "daily",
  });
}

async function createAuthResponse(userId: string, user: ReturnType<typeof publicUser>) {
  const token = createSessionToken();
  const expiresAt = addDays(new Date(), 7).toISOString();
  await repositories.sessions.create({
    id: createId("ses"),
    userId,
    tokenHash: hashToken(token),
    createdAt: new Date().toISOString(),
    expiresAt,
  });

  return { token, expiresAt, user };
}
