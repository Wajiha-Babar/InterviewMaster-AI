import { CVProfile, PublicUser, SessionRecord, UserRecord } from "../types/domain";
import { HttpError } from "../utils/httpError";
import { createId } from "../utils/ids";
import { CVRepository, FeedbackRepository, ProfileRepository, SessionRepository, UserRepository } from "./interfaces";

const users = new Map<string, UserRecord>();
const sessions = new Map<string, SessionRecord>();
const cvProfiles = new Map<string, CVProfile[]>();
const feedbackReports: unknown[] = [];

function publicUser(user: UserRecord): PublicUser {
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return safeUser;
}

class MemoryUserRepository implements UserRepository {
  async create(user: UserRecord) {
    users.set(user.id, user);
    return user;
  }

  async findByEmail(email: string) {
    return Array.from(users.values()).find((user) => user.email === email.toLowerCase()) || null;
  }

  async findById(id: string) {
    return users.get(id) || null;
  }

  async update(id: string, data: Partial<PublicUser>) {
    const existing = users.get(id);
    if (!existing) throw new HttpError(404, "User not found.");
    const updated = { ...existing, ...data, id: existing.id, email: existing.email };
    users.set(id, updated);
    return publicUser(updated);
  }
}

class MemoryProfileRepository implements ProfileRepository {
  constructor(private userRepository: UserRepository) {}

  updateProfile(userId: string, data: Partial<PublicUser>) {
    return this.userRepository.update(userId, data);
  }
}

class MemoryCVRepository implements CVRepository {
  async save(profile: CVProfile) {
    const userProfiles = cvProfiles.get(profile.userId || "anonymous") || [];
    const record = { ...profile, id: profile.id || createId("cv") };
    userProfiles.unshift(record);
    cvProfiles.set(profile.userId || "anonymous", userProfiles);
    return record;
  }

  async findLatestByUserId(userId: string) {
    return cvProfiles.get(userId)?.[0] || null;
  }
}

class MemorySessionRepository implements SessionRepository {
  async create(session: SessionRecord) {
    sessions.set(session.tokenHash, session);
    return session;
  }

  async findByTokenHash(tokenHash: string) {
    const session = sessions.get(tokenHash);
    if (!session || new Date(session.expiresAt).getTime() < Date.now()) {
      if (session) sessions.delete(tokenHash);
      return null;
    }
    return session;
  }

  async deleteByTokenHash(tokenHash: string) {
    sessions.delete(tokenHash);
  }
}

class MemoryFeedbackRepository implements FeedbackRepository {
  async save(report: unknown) {
    feedbackReports.push(report);
    return report;
  }
}

const userRepository = new MemoryUserRepository();

export const memoryRepositories = {
  users: userRepository,
  profiles: new MemoryProfileRepository(userRepository),
  cvs: new MemoryCVRepository(),
  sessions: new MemorySessionRepository(),
  feedback: new MemoryFeedbackRepository(),
};

export { publicUser };
