// tests/cli.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runCli } from '../src/cli';
import { TicketRepository } from '../src/ticket-repository';

describe('CLI Command Parser', () => {
  let mockRepo: TicketRepository;

  beforeEach(() => {
    mockRepo = new TicketRepository('/virtual/path.json');
  });

  it('lệnh "list" gọi hàm repo.getAll() và trả về danh sách', async () => {
    const getAllSpy = vi.spyOn(mockRepo, 'getAll').mockResolvedValueOnce([]);

    const result = await runCli(['list'], mockRepo);

    expect(getAllSpy).toHaveBeenCalledTimes(1);
    expect(result).toEqual([]);
  });

  it('lệnh "create" với title hợp lệ sẽ tạo ticket mới', async () => {
    const saveSpy = vi.spyOn(mockRepo, 'save').mockResolvedValueOnce(undefined);

    const result = await runCli(['create', '--title=Học Vitest'], mockRepo);

    expect(saveSpy).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      title: 'Học Vitest',
      status: 'OPEN',
      priority: 'MEDIUM',
    });
  });

  it('ném ra lỗi nếu truyền lệnh không hợp lệ', async () => {
    await expect(runCli(['unknown-command'], mockRepo)).rejects.toThrowError(
      'Unknown command: unknown-command'
    );
  });
});