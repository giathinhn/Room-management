# Plan 18 — Chế độ tối (Dark Mode / Theme Switcher)

> **Mục tiêu**: Thiết lập hệ thống Dark Mode toàn diện cho RoomSync sử dụng biến CSS (CSS Variables) và React Context API. Lưu trữ lựa chọn giao diện của người dùng vào `localStorage` và đồng bộ với tuỳ chọn hệ thống (system preference) của hệ điều hành.
> **Thời lượng ước tính**: 1.5–2 giờ
> **Phụ thuộc**: Plan 02 (Auth Frontend - Layout & Setup)
> **Độc lập với**: Plan 03, Plan 04, Plan 05, Plan 06, Plan 07, Plan 08, Plan 10, Plan 11, Plan 12, Plan 13, Plan 14, Plan 15, Plan 16, Plan 17

---

## Tổng quan

Sau khi hoàn thành plan này:

- Ứng dụng sẽ hỗ trợ 2 chủ đề: **Sáng (Light Mode)** và **Tối (Dark Mode)**.
- Người dùng có thể nhấn vào nút chuyển đổi giao diện (Theme Toggle Button) tích hợp ở Sidebar hoặc Header.
- Trạng thái giao diện sẽ được lưu lại tự động vào `localStorage` của trình duyệt.
- Lần đầu truy cập, ứng dụng tự động nhận diện thiết lập giao diện của hệ điều hành (Windows/macOS/Linux) để áp dụng giao diện phù hợp.
- Tất cả các thành phần giao diện (Background, Card, Text, Border, Inputs, Modal) sẽ chuyển đổi mượt mà nhờ hiệu ứng chuyển cảnh (transitions) mượt mà.

---

## 🎨 HỆ THỐNG BIẾN CSS & TOKENS MÀU SẮC

Chúng ta sẽ chuyển đổi các màu sắc hardcoded sang dạng CSS Variables định nghĩa tại `:root` trong file CSS toàn cục.

### 1. Định nghĩa Variables trong `frontend/src/index.css`

```css
/* Giao diện sáng (Light Mode) mặc định */
:root {
  /* Colors */
  --bg-primary: #ffffff;
  --bg-secondary: #f8fafc;
  --bg-tertiary: #f1f5f9;
  
  --text-primary: #0f172a;
  --text-secondary: #475569;
  --text-muted: #94a3b8;
  
  --border-color: #e2e8f0;
  --border-focus: #3b82f6;
  
  --card-bg: #ffffff;
  --card-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05);
  
  --sidebar-bg: #0f172a; /* giữ nguyên tone tối cho sidebar hoặc chuyển tùy ý */
  --sidebar-text: #f8fafc;
  
  --modal-bg: #ffffff;
  --input-bg: #ffffff;
  
  /* Status Colors */
  --status-available: #e2fbf0;
  --status-available-text: #10b981;
  --status-inuse: #fee2e2;
  --status-inuse-text: #ef4444;
  --status-upcoming: #fef3c7;
  --status-upcoming-text: #d97706;
}

/* Giao diện tối (Dark Mode) kích hoạt qua class .dark trên thẻ html/body */
:root.dark {
  /* Colors */
  --bg-primary: #0f172a;     /* Slate 900 */
  --bg-secondary: #1e293b;   /* Slate 800 */
  --bg-tertiary: #334155;    /* Slate 700 */
  
  --text-primary: #f8fafc;    /* Slate 50 */
  --text-secondary: #cbd5e1;  /* Slate 300 */
  --text-muted: #64748b;      /* Slate 500 */
  
  --border-color: #334155;    /* Slate 700 */
  --border-focus: #60a5fa;    /* Blue 400 */
  
  --card-bg: #1e293b;         /* Slate 800 */
  --card-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.3), 0 2px 4px -2px rgb(0 0 0 / 0.3);
  
  --sidebar-bg: #020617;     /* Slate 950 */
  --sidebar-text: #f8fafc;
  
  --modal-bg: #1e293b;
  --input-bg: #0f172a;
  
  /* Status Colors */
  --status-available: rgba(16, 185, 129, 0.15);
  --status-available-text: #34d399;
  --status-inuse: rgba(239, 68, 68, 0.15);
  --status-inuse-text: #f87171;
  --status-upcoming: rgba(217, 119, 6, 0.15);
  --status-upcoming-text: #fbbf24;
}

/* Hiệu ứng chuyển màu mượt mà cho toàn bộ ứng dụng */
body, 
div, 
section, 
span, 
p, 
h1, h2, h3, h4, h5, h6, 
a, 
button, 
input, 
select, 
textarea,
table,
th,
td {
  transition: background-color 0.25s ease, border-color 0.25s ease, color 0.25s ease, box-shadow 0.25s ease;
}
```

---

## 💻 IMPLEMENTATION

### 1. Theme Context Provider

**`frontend/src/context/ThemeContext.jsx` [NEW]**:
Quản lý trạng thái theme và đồng bộ hóa với DOM và `localStorage`.

```javascript
import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // Lấy theme đã lưu hoặc ưu tiên lựa chọn hệ thống
  const getInitialTheme = () => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) return savedTheme;

    const userPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return userPrefersDark ? 'dark' : 'light';
  };

  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
```

---

### 2. Theme Toggle Switch Component

**`frontend/src/components/layout/ThemeToggle.jsx` [NEW]**:
Nút bấm chuyển đổi đẹp mắt có micro-animation sử dụng `react-icons`.

```javascript
import React from 'react';
import { FiSun, FiMoon } from 'react-icons/fi';
import { useTheme } from '../../context/ThemeContext';
import './ThemeToggle.css';

const ThemeToggle = ({ collapsed }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      className={`theme-toggle-btn ${theme} ${collapsed ? 'collapsed' : ''}`}
      onClick={toggleTheme}
      title={theme === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
      aria-label="Toggle Theme"
    >
      <div className="icon-container">
        {theme === 'dark' ? <FiSun className="sun-icon" /> : <FiMoon className="moon-icon" />}
      </div>
      {!collapsed && (
        <span className="toggle-text">
          {theme === 'dark' ? 'Giao diện sáng' : 'Giao diện tối'}
        </span>
      )}
    </button>
  );
};

export default ThemeToggle;
```

**`frontend/src/components/layout/ThemeToggle.css` [NEW]**:
CSS hiệu ứng hover, active và transition cho nút.

```css
.theme-toggle-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 10px 14px;
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 500;
  outline: none;
  box-sizing: border-box;
}

.theme-toggle-btn:hover {
  background: var(--bg-tertiary);
}

.theme-toggle-btn.collapsed {
  justify-content: center;
  padding: 10px;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  margin: 0 auto;
}

.icon-container {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.sun-icon {
  color: #fbbf24; /* Amber 400 */
  animation: rotateSun 0.5s ease-out;
}

.moon-icon {
  color: #3b82f6; /* Blue 500 */
  animation: scaleMoon 0.5s ease-out;
}

.toggle-text {
  white-space: nowrap;
}

@keyframes rotateSun {
  from { transform: rotate(0deg) scale(0); }
  to { transform: rotate(360deg) scale(1); }
}

@keyframes scaleMoon {
  from { transform: scale(0) rotate(-45deg); }
  to { transform: scale(1) rotate(0); }
}
```

---

### 3. Tích hợp vào Layout chính

**`frontend/src/App.jsx` [MODIFY]**:
Bọc toàn bộ ứng dụng bằng `ThemeProvider`.

```diff
+ import { ThemeProvider } from './context/ThemeContext';

function App() {
  return (
+   <ThemeProvider>
      <Router>
        {/* các routes */}
      </Router>
+   </ThemeProvider>
  );
}
```

**`frontend/src/components/layout/Sidebar.jsx` [MODIFY]**:
Tích hợp `ThemeToggle` vào phần dưới của Sidebar (Footer Sidebar).

```diff
+ import ThemeToggle from './ThemeToggle';

function Sidebar({ collapsed }) {
  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Logo và Menu */}
    
      {/* Sidebar Footer */}
+     <div className="sidebar-footer">
+       <ThemeToggle collapsed={collapsed} />
+     </div>
    </aside>
  );
}
```

---

## 🛠️ KHÁI QUÁT CÁC FILE CẦN SỬA ĐỂ ÁP DỤNG VARS

Sau khi có hệ thống Theme, cần quét qua các file `.css` hiện tại để chuyển các thuộc tính màu cố định sang dạng biến:

1. **Background của Layout chính (`AppLayout.css` hoặc tương đương):**
   - Đổi `background-color: #f8fafc;` -> `background-color: var(--bg-secondary);`
2. **Thẻ Room Card / Container (`RoomCard.css` / `BookingCard.css`):**
   - Đổi `background-color: #ffffff;` -> `background-color: var(--card-bg);`
   - Đổi `border: 1px solid #e2e8f0;` -> `border: 1px solid var(--border-color);`
   - Đổi màu chữ chính -> `var(--text-primary)`
3. **Các thẻ đầu mục, labels, inputs:**
   - Đổi màu input nền trắng -> `background-color: var(--input-bg); color: var(--text-primary); border-color: var(--border-color)`
4. **Các Modal Popup (`Modal.css`):**
   - Đổi nền trắng -> `background-color: var(--modal-bg);`

---

## Cấu trúc file tạo mới & sửa

```text
frontend/src/
├── context/
│   └── ThemeContext.jsx              ★ MỚI
├── components/layout/
│   ├── ThemeToggle.jsx               ★ MỚI
│   ├── ThemeToggle.css               ★ MỚI
│   └── Sidebar.jsx                   (sửa — render ThemeToggle ở footer)
├── index.css                         (sửa — thêm CSS Variables & dark mode rules)
└── App.jsx                           (sửa — bọc ThemeProvider)
```

---

## 🏁 Tiêu chí hoàn thành (Checklist)

- [X] Click vào nút theme toggle thay đổi chủ đề Sáng ⇆ Tối ngay lập tức.
- [X] Giao diện thay đổi mượt mà (có hiệu ứng CSS transition, không giật màn hình).
- [X] Sau khi F5 (Reload) trang, giao diện được giữ nguyên trạng thái trước đó.
- [X] Xóa cache/localStorage, giao diện sẽ khởi tạo dựa trên theme preference của hệ điều hành.
- [X] Icon trên nút toggle hiển thị đúng hiệu ứng hoạt họa (Sun quay, Moon phóng to).
- [X] Các modal popup và dropdown đổi màu nền tối chuẩn xác, text rõ ràng không bị mờ/chìm màu.
