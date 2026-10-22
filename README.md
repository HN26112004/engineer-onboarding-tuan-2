# engineer-onboarding-tuan-2
# Ticket Manager CLI - Week 2: TDD Practice

Công cụ dòng lệnh quản lý công việc (Ticket Manager CLI) được xây dựng hoàn toàn bằng phương pháp **Test-Driven Development (TDD)** theo chu trình **Red - Green - Refactor**.

## Công nghệ sử dụng
- **Ngôn ngữ:** TypeScript (Strict mode, ES Modules)
- **Kiểm thử:** Vitest
- **Mocking:** `vi.mock('node:fs/promises')` để cô lập hoàn toàn I/O ổ đĩa

## Kiến trúc mã nguồn
- `src/ticket-service.ts`: Xử lý Domain Logic, Validation và gán giá trị mặc định cho Ticket.
- `src/ticket-repository.ts`: Tầng Data Access đọc/ghi file `tickets.json`, xử lý ngoại lệ JSON hỏng và khởi tạo khi file chưa tồn tại.
- `src/cli.ts`: Phân tích câu lệnh và điều hướng thực thi CLI.
- `src/index.ts`: Entrypoint kết nối tham số dòng lệnh từ hệ điều hành.

## Chạy kiểm thử
```bash
npm install
npm test
Kết: 11/11 unit tests đạt chuẩn Green.


