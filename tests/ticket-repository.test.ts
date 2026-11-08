// tests/ticket-repository.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'node:fs/promises';
import { TicketRepository } from '../src/ticket-repository';
import type { Ticket } from '../src/ticket-service';

vi.mock('node:fs/promises');

describe('TicketRepository (Unit Tests with Mocked FS)', () => {
  const mockFilePath = '/virtual/tickets.json';
  let repository: TicketRepository;

  const sampleTicket: Ticket = {
    id: 'test-uuid-1',
    title: 'Học TDD cùng Mentor',
    description: 'Chi tiết bài tập tuần 2',
    status: 'OPEN',
    priority: 'HIGH',
    tags: ['tdd', 'onboarding'],
    createdAt: '2026-10-22T00:00:00.000Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new TicketRepository(mockFilePath);
  });

  it('lấy danh sách ticket thành công từ file JSON', async () => {
    vi.mocked(fs.readFile).mockResolvedValueOnce(JSON.stringify([sampleTicket]));

    const tickets = await repository.getAll();

    expect(tickets).toHaveLength(1);
    expect(tickets[0]).toEqual(sampleTicket);
  });

  it('tự khởi tạo danh sách rỗng nếu file chưa tồn tại (lỗi ENOENT)', async () => {
    const enoentError = new Error('File not found') as NodeJS.ErrnoException;
    enoentError.code = 'ENOENT';
    vi.mocked(fs.readFile).mockRejectedValueOnce(enoentError);

    const tickets = await repository.getAll();
    expect(tickets).toEqual([]);
  });

  it('báo lỗi "Database corrupted" nếu cấu trúc JSON bị hỏng cú pháp', async () => {
    vi.mocked(fs.readFile).mockResolvedValueOnce('{ invalid json syntax');
    await expect(repository.getAll()).rejects.toThrowError('Database corrupted');
  });

  it('lưu ticket mới thành công vào file', async () => {
    vi.mocked(fs.readFile).mockResolvedValueOnce(JSON.stringify([sampleTicket]));
    vi.mocked(fs.mkdir).mockResolvedValueOnce(undefined);
    vi.mocked(fs.writeFile).mockResolvedValueOnce(undefined);

    const newTicket: Ticket = {
      ...sampleTicket,
      id: 'test-uuid-2',
      title: 'Ticket thứ 2',
    };

    await repository.save(newTicket);

    expect(fs.writeFile).toHaveBeenCalledWith(
      mockFilePath,
      JSON.stringify([sampleTicket, newTicket], null, 2),
      'utf-8'
    );
  });

  it('tìm thấy ticket theo id hoặc trả về null nếu không tồn tại', async () => {
    vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify([sampleTicket]));

    expect(await repository.findById('test-uuid-1')).toEqual(sampleTicket);
    expect(await repository.findById('non-existent-id')).toBeNull();
  });

  it('cập nhật ticket (status, priority, tags, description) và ném lỗi nếu không tìm thấy id', async () => {
    vi.mocked(fs.readFile).mockResolvedValueOnce(JSON.stringify([sampleTicket]));
    await expect(repository.updateStatus('fake-id', 'DONE')).rejects.toThrowError('Ticket not found');

    vi.mocked(fs.readFile).mockResolvedValueOnce(JSON.stringify([sampleTicket]));
    vi.mocked(fs.mkdir).mockResolvedValueOnce(undefined);
    vi.mocked(fs.writeFile).mockResolvedValueOnce(undefined);

    const updated = await repository.update('test-uuid-1', {
      status: 'IN_PROGRESS',
      priority: 'LOW',
      tags: ['updated'],
    });

    expect(updated.status).toBe('IN_PROGRESS');
    expect(updated.priority).toBe('LOW');
    expect(updated.tags).toEqual(['updated']);
  });
});