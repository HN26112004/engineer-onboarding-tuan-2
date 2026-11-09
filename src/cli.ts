// src/cli.ts
import { TicketRepository } from './ticket-repository';
import {
  validateAndCreateTicket,
  validatePriority,
  validateStatus,
  filterTickets,
  type TicketFilter,
  type TicketUpdateInput,
} from './ticket-service';

function extractOption(args: string[], flagName: string): string | undefined {
  const prefix = `--${flagName}=`;
  const eqIdx = args.findIndex((arg) => arg.startsWith(prefix));

  // Trường hợp truyền --title=Test Real Process (bị shell tách ở dấu cách)
  if (eqIdx !== -1) {
    const parts = [args[eqIdx].slice(prefix.length)];
    for (let i = eqIdx + 1; i < args.length; i++) {
      if (args[i].startsWith('--')) break;
      parts.push(args[i]);
    }
    return parts.join(' ');
  }

  // Trường hợp truyền --title Test Real Process
  const idx = args.indexOf(`--${flagName}`);
  if (idx !== -1 && idx + 1 < args.length && !args[idx + 1].startsWith('--')) {
    const parts: string[] = [];
    for (let i = idx + 1; i < args.length; i++) {
      if (args[i].startsWith('--')) break;
      parts.push(args[i]);
    }
    return parts.join(' ');
  }

  return undefined;
}

function parseTagsOption(rawTags?: string): string[] | undefined {
  if (rawTags === undefined) return undefined;
  return rawTags
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
}

export async function runCli(args: string[], repo: TicketRepository) {
  const command = args[0];

  if (!command) {
    throw new Error('Please provide a command (create, list, show, update)');
  }

  if (command === 'create') {
    const title = extractOption(args, 'title') ?? '';
    const description = extractOption(args, 'description');
    const rawPriority = extractOption(args, 'priority');
    const rawTags = extractOption(args, 'tags');

    const priority = rawPriority ? validatePriority(rawPriority) : undefined;
    const tags = parseTagsOption(rawTags);

    const newTicket = validateAndCreateTicket({
      title,
      description,
      priority,
      tags,
    });
    await repo.save(newTicket);
    return newTicket;
  }

  if (command === 'list') {
    const rawStatus = extractOption(args, 'status');
    const rawPriority = extractOption(args, 'priority');
    const tag = extractOption(args, 'tag');
    const search = extractOption(args, 'search');

    const filter: TicketFilter = {};
    if (rawStatus) filter.status = validateStatus(rawStatus);
    if (rawPriority) filter.priority = validatePriority(rawPriority);
    if (tag) filter.tag = tag;

    const allTickets = await repo.getAll();
    const filtered = filterTickets(allTickets, filter);

    if (search) {
      const keyword = search.toLowerCase();
      return filtered.filter(
        (t) =>
          t.title.toLowerCase().includes(keyword) ||
          t.description.toLowerCase().includes(keyword)
      );
    }

    return filtered;
  }

  if (command === 'show') {
    const id = args[1] && !args[1].startsWith('--') ? args[1] : extractOption(args, 'id');
    if (!id) {
      throw new Error('Ticket ID is required for show command');
    }

    const ticket = await repo.findById(id);
    if (!ticket) {
      throw new Error('Ticket not found');
    }
    return ticket;
  }

  if (command === 'update') {
    const id = args[1] && !args[1].startsWith('--') ? args[1] : extractOption(args, 'id');
    if (!id) {
      throw new Error('Ticket ID is required for update command');
    }

    const title = extractOption(args, 'title');
    const description = extractOption(args, 'description');
    const rawStatus = extractOption(args, 'status');
    const rawPriority = extractOption(args, 'priority');
    const rawTags = extractOption(args, 'tags');

    const updates: TicketUpdateInput = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (rawStatus !== undefined) updates.status = validateStatus(rawStatus);
    if (rawPriority !== undefined) updates.priority = validatePriority(rawPriority);
    if (rawTags !== undefined) updates.tags = parseTagsOption(rawTags);

    if (Object.keys(updates).length === 0) {
      throw new Error('Please provide at least one field to update (--status, --priority, --title, --description, --tags)');
    }

    return await repo.update(id, updates);
  }

  throw new Error(`Unknown command: ${command}`);
}