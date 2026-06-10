import type {
  SupportNeedUnit,
  SupportRequestStatus,
  SupportType,
  UserRole,
  VolunteerAssignmentStatus,
} from "./api";

export const SUPPORT_REQUEST_STATUS_LABELS: Record<
  SupportRequestStatus,
  string
> = {
  PENDING: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Từ chối",
  IN_PROGRESS: "Đang hỗ trợ",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
};

export const VOLUNTEER_STATUS_LABELS: Record<
  VolunteerAssignmentStatus,
  string
> = {
  PENDING: "Chờ xác nhận",
  ACCEPTED: "Đã chấp nhận",
  REJECTED: "Bị từ chối",
  CANCELLED: "Đã hủy",
  COMPLETED: "Đã hoàn thành",
};

export const ROLE_LABELS: Record<UserRole, string> = {
  REQUESTER: "Người cần hỗ trợ",
  VOLUNTEER: "Tình nguyện viên",
  ADMIN: "Quản trị viên",
  COLLABORATOR: "Cộng tác viên",
};

export const SUPPORT_TYPE_LABELS: Record<SupportType, string> = {
  MONEY: "Tiền",
  GOODS: "Vật phẩm",
};

export const SUPPORT_NEED_UNIT_LABELS: Record<SupportNeedUnit, string> = {
  VND: "VNĐ",
  KG: "kg",
  PIECE: "cái",
  BOX: "thùng",
  LITER: "lít",
  PACKAGE: "gói",
  SET: "bộ",
  PERSON: "người",
  OTHER: "đơn vị khác",
};

export const SUPPORT_NEED_UNITS = Object.keys(
  SUPPORT_NEED_UNIT_LABELS,
) as SupportNeedUnit[];

export function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return "Chưa cập nhật";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatQuantity(
  value: number,
  unit: SupportNeedUnit,
): string {
  if (unit === "VND") {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(value);
  }

  return `${new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 2,
  }).format(value)} ${SUPPORT_NEED_UNIT_LABELS[unit]}`;
}

export function statusClassName(status: SupportRequestStatus): string {
  const styles: Record<SupportRequestStatus, string> = {
    PENDING: "border-amber-200 bg-amber-50 text-amber-800",
    APPROVED: "border-sky-200 bg-sky-50 text-sky-800",
    REJECTED: "border-rose-200 bg-rose-50 text-rose-800",
    IN_PROGRESS: "border-violet-200 bg-violet-50 text-violet-800",
    COMPLETED: "border-emerald-200 bg-emerald-50 text-emerald-800",
    CANCELLED: "border-slate-200 bg-slate-100 text-slate-600",
  };

  return styles[status];
}

export function assignmentStatusClassName(
  status: VolunteerAssignmentStatus,
): string {
  const styles: Record<VolunteerAssignmentStatus, string> = {
    PENDING: "border-amber-200 bg-amber-50 text-amber-800",
    ACCEPTED: "border-sky-200 bg-sky-50 text-sky-800",
    REJECTED: "border-rose-200 bg-rose-50 text-rose-800",
    CANCELLED: "border-slate-200 bg-slate-100 text-slate-600",
    COMPLETED: "border-emerald-200 bg-emerald-50 text-emerald-800",
  };

  return styles[status];
}
