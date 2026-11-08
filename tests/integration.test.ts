// tests/integration.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { TicketRepository } from '../src/ticket-repository';
import { runCli } from '../src/cli';
import type { Ticket } from '../src/ticket-service';

const execFileAsync = promisify(execFile);

describe('Real File I/O & CLI Process Integration Tests', () => {
  let tempDir: string;
  let dbFilePath: string;
  let repo: TicketRepository;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ticket-cli-int-'));
    dbFilePath = path.join(tempDir, 'tickets.json');
    repo = new TicketRepository(dbFilePath);
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('lưu trữ JSON thực tế: create -> show -> update -> list filter trên file thật', async () => {
    expect(await repo.getAll()).toEqual([]);

    const created1 = (await runCli(
      [
        'create',
        '--title=Lỗi cổng thanh toán',
        '--description=Timeout khi gọi webhook',
        '--priority=HIGH',
        '--tags=payment,bug',
      ],
      repo
    )) as Ticket;

    const created2 = (await runCli(
      [
        'create',
        '--title=Thêm nút xuất Excel',
        '--priority=LOW',
        '--tags=feature',
      ],
      repo
    )) as Ticket;

    const rawContent = await fs.readFile(dbFilePath, 'utf-8');
    const diskData = JSON.parse(rawContent) as Ticket[];
    expect(diskData).toHaveLength(2);

    const shown = (await runCli(['show', created1.id], repo)) as Ticket;
    expect(shown.title).toBe('Lỗi cổng thanh toán');
    expect(shown.tags).toEqual(['payment', 'bug']);

    await runCli(
      ['update', created1.id, '--status=IN_PROGRESS', '--tags=payment,bug,urgent'],
      repo
    );

    const freshRepo = new TicketRepository(dbFilePath);
    const filtered = (await runCli(
      ['list', '--status=IN_PROGRESS', '--tag=urgent'],
      freshRepo
    )) as Ticket[];

    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe(created1.id);
    expect(filtered[0].id).not.toBe(created2.id);
  });

  it('xử lý đúng khi file JSON thật trên đĩa bị hỏng cú pháp (corrupted JSON)', async () => {
    await fs.writeFile(dbFilePath, '{ broken_json: [123 ', 'utf-8');

    await expect(repo.getAll()).rejects.toThrowError('Database corrupted');
    await expect(runCli(['list'], repo)).rejects.toThrowError('Database corrupted');
  });

  it('chạy CLI process thật (src/index.ts) qua child_process với biến môi trường TICKETS_DB_PATH', async () => {
    const tsxCli = path.resolve(process.cwd(), 'node_modules/tsx/dist/cli.mjs');
    const entryFile = path.resolve(process.cwd(), 'src/index.ts');

    const { stdout: createOut } = await execFileAsync(
      process.execPath,
      [
        tsxCli,
        entryFile,
        'create',
        '--title=Test Real Process',
        '--priority=HIGH',
        '--tags=e2e,cli',
      ],
      {
        env: { ...process.env, TICKETS_DB_PATH: dbFilePath },
      }
    );

    expect(createOut).toContain('Success:');
    expect(createOut).toContain('Test Real Process');

    const savedTickets = JSON.parse(await fs.readFile(dbFilePath, 'utf-8')) as Ticket[];
    expect(savedTickets).toHaveLength(1);
    expect(savedTickets[0].title).toBe('Test Real Process');
    expect(savedTickets[0].tags).toEqual(['e2e', 'cli']);

    await expect(
      execFileAsync(process.execPath, [tsxCli, entryFile, 'show', 'invalid-id'], {
        env: { ...process.env, TICKETS_DB_PATH: dbFilePath },
      })
    ).rejects.toThrow();
  });
});