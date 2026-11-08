// src/ticket-service.ts
import { randomUUID } from 'node:crypto';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH';
export type Status = 'OPEN' | 'IN_PROGRESS' | 'DONE';

export const VALID_PRIORITIES: Priority[] = ['LOW', 'MEDIUM', 'HIGH'];
export const VALID_STATUSES: Status[] = ['OPEN', 'IN_PROGRESS', 'DONE'];

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  tags: string[];
  createdAt: string;
}

export interface TicketInput {
  title: string;
  description?: string;
  priority?: Priority;
  tags?: string[];
}

export interface TicketUpdateInput {
  title?: string;
  description?: string;
  status?: Status;
  priority?: Priority;
  tags?: string[];
}

export interface TicketFilter {
  status?: Status;
  priority?: Priority;
  tag?: string;
}

function sanitizeAndValidateTitle(title?: string): string {
  const trimmed = title?.trim();
  if (!trimmed) {
    throw new Error('Title is required');
  }
  return trimmed;
}

export function validatePriority(priority: string): Priority {
  const upper = priority.trim().toUpperCase() as Priority;
  if (!VALID_PRIORITIES.includes(upper)) {
    throw new Error(`Invalid priority: ${priority}. Must be LOW, MEDIUM, or HIGH`);
  }
  return upper;
}

export function validateStatus(status: string): Status {
  const upper = status.trim().toUpperCase() as Status;
  if (!VALID_STATUSES.includes(upper)) {
    throw new Error(`Invalid status: ${status}. Must be OPEN, IN_PROGRESS, or DONE`);
  }
  return upper;
}

export function normalizeTags(tags?: string[]): string[] {
  if (!tags || tags.length === 0) return [];
  const cleaned = tags
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t.length > 0);
  return Array.from(new Set(cleaned));
}

export function validateAndCreateTicket(input: TicketInput): Ticket {
  const priority = input.priority ? validatePriority(input.priority) : 'MEDIUM';

  return {
    id: randomUUID(),
    title: sanitizeAndValidateTitle(input.title),
    description: input.description?.trim() ?? '',
    status: 'OPEN',
    priority,
    tags: normalizeTags(input.tags),
    createdAt: new Date().toISOString(),
  };
}

export function filterTickets(tickets: Ticket[], filter?: TicketFilter): Ticket[] {
  if (!filter) return tickets;

  return tickets.filter((ticket) => {
    if (filter.status && ticket.status !== filter.status) {
      return false;
    }
    if (filter.priority && ticket.priority !== filter.priority) {
      return false;
    }
    if (filter.tag) {
      const targetTag = filter.tag.trim().toLowerCase();
      const ticketTags = (ticket.tags ?? []).map((t) => t.toLowerCase());
      if (!ticketTags.includes(targetTag)) {
        return false;
      }
    }
    return true;
  });
}