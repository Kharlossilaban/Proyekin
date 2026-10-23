export type Role = "OWNER" | "ADMIN" | "MANDOR" | "ANGGOTA" | "GUEST";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
  projectAccess?: string[];
}

export interface Project {
  id: string;
  code: string;
  name: string;
  description: string;
  status: ProjectStatus;
  startDate: string;
  endDate: string;
  budget: number;
  progress: number;
  client: string;
  location: string;
  managerId?: string;
}

export type ProjectStatus = "DRAFT" | "ON_PROGRESS" | "PAUSED" | "COMPLETED" | "ARCHIVED";

export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH";

export interface Task {
  id: string;
  code: string;
  projectId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: string;
  assigneeName?: string;
  dueDate?: string;
  startDate?: string;
  progress: number;
}

export type ReportStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED";

export interface DailyReport {
  id: string;
  projectId: string;
  projectCode: string;
  foremanId: string;
  foremanName: string;
  date: string;
  weather: string;
  workersCount: number;
  workDone: string;
  problems: string;
  materials: string;
  photos?: string[];
  attachments?: Document[];
  status: ReportStatus;
  submittedAt?: string;
}

export type DocumentCategory = "GAMBAR_TEKNIS" | "RENCANA_KERJA" | "KONTRAK" | "SURAT menyurat" | "LAINNYA";
export type DocumentStatus = "PUBLIK" | "PRIVAT" | "ARKIP";

export interface Document {
  id: string;
  projectId: string;
  name: string;
  filename: string;
  category: DocumentCategory;
  size: number;
  uploadedBy: string;
  uploadedAt: string;
  status: DocumentStatus;
  version: number;
  type?: "image" | "pdf" | "other";
}

export interface TeamMember {
  id: string;
  projectId: string;
  userId: string;
  name: string;
  role: string;
  email: string;
  assignedTasks: string[];
}

export interface StatCard {
  title: string;
  value: string | number;
  trend?: number;
  trendLabel?: string;
  icon: React.ReactNode;
  color: string;
}
