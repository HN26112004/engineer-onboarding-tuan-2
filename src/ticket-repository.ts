// src/ticket-repository.ts
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  type Ticket,
  type Status,
  type TicketUpdateInput,
  validateStatus,
  validatePriority,
  normalizeTags,
} from './ticket-service';

export class TicketRepository {
  constructor(private readonly filePath: string) {}

  async getAll(): Promise<Ticket[]> {
    try {
      const raw = await fs.readFile(this.filePath, 'utf-8');
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        throw new Error('Database corrupted');
      }
      return parsed as Ticket[];
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return [];
      }
      if (error instanceof SyntaxError || error.message === 'Database corrupted') {
        throw new Error('Database corrupted');
      }
      throw error;
    }
  }

  private async writeAll(tickets: Ticket[]): Promise<void> {
    const dir = path.dirname(this.filePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(this.filePath, JSON.stringify(tickets, null, 2), 'utf-8');
  }

  async save(ticket: Ticket): Promise<void> {
    const tickets = await this.getAll();
    tickets.push(ticket);
    await this.writeAll(tickets);
  }

  async findById(id: string): Promise<Ticket | null> {
    const tickets = await this.getAll();
    return tickets.find((t) => t.id === id) ?? null;
  }

  async update(id: string, updates: TicketUpdateInput): Promise<Ticket> {
    const tickets = await this.getAll();
    const index = tickets.findIndex((t) => t.id === id);

    if (index === -1) {
      throw new Error('Ticket not found');
    }

    const current = tickets[index];

    if (updates.title !== undefined) {
      const trimmedTitle = updates.title.trim();
      if (!trimmedTitle) {
        throw new Error('Title is required');
      }
      current.title = trimmedTitle;
    }

    if (updates.description !== undefined) {
      current.description = updates.description.trim();
    }

    if (updates.status !== undefined) {
      current.status = validateStatus(updates.status);
    }

    if (updates.priority !== undefined) {
      current.priority = validatePriority(updates.priority);
    }

    if (updates.tags !== undefined) {
      current.tags = normalizeTags(updates.tags);
    }

    tickets[index] = current;
    await this.writeAll(tickets);
    return current;
  }

  async updateStatus(id: string, status: Status): Promise<Ticket> {
    return this.update(id, { status });
  }
}