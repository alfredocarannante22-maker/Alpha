export type UserRole = 'husband' | 'wife';

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  partnerId?: string;
  partnerEmail?: string;
  photoURL?: string;
  coupleId?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: string; // ISO string
  endDate?: string;
  allDay: boolean;
  color: string;
  category: EventCategory;
  createdBy: string; // uid
  createdByName: string;
  coupleId: string;
  location?: string;
  reminder?: number; // minutes before
  createdAt: string;
  updatedAt: string;
}

export type EventCategory =
  | 'personal'
  | 'work'
  | 'family'
  | 'health'
  | 'travel'
  | 'birthday'
  | 'anniversary'
  | 'other';

export interface Note {
  id: string;
  title: string;
  content: string;
  color: string;
  createdBy: string; // uid — solo chi l'ha creata può vederla
  coupleId: string;
  tags: string[];
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  date: string; // ISO string
  isRecurring: boolean;
  recurringInterval?: RecurringInterval;
  recurringEndDate?: string;
  paidBy: string; // uid
  paidByName: string;
  splitBetween: boolean;
  notes?: string;
  coupleId: string;
  createdAt: string;
  updatedAt: string;
}

export type ExpenseCategory =
  | 'food'
  | 'housing'
  | 'transport'
  | 'health'
  | 'entertainment'
  | 'clothing'
  | 'education'
  | 'utilities'
  | 'subscriptions'
  | 'other';

export type RecurringInterval = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface TodoList {
  id: string;
  title: string;
  emoji: string;
  color: string;
  coupleId: string;
  createdBy: string;
  isShared: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TodoItem {
  id: string;
  listId: string;
  text: string;
  isCompleted: boolean;
  completedBy?: string;
  assignedTo?: string; // uid
  coupleId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
