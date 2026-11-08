# Engineer Onboarding - Tuần 2: Ticket Manager CLI (TDD Practice)

Công cụ quản lý Ticket trên giao diện dòng lệnh (CLI) được xây dựng bằng TypeScript và kiểm thử theo phương pháp **Test-Driven Development (Red - Green - Refactor)** với Vitest[cite: 70, 123].

## 1. Cài đặt & Khởi chạy

Yêu cầu hệ thống: **Node.js >= 20**.

```bash
# Cài đặt dependencies
npm install

# Chạy toàn bộ Unit Tests & Integration Tests
npm test

# Chạy test ở chế độ watch (TDD mode)
npm run test:watch