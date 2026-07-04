import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  vi: {
    translation: {
      settings: {
        title: "Cấu hình Cài đặt",
        tabs: {
          personal: "Cá nhân & Hiển thị",
          notifications: "Thông báo",
          system: "Quản trị hệ thống"
        },
        notifications: {
          emailTitle: "Nhận thông báo qua Email",
          inAppTitle: "Nhận thông báo trong Ứng dụng",
          approved: "Đơn đặt phòng được duyệt",
          rejected: "Đơn đặt phòng bị từ chối",
          cancelled: "Đơn đặt phòng bị hủy",
          reminder: "Nhắc nhở trước giờ họp 15 phút"
        },
        display: {
          title: "Cài đặt hiển thị",
          language: "Ngôn ngữ",
          theme: "Chủ đề",
          themeOptions: {
            light: "Sáng",
            dark: "Tối",
            system: "Đồng bộ hệ thống"
          },
          calendar: "Chế độ xem lịch mặc định",
          calendarOptions: {
            day: "Lịch ngày",
            week: "Lịch tuần",
            month: "Lịch tháng"
          }
        },
        system: {
          title: "Cấu hình vận hành hệ thống",
          workHourStart: "Giờ bắt đầu làm việc",
          workHourEnd: "Giờ kết thúc làm việc",
          maxBookingDaysAhead: "Số ngày được đặt trước tối đa",
          minBookingDurationMin: "Thời gian họp tối thiểu (phút)",
          maxBookingDurationMin: "Thời gian họp tối đa (phút)",
          noShowReleaseTimeMin: "Thời gian tự động giải phóng phòng khi trễ check-in (phút)",
          allowCancelApproved: "Cho phép người dùng tự hủy lịch khi đã được duyệt",
          saveSuccess: "Cập nhật cấu hình hệ thống thành công",
          saveError: "Không thể cập nhật cấu hình hệ thống"
        },
        saveBtn: "Lưu thay đổi",
        saveSuccess: "Cập nhật cài đặt thành công"
      }
    }
  },
  en: {
    translation: {
      settings: {
        title: "Settings Configuration",
        tabs: {
          personal: "Personal & Display",
          notifications: "Notifications",
          system: "System Administration"
        },
        notifications: {
          emailTitle: "Receive Email Notifications",
          inAppTitle: "Receive In-App Notifications",
          approved: "Approved bookings",
          rejected: "Rejected bookings",
          cancelled: "Cancelled bookings",
          reminder: "Meeting reminders (15 mins before)"
        },
        display: {
          title: "Display Settings",
          language: "Language",
          theme: "Theme",
          themeOptions: {
            light: "Light",
            dark: "Dark",
            system: "System sync"
          },
          calendar: "Default Calendar View",
          calendarOptions: {
            day: "Day view",
            week: "Week view",
            month: "Month view"
          }
        },
        system: {
          title: "System Operations Configuration",
          workHourStart: "Working hours start time",
          workHourEnd: "Working hours end time",
          maxBookingDaysAhead: "Max booking days in advance",
          minBookingDurationMin: "Min booking duration (minutes)",
          maxBookingDurationMin: "Max booking duration (minutes)",
          noShowReleaseTimeMin: "Auto-release time limit for late check-in (minutes)",
          allowCancelApproved: "Allow users to cancel approved bookings",
          saveSuccess: "System configuration updated successfully",
          saveError: "Failed to update system configuration"
        },
        saveBtn: "Save Changes",
        saveSuccess: "Settings updated successfully"
      }
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'vi',
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
