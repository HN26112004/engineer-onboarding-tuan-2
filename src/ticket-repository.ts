import fs from 'node:fs/promises';
import type { Ticket, Status } from './ticket-service';

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

  async findById(id: string): Promise<Ticket | null> {
    const tickets = await this.getAll();
    return tickets.find((t) => t.id === id) ?? null;
  }

  async updateStatus(id: string, status: Status): Promise<Ticket> {
    const tickets = await this.getAll();
    const index = tickets.findIndex((t) => t.id === id);

    if (index === -1) {
      throw new Error('Ticket not found');
    }

    tickets[index].status = status;
    await fs.writeFile(this.filePath, JSON.stringify(tickets, null, 2), 'utf-8');
    return tickets[index];
  }
}