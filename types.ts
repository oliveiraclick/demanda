
export enum Priority {
  HIGH = 'ALTA',
  MEDIUM = 'MÉDIA',
  LOW = 'BAIXA'
}

export enum Status {
  OPEN = 'ABERTO',
  QUEUED = 'EM FILA',
  IN_PROGRESS = 'EM ATENDIMENTO',
  AWAITING_MATERIAL = 'AGUARDANDO MATERIAL',
  BLOCKED = 'BLOQUEADO',
  FINALIZED = 'FINALIZADO'
}

export enum Category {
  ELECTRICAL = 'Elétrica',
  PLUMBING = 'Hidráulica',
  CIVIL = 'Civil',
  CLEANING = 'Limpeza',
  GARDENING = 'Jardinagem',
  SECURITY = 'Segurança'
}

export interface HistoryEntry {
  timestamp: Date;
  action: string;
  user: string;
  comment?: string;
}

export interface Ticket {
  id: string;
  title: string;
  category: Category;
  location: string;
  priority: Priority;
  description: string;
  photoOpen: string;
  photoClose?: string;
  requester: string;
  assignedTo?: string;
  supervisor?: string;
  createdAt: Date;
  startedAt?: Date;
  finishedAt?: Date;
  slaLimit: Date;
  status: Status;
  materials: string[];
  history: HistoryEntry[];
  technicalNote?: string;
}

export interface User {
  id: string;
  name: string;
  role: 'ADMIN' | 'SUPERVISOR' | 'WORKER' | 'REQUESTER';
}
