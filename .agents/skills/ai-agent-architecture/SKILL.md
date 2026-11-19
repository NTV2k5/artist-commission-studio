---
name: ai-agent-architecture
description: 4 Pillars of AI Agent Architecture 2026: Harness (Tools, Info, Permissions, Controls), Closed-Loop Interactions, Model Context Protocol (MCP), and Loop Engineering with 7-Layer Test Verification.
---

# 4 TRỤ CỘT KIẾN TRÚC AI AGENT NĂM 2026 (AI AGENT 2026 CONSTITUTION)

Tài liệu quy định và hướng dẫn các AI Agent tự hành tham gia phát triển, bảo trì và vận hành hệ thống **F&B Drink & Food Shop**.

---

## 1. KHUNG XƯƠNG KIỂM SOÁT (HARNESS)
Model chỉ là bộ não suy luận. AI Agent trong dự án này BẮT BUỘC phải tuân thủ 4 gọng kìm kiểm soát:
- **Tools (Công cụ thao tác)**:
  - Chỉ thực thi các lệnh chuẩn: `npm run test:unit`, `npm run test:integration`, `npm run test:business`, `npm run test:e2e`, `npm run test:performance`, `npm run test:security`, `npm run test:reliability`.
  - Tuyệt đối không xóa database trực tiếp; sử dụng seeder chuẩn `npm run seed`.
- **Info (Ngữ cảnh & Tri thức)**:
  - Bắt buộc đọc `AGENTS.md` ở root dự án trước khi sinh code.
  - Tham chiếu cấu trúc OpenAPI/Swagger tại `/api-docs` và các Zod validation schemas tại `backend/src/validations/`.
- **Permissions (Phân quyền & Ranh giới)**:
  - Chạy các lệnh kiểm thử và build trong sandbox an toàn; chỉ xin bypass sandbox khi thao tác mạng hoặc thay đổi cấu trúc git ref khi cần thiết.
  - Phân quyền RBAC chặt chẽ giữa `CUSTOMER`, `SHIPPER`, và `ADMIN`.
- **Controls (Giới hạn & Tự phục hồi)**:
  - Bắt buộc dùng `pino` logger với `traceId` chuẩn JSON.
  - Mọi API xử lý tài chính (thanh toán SePay, tạo đơn) bắt buộc phải qua middleware `idempotency()`.
  - Mọi lỗi phải kế thừa `AppError`. Cấm nuốt lỗi rỗng (`catch (e) {}`).

---

## 2. VÒNG LẶP TƯƠNG TÁC MÔI TRƯỜNG KHÉP KÍN (AGENT CLOSED-LOOP)
Bản chất Agent không phải là một lượt hỏi đáp (single-turn chat) mà là vòng lặp khép kín:
$$\text{Action} \longrightarrow \text{Environment} \longrightarrow \text{Feedback} \longrightarrow \text{LLM Call}$$

- **Action**: Agent viết code, tạo route, cập nhật controller.
- **Environment**: Môi trường runtime Node.js, Express server, in-memory MongoDB mock, Socket.io event loop.
- **Feedback**: Output từ Jest Test Runner, mã lỗi HTTP status, stack trace từ Pino Logger.
- **LLM Call**: Agent tự phân tích nguyên nhân gốc (root-cause), tự sửa mã và lặp lại vòng lặp cho đến khi thỏa mãn nghiệm.

---

## 3. MODEL CONTEXT PROTOCOL (MCP) - CỔNG SẠC TYPE-C VẠN NĂNG
Hệ thống hỗ trợ chuẩn MCP (`.mcp.json`) để kết nối AI Agent với cơ sở dữ liệu và hệ thống tệp mà không cần viết driver thủ công:
- **MongoDB MCP Server**: Cho phép Agent truy vấn tồn kho sản phẩm, phân tích đơn hàng theo doanh thu realtime, kiểm tra lỗi đơn hàng treo.
- **Official Antigravity Plugin**: Khuyến nghị cài đặt plugin chính thức **MongoDB Atlas (Managed MCP)** từ Antigravity Marketplace:
  `<plugin-card catalog-id="antigravity-plugins-partners/plugin/mongodb-atlas"></plugin-card>`
  để Agent có công cụ truy vấn dữ liệu đám mây an toàn với zero boilerplate.

---

## 4. KỸ THUẬT VÒNG LẶP VI MÔ (LOOP ENGINEERING)
Khi AI Agent nhận bất kỳ nhiệm vụ nào trong repo này, quy trình thực hiện BẮT BUỘC phải tuân thủ 5 bước vi mô:

```
[1. Chọn việc nhỏ] ➔ [2. Gõ code chuẩn Zod & AppError] ➔ [3. Soi Test 7 Tầng] ➔ [4. Lỗi thì tự fix] ➔ [5. Đạt 100% Pass mới xong]
```

### Tiêu chuẩn 7 Tầng Test (7-Layer Verification):
1. **Tầng 1 (Unit)**: `npm run test:unit` - Test controller, helper, validation, coupon logic (Mock 100%).
2. **Tầng 2 (Integration)**: `npm run test:integration` - Test Express routes, Supertest HTTP status, CORS headers.
3. **Tầng 3 (Business Flow)**: `npm run test:business` - Test quy trình đặt hàng, tính loyalty points, state machine.
4. **Tầng 4 (E2E Journey)**: `npm run test:e2e` - Test trọn vẹn luồng Khách hàng ➔ Admin ➔ Shipper.
5. **Tầng 5 (Performance)**: `npm run test:performance` - Benchmark thời gian phản hồi (<100ms health, <500ms API), 50 concurrent requests.
6. **Tầng 6 (Security)**: `npm run test:security` - OWASP Top 10, IDOR, NoSQL injection, RBAC enforcement.
7. **Tầng 7 (Reliability)**: `npm run test:reliability` - Chaos resilience, network timeout fallback, database error recovery.

Agent chỉ được coi là hoàn thành nhiệm vụ khi toàn bộ các tầng kiểm thử bị ảnh hưởng đạt **100% PASS**.

