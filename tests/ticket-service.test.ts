import { describe, it, expect } from 'vitest';
import { validateAndCreateTicket } from '../src/ticket-service';

describe('Ticket Service - validateAndCreateTicket', () => {
  it('ném ra lỗi nếu title rỗng hoặc chỉ toàn khoảng trắng', () => {
    expect(() => validateAndCreateTicket({ title: '' })).toThrowError('Title is required');
    expect(() => validateAndCreateTicket({ title: '   ' })).toThrowError('Title is required');
  });

  it('tạo ticket thành công với giá trị mặc định (OPEN, MEDIUM)', () => {
    const ticket = validateAndCreateTicket({ title: 'Sửa lỗi giao diện' });

    expect(ticket).toMatchObject({
      title: 'Sửa lỗi giao diện',
      status: 'OPEN',
      priority: 'MEDIUM',
    });
    expect(ticket.id).toBeDefined();
    expect(ticket.createdAt).toBeDefined();
  });
});