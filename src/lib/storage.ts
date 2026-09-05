import type { ThemeMode, User, AuditEntry, SavedProfile, IntakeData, LabTest } from "../types";

const KEYS = {
  THEME: "medlens_theme",
  USER: "medlens_user",
  AUDIT: "medlens_audit_log",
  PROFILES: "medlens_profiles",
  INTAKE: "medlens_intake",
  TESTS: "medlens_tests",
} as const;

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

/* Theme */
export function loadTheme(): ThemeMode {
  const stored = localStorage.getItem(KEYS.THEME);
  return stored === "dark" ? "dark" : "light";
}
export function saveTheme(mode: ThemeMode) {
  localStorage.setItem(KEYS.THEME, mode);
}

/* Auth */
export function loadUser(): User | null {
  return read<User | null>(KEYS.USER, null);
}
export function saveUser(user: User | null) {
  if (user) write(KEYS.USER, user);
  else localStorage.removeItem(KEYS.USER);
}

/* Audit Log */
export function loadAuditLog(): AuditEntry[] {
  return read<AuditEntry[]>(KEYS.AUDIT, []);
}
export function saveAuditLog(log: AuditEntry[]) {
  write(KEYS.AUDIT, log);
}
export function addAuditEntry(entry: Omit<AuditEntry, "id" | "timestamp">): AuditEntry[] {
  const log = loadAuditLog();
  const newEntry: AuditEntry = {
    ...entry,
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: Date.now(),
  };
  const updated = [newEntry, ...log].slice(0, 100);
  saveAuditLog(updated);
  return updated;
}

/* Saved profiles */
export function loadProfiles(): SavedProfile[] {
  return read<SavedProfile[]>(KEYS.PROFILES, []);
}
export function saveProfiles(profiles: SavedProfile[]) {
  write(KEYS.PROFILES, profiles);
}

/* Intake + tests persistence */
export function loadIntake(): IntakeData | null {
  return read<IntakeData | null>(KEYS.INTAKE, null);
}
export function saveIntake(intake: IntakeData) {
  write(KEYS.INTAKE, intake);
}
export function loadTests(): LabTest[] | null {
  return read<LabTest[] | null>(KEYS.TESTS, null);
}
export function saveTests(tests: LabTest[]) {
  write(KEYS.TESTS, tests);
}
export function clearSession() {
  localStorage.removeItem(KEYS.INTAKE);
  localStorage.removeItem(KEYS.TESTS);
}
