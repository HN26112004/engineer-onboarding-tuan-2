// src/ticket-service.ts
import { randomUUID } from 'node:crypto';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH';
export type Status = 'OPEN' | 'IN_PROGRESS' | 'DONE';

export interface Ticket {
  id: string;
  title: string;
  status: Status;
  priority: Priority;
  createdAt: string;
}

export interface TicketInput {
  title: string;
  priority?: Priority;
}

function sanitizeAndValidateTitle(title?: string): string {
  const trimmed = title?.trim();
  if (!trimmed) {
    throw new Error('Title is required');
  }
  return trimmed;
}

export function validateAndCreateTicket(input: TicketInput): Ticket {
  return {
    id: randomUUID(),
    title: sanitizeAndValidateTitle(input.title),
    status: 'OPEN',
    priority: input.priority ?? 'MEDIUM',
    createdAt: new Date().toISOString(),
  };
}