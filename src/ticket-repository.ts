// src/ticket-repository.ts
import fs from 'node:fs/promises';
import type { Ticket } from './ticket-service';

export class TicketRepository {
  constructor(private readonly filePath: string) {}

  async getAll(): Promise<Ticket[]> {
    try {
      const raw = await fs.readFile(this.filePath, 'utf-8');
      return JSON.parse(raw) as Ticket[];
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return [];
      }
      if (error instanceof SyntaxError) {
        throw new Error('Database corrupted');
      }
      throw error;
    }
  }

  async save(ticket: Ticket): Promise<void> {
    const tickets = await this.getAll();
    tickets.push(ticket);
    await fs.writeFile(this.filePath, JSON.stringify(tickets, null, 2), 'utf-8');
  }
}