import { CVProfile, PublicUser, SessionRecord, UserRecord } from "../types/domain";

export interface UserRepository {
  create(user: UserRecord): Promise<UserRecord>;
  findByEmail(email: string): Promise<UserRecord | null>;
  findById(id: string): Promise<UserRecord | null>;
  update(id: string, data: Partial<PublicUser>): Promise<PublicUser>;
}

export interface ProfileRepository {
  updateProfile(userId: string, data: Partial<PublicUser>): Promise<PublicUser>;
}

export interface CVRepository {
  save(profile: CVProfile): Promise<CVProfile>;
  findLatestByUserId(userId: string): Promise<CVProfile | null>;
}

export interface SessionRepository {
  create(session: SessionRecord): Promise<SessionRecord>;
  findByTokenHash(tokenHash: string): Promise<SessionRecord | null>;
  deleteByTokenHash(tokenHash: string): Promise<void>;
}

export interface FeedbackRepository {
  save(report: unknown): Promise<unknown>;
}
