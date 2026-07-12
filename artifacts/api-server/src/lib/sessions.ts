// Shared in-memory sessions store for admin authentication
const sessions = new Map<string, { deviceId: string; createdAt: Date }>();
const SESSION_DURATION_HOURS = 24;

export { sessions, SESSION_DURATION_HOURS };
