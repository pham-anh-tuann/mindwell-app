# 🧠 MindWell App: Mental Health Mobile Client

<div align="center">
  <img src="./assets/images/icon.png" alt="MindWell Banner" width="20%" />
</div>

> **Đề tài Nghiên cứu Khoa học - Viện Công nghệ thông tin** | Phân hệ giao diện di động (Mobile Client) thuộc hệ sinh thái MindWell, tập trung vào Trải nghiệm Người dùng (UX) và tối ưu hóa hiệu năng thiết bị khách.

> 🔗 **[Mã nguồn Frontend (Mobile App)](https://github.com/pham-anh-tuann/mindwell-app)**

> ⚙️ *Xem mã nguồn phân hệ Backend xử lý logic & AI [tại đây](https://github.com/pham-anh-tuann/mindwell-server).*

> 🌐 *Xem phân hệ Quản trị viên (Admin Dashboard) [tại đây](https://mindwell-admin.vercel.app).*

## 🛠️ Công nghệ & Ngăn xếp (Tech Stack)
*   **Framework**: React Native / Expo.
*   **State Management**: Zustand.
*   **Local Storage**: AsyncStorage.
*   **Real-time Integration**: Socket.io-client.

## 🧠 Quyết định Kiến trúc Frontend (Frontend Architecture Decisions)

### 1. Global State Management với Zustand
*   **Quyết định:** Sử dụng `Zustand` để quản lý trạng thái toàn cục (Global State) thay vì truyền Props thủ công (Prop Drilling) hoặc sử dụng Redux quá cồng kềnh.
*   **Impact:** Tối ưu hóa chu kỳ render của React Native, ngăn chặn hiện tượng re-render rác làm giảm khung hình (FPS), đảm bảo ứng dụng hoạt động mượt mà trên cả các thiết bị cấu hình thấp.

### 2. Cross-screen Data Passing
*   **Quyết định:** Khai thác `AsyncStorage` để lưu trữ bộ nhớ tạm thời cho luồng Đăng ký tài khoản và Khảo sát đầu vào (Onboarding).
*   **Impact:** Mang lại trải nghiệm liền mạch cho sinh viên khi chuyển đổi giữa các màn hình, giữ nguyên tiến trình nhập liệu ngay cả khi ứng dụng bị đóng đột ngột.

### 3. Real-time UI Responsiveness
*   **Quyết định:** Tích hợp `Socket.io-client` để lắng nghe các sự kiện (events) từ Backend. Áp dụng kỹ thuật Optimistic UI Updates (Cập nhật giao diện giả định) khi gửi tin nhắn hoặc thả biểu tượng cảm xúc.
*   **Impact:** Giúp người dùng cảm nhận độ trễ gần như bằng 0 trong quá trình tương tác cộng đồng.
🛠️ Công nghệ & Ngăn xếp (Tech Stack)
Core: Node.js, Express.js (Triển khai trên Render).

Database: MongoDB (Atlas) & Mongoose ORM.

Real-time & AI: Socket.io, Gemini API / OpenAI API.

Security & Background Tasks: JWT (JSON Web Token), bcryptjs, Node-Cron.

🧠 Quyết định Kỹ thuật Cốt lõi & Phân tích Đánh đổi (Trade-off Analysis)
1. Real-time Community Chat (Socket.io)
Kiến trúc: Sử dụng Socket.io để đồng bộ hóa tin nhắn tức thời, tối ưu hóa sự kiện cho các tác vụ thả emoji và thu hồi tin nhắn.

Trade-off Analysis: Cải thiện tối đa độ trễ (latency) so với HTTP Polling, nhưng đánh đổi bằng việc tiêu tốn bộ nhớ RAM để duy trì các kết nối TCP mở liên tục. Để đạt được High Availability (HA) khi lượng người dùng tăng vọt, kiến trúc cần tích hợp thêm Load Balancer.

2. Automated Moderation System (Hệ thống "3-Strike")
Kiến trúc: Thiết lập Middleware can thiệp vào luồng tin nhắn trước khi lưu trữ xuống Database, che mờ từ ngữ vi phạm. Áp dụng logic "3-Strike": Tự động khóa quyền chat (Ban) 24 giờ khi tài khoản chạm ngưỡng 3 lần vi phạm.

Impact: Tự động hóa hoàn toàn quy trình quản trị rủi ro, bảo vệ an toàn cộng đồng mà không cần nguồn lực kiểm duyệt thủ công.

3. Background Tasks & Future Scalability
Kiến trúc: Sử dụng node-cron để tự động hóa các tác vụ lặp lại (Reset dữ liệu, gửi thông báo).

Scalability: Triển khai Cronjob trên cấu trúc Monolith hiện tại hoạt động rất tốt và tiết kiệm chi phí. Trong tương lai, khi mở rộng thành Hệ thống phân tán (Distributed Systems), các tác vụ này sẽ được áp dụng Event-Driven Architecture, giao tiếp qua Message Brokers để đảm bảo đồng bộ dữ liệu.
