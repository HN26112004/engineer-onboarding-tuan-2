// src/index.ts
import path from 'node:path';
import { TicketRepository } from './ticket-repository';
import { runCli } from './cli';

// Cho phép cấu hình đường dẫn file DB qua biến môi trường TICKETS_DB_PATH để phục vụ Integration Test
const DB_PATH = process.env.TICKETS_DB_PATH
  ? path.resolve(process.env.TICKETS_DB_PATH)
  : path.resolve(process.cwd(), 'tickets.json');

const repo = new TicketRepository(DB_PATH);
const args = process.argv.slice(2);

async function main() {
  try {
    const output = await runCli(args, repo);
    console.log('Success:', JSON.stringify(output, null, 2));
  } catch (err: any) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

main();