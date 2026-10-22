// src/cli.ts
import { TicketRepository } from './ticket-repository';
import { validateAndCreateTicket } from './ticket-service';

export async function runCli(args: string[], repo: TicketRepository) {
  const command = args[0];

  if (!command) {
    throw new Error('Please provide a command (create, list, update)');
  }

  if (command === 'list') {
    return await repo.getAll();
  }

  if (command === 'create') {
    // Tìm flag --title=...
    const titleArg = args.find((arg) => arg.startsWith('--title='));
    const title = titleArg ? titleArg.replace('--title=', '') : '';

    const newTicket = validateAndCreateTicket({ title });
    await repo.save(newTicket);
    return newTicket;
  }

  throw new Error(`Unknown command: ${command}`);
}