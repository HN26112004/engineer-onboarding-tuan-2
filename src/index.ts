// src/index.ts
import path from 'node:path';
import { TicketRepository } from './ticket-repository';
import { runCli } from './cli';

const DB_PATH = path.resolve(process.cwd(), 'tickets.json');
const repo = new TicketRepository(DB_PATH);

// Lấy tham số người dùng truyền từ dòng lệnh (bỏ qua node và file path)
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