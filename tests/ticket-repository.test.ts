// tests/ticket-repository.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'node:fs/promises';
import { TicketRepository } from '../src/ticket-repository';
import type { Ticket } from '../src/ticket-service';

// Mock toàn bộ module fs/promises để cô lập I/O
vi.mock('node:fs/promises');

describe('TicketRepository', () => {
  const mockFilePath = '/virtual/tickets.json';
  let repository: TicketRepository;

  const sampleTicket: Ticket = {
    id: 'test-uuid-1',
    title: 'Học TDD cùng Mentor',
    status: 'OPEN',
    priority: 'HIGH',
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
    expect(fs.readFile).toHaveBeenCalledWith(mockFilePath, 'utf-8');
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
    // Giả lập file hiện có 1 ticket
    vi.mocked(fs.readFile).mockResolvedValueOnce(JSON.stringify([sampleTicket]));
    vi.mocked(fs.writeFile).mockResolvedValueOnce(undefined);

    const newTicket: Ticket = {
      id: 'test-uuid-2',
      title: 'Ticket thứ 2',
      status: 'OPEN',
      priority: 'MEDIUM',
      createdAt: '2026-10-22T00:00:00.000Z',
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

    const found = await repository.findById('test-uuid-1');
    const notFound = await repository.findById('non-existent-id');

    expect(found).toEqual(sampleTicket);
    expect(notFound).toBeNull();
  });

  it('cập nhật trạng thái ticket thành công và ném lỗi nếu không tìm thấy id', async () => {
    // 1. Trường hợp ID không tồn tại
    vi.mocked(fs.readFile).mockResolvedValueOnce(JSON.stringify([sampleTicket]));
    await expect(repository.updateStatus('fake-id', 'DONE')).rejects.toThrowError('Ticket not found');

    // 2. Trường hợp cập nhật thành công
    vi.mocked(fs.readFile).mockResolvedValueOnce(JSON.stringify([sampleTicket]));
    vi.mocked(fs.writeFile).mockResolvedValueOnce(undefined);

    const updated = await repository.updateStatus('test-uuid-1', 'IN_PROGRESS');

    expect(updated.status).toBe('IN_PROGRESS');
    expect(fs.writeFile).toHaveBeenCalledWith(
      mockFilePath,
      JSON.stringify([{ ...sampleTicket, status: 'IN_PROGRESS' }], null, 2),
      'utf-8'
    );
  });
});