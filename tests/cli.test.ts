// tests/cli.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runCli } from '../src/cli';
import { TicketRepository } from '../src/ticket-repository';
import type { Ticket } from '../src/ticket-service';

describe('CLI Command Parser', () => {
  let mockRepo: TicketRepository;

  const mockTickets: Ticket[] = [
    {
      id: 't-1',
      title: 'Bug đăng nhập',
      description: 'Lỗi 401',
      status: 'OPEN',
      priority: 'HIGH',
      tags: ['auth', 'bug'],
      createdAt: '2026-10-22T00:00:00.000Z',
    },
    {
      id: 't-2',
      title: 'Cập nhật giao diện',
      description: 'Đổi màu nút',
      status: 'DONE',
      priority: 'LOW',
      tags: ['ui'],
      createdAt: '2026-10-22T00:00:00.000Z',
    },
  ];

  beforeEach(() => {
    mockRepo = new TicketRepository('/virtual/path.json');
  });

  it('lệnh "create" tạo ticket với đầy đủ title, description, priority, tags', async () => {
    const saveSpy = vi.spyOn(mockRepo, 'save').mockResolvedValueOnce(undefined);

    const result = await runCli(
      [
        'create',
        '--title=Học Vitest',
        '--description=Viết test cho CLI',
        '--priority=HIGH',
        '--tags=test,vitest',
      ],
      mockRepo
    );

    expect(saveSpy).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      title: 'Học Vitest',
      description: 'Viết test cho CLI',
      status: 'OPEN',
      priority: 'HIGH',
      tags: ['test', 'vitest'],
    });
  });

  it('lệnh "list" hỗ trợ lọc theo --status, --priority và --tag', async () => {
    vi.spyOn(mockRepo, 'getAll').mockResolvedValue(mockTickets);

    const byStatus = await runCli(['list', '--status=DONE'], mockRepo);
    expect(byStatus).toHaveLength(1);
    expect((byStatus as Ticket[])[0].id).toBe('t-2');

    const byPriority = await runCli(['list', '--priority=HIGH'], mockRepo);
    expect(byPriority).toHaveLength(1);
    expect((byPriority as Ticket[])[0].id).toBe('t-1');

    const byTag = await runCli(['list', '--tag=auth'], mockRepo);
    expect(byTag).toHaveLength(1);
    expect((byTag as Ticket[])[0].id).toBe('t-1');
  });

  it('lệnh "show <id>" trả về chi tiết ticket hoặc báo lỗi nếu thiếu ID / không tìm thấy', async () => {
    vi.spyOn(mockRepo, 'findById').mockImplementation(async (id) =>
      mockTickets.find((t) => t.id === id) ?? null
    );

    const found = await runCli(['show', 't-1'], mockRepo);
    expect(found).toEqual(mockTickets[0]);

    await expect(runCli(['show'], mockRepo)).rejects.toThrowError(
      'Ticket ID is required for show command'
    );
    await expect(runCli(['show', 'non-existent'], mockRepo)).rejects.toThrowError(
      'Ticket not found'
    );
  });

  it('lệnh "update <id>" cập nhật ticket và bắt lỗi invalid input / not-found', async () => {
    const updateSpy = vi.spyOn(mockRepo, 'update').mockResolvedValueOnce({
      ...mockTickets[0],
      status: 'IN_PROGRESS',
      priority: 'MEDIUM',
    });

    const updated = await runCli(
      ['update', 't-1', '--status=IN_PROGRESS', '--priority=MEDIUM'],
      mockRepo
    );

    expect(updateSpy).toHaveBeenCalledWith('t-1', {
      status: 'IN_PROGRESS',
      priority: 'MEDIUM',
    });
    expect((updated as Ticket).status).toBe('IN_PROGRESS');

    await expect(runCli(['update'], mockRepo)).rejects.toThrowError(
      'Ticket ID is required for update command'
    );
    await expect(runCli(['update', 't-1'], mockRepo)).rejects.toThrowError(
      'Please provide at least one field to update'
    );
    await expect(runCli(['update', 't-1', '--status=INVALID'], mockRepo)).rejects.toThrowError(
      'Invalid status: INVALID'
    );
  });

  it('ném ra lỗi nếu truyền lệnh không hợp lệ hoặc rỗng', async () => {
    await expect(runCli([], mockRepo)).rejects.toThrowError('Please provide a command');
    await expect(runCli(['unknown-command'], mockRepo)).rejects.toThrowError(
      'Unknown command: unknown-command'
    );
  });
  it('lệnh "list --search=<keyword>" lọc ticket theo từ khóa trong title hoặc description', async () => {
    vi.spyOn(mockRepo, 'getAll').mockResolvedValueOnce(mockTickets);
    const result = await runCli(['list', '--search=401'], mockRepo);
    expect(result).toHaveLength(1);
    expect((result as Ticket[])[0].id).toBe('t-1');
  });
});