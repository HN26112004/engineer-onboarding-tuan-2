// tests/ticket-service.test.ts
import { describe, it, expect } from 'vitest';
import { validateAndCreateTicket, filterTickets } from '../src/ticket-service';

describe('Ticket Service', () => {
  describe('validateAndCreateTicket', () => {
    it('ném ra lỗi nếu title rỗng hoặc chỉ toàn khoảng trắng', () => {
      expect(() => validateAndCreateTicket({ title: '' })).toThrowError('Title is required');
      expect(() => validateAndCreateTicket({ title: '   ' })).toThrowError('Title is required');
    });

    it('tạo ticket thành công với giá trị mặc định (OPEN, MEDIUM, description rỗng, tags rỗng)', () => {
      const ticket = validateAndCreateTicket({ title: 'Sửa lỗi giao diện' });

      expect(ticket).toMatchObject({
        title: 'Sửa lỗi giao diện',
        description: '',
        status: 'OPEN',
        priority: 'MEDIUM',
        tags: [],
      });
      expect(ticket.id).toBeDefined();
      expect(ticket.createdAt).toBeDefined();
    });

    it('tạo ticket đầy đủ với description, priority và chuẩn hóa tags (chữ thường, loại trùng)', () => {
      const ticket = validateAndCreateTicket({
        title: 'Lỗi thanh toán',
        description: '  Khách hàng bị trừ tiền 2 lần ',
        priority: 'HIGH',
        tags: ['Billing', 'URGENT', 'billing', '  '],
      });

      expect(ticket.description).toBe('Khách hàng bị trừ tiền 2 lần');
      expect(ticket.priority).toBe('HIGH');
      expect(ticket.tags).toEqual(['billing', 'urgent']);
    });

    it('ném lỗi nếu truyền priority không hợp lệ', () => {
      expect(() =>
        validateAndCreateTicket({ title: 'Test', priority: 'CRITICAL' as any })
      ).toThrowError('Invalid priority: CRITICAL');
    });
  });

  describe('filterTickets', () => {
    const sampleTickets = [
      validateAndCreateTicket({ title: 'T1', priority: 'HIGH', tags: ['bug', 'auth'] }),
      {
        ...validateAndCreateTicket({ title: 'T2', priority: 'LOW', tags: ['ui'] }),
        status: 'DONE' as const,
      },
      validateAndCreateTicket({ title: 'T3', priority: 'HIGH', tags: ['backend'] }),
    ];

    it('lọc chính xác theo status, priority và tag', () => {
      expect(filterTickets(sampleTickets, { status: 'DONE' })).toHaveLength(1);
      expect(filterTickets(sampleTickets, { priority: 'HIGH' })).toHaveLength(2);
      expect(filterTickets(sampleTickets, { tag: 'AUTH' })).toHaveLength(1);
      expect(filterTickets(sampleTickets, { priority: 'HIGH', tag: 'backend' })[0].title).toBe('T3');
    });
  });
});