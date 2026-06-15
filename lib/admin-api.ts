import { apiData } from "./api";
import {
    SupportRequestSummary,
    VolunteerAssignment,
    SupportRequestStatus,
} from "./api";

export interface PageResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
    first: boolean;
    last: boolean;
    numberOfElements: number;
    empty: boolean;
}

export type UserRole = "REQUESTER" | "VOLUNTEER" | "ADMIN" | "COLLABORATOR";

export interface UserSummary {
    id: string;
    fullName: string;
    email: string;
    role: UserRole;
    avatarUrl: string | null;
    phoneNumber: string | null;
    isActive: boolean;
    createdAt: string;
}

export interface DashboardStats {
    total: number;
    active: number;
    inactive: number;
}

export interface UserDashboardStats extends DashboardStats {
    byRole: Record<UserRole, number>;
}

export interface SupportRequestDashboardStats {
    total: number;
    byStatus: Record<SupportRequestStatus, number>;
}

export interface CategoryDashboardStats {
    total: number;
    byStatus: { active: number; inactive: number };
    mostUsed: { id: string; name: string; count: number }[];
}

export interface PostDashboardStats {
    total: number;
    byStatus: { active: number; inactive: number };
}

export interface ReportDashboardStats {
    total: number;
    byStatus: { pending: number; reviewed: number; resolved: number };
    byTargetType: { support_request: number; post: number; user: number };
}

// Category types
export interface Category {
    id: string;
    name: string;
    code: string;
    description: string;
    iconUrl: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface SupportLocation {
    id: string;
    name: string;
    description: string;
    latitude: number;
    longitude: number;
    address: string;
    contactPhone: string;
    bankName: string | null;
    bankAccountNumber: string | null;
    isActive: boolean;
    createdAt: string;
}

export type ReportTargetType = "SUPPORT_REQUEST" | "POST" | "USER";
export type ReportStatus = "PENDING" | "REVIEWED" | "RESOLVED";

export interface Report {
    id: string;
    targetId: string;
    targetType: ReportTargetType;
    reason: string;
    description: string | null;
    reporterId: string;
    reporterName: string;
    status: ReportStatus;
    resolutionNote: string | null;
    resolvedById: string | null;
    resolvedByName: string | null;
    createdAt: string;
    resolvedAt: string | null;
}

export type RoleUpgradeRequestStatus =
    | "PENDING"
    | "APPROVED"
    | "REJECTED"
    | "CANCELLED";

export interface RoleUpgradeRequest {
    id: string;
    userId: string;
    userFullName: string;
    volunteerId: string;
    reason: string;
    supportingDocumentsUrl: string | null;
    status: RoleUpgradeRequestStatus;
    rejectionReason: string | null;
    processedById: string | null;
    processedByName: string | null;
    createdAt: string;
    processedAt: string | null;
}

export interface CommunityFund {
    id: string;
    name: string;
    description: string;
    totalBalance: number;
    isActive: boolean;
    createdAt: string;
}

export interface Donation {
    id: string;
    fundId: string;
    donorName: string;
    amount: number;
    description: string | null;
    donatedAt: string;
}

export interface Expense {
    id: string;
    fundId: string;
    fundName: string;
    supportRequestId: string | null;
    supportRequestTitle: string | null;
    amount: number;
    description: string;
    createdById: string;
    createdByName: string;
    createdAt: string;
}

export function getAdminDashboardUsers(
    accessToken: string,
): Promise<UserDashboardStats> {
    return apiData<UserDashboardStats>(
        "/api/admin/dashboard/users",
        { method: "GET" },
        accessToken,
    );
}
export function getAdminDashboardSupportRequests(
    accessToken: string,
): Promise<SupportRequestDashboardStats> {
    return apiData<SupportRequestDashboardStats>(
        "/api/admin/dashboard/support-requests",
        { method: "GET" },
        accessToken,
    );
}
export function getAdminDashboardCategories(
    accessToken: string,
): Promise<CategoryDashboardStats> {
    return apiData<CategoryDashboardStats>(
        "/api/admin/dashboard/categories",
        { method: "GET" },
        accessToken,
    );
}
export function getAdminDashboardPosts(
    accessToken: string,
): Promise<PostDashboardStats> {
    return apiData<PostDashboardStats>(
        "/api/admin/dashboard/posts",
        { method: "GET" },
        accessToken,
    );
}
export function getAdminDashboardReports(
    accessToken: string,
): Promise<ReportDashboardStats> {
    return apiData<ReportDashboardStats>(
        "/api/admin/dashboard/reports",
        { method: "GET" },
        accessToken,
    );
}

export function getUsersList(
    accessToken: string,
    params: {
        keyword?: string;
        role?: UserRole;
        page?: number;
        size?: number;
        sort?: string;
    },
): Promise<PageResponse<UserSummary>> {
    const query = new URLSearchParams();
    if (params.keyword) query.set("keyword", params.keyword);
    if (params.role) query.set("role", params.role);
    if (params.page !== undefined) query.set("page", params.page.toString());
    if (params.size !== undefined) query.set("size", params.size.toString());
    if (params.sort) query.set("sort", params.sort);

    return apiData<PageResponse<UserSummary>>(
        `/api/v1/users?${query.toString()}`,
        { method: "GET" },
        accessToken,
    );
}

export function getUserDetail(
    accessToken: string,
    userId: string,
): Promise<UserSummary> {
    return apiData<UserSummary>(
        `/api/v1/users/${encodeURIComponent(userId)}`,
        { method: "GET" },
        accessToken,
    );
}

export function patchUserRole(
    accessToken: string,
    userId: string,
    payload: { role: UserRole },
): Promise<void> {
    return apiData<void>(
        `/api/v1/users/${encodeURIComponent(userId)}/role`,
        {
            method: "PATCH",
            body: JSON.stringify(payload),
        },
        accessToken,
    );
}

export function patchUserStatus(
    accessToken: string,
    userId: string,
    payload: { isActive: boolean },
): Promise<void> {
    return apiData<void>(
        `/api/v1/users/${encodeURIComponent(userId)}/status`,
        {
            method: "PATCH",
            body: JSON.stringify(payload),
        },
        accessToken,
    );
}

export function getAdminSupportRequests(
    accessToken: string,
    params: {
        status?: SupportRequestStatus;
        categoryId?: string;
        createdFrom?: string;
        createdTo?: string;
    },
): Promise<SupportRequestSummary[]> {
    const query = new URLSearchParams();
    if (params.status) query.set("status", params.status);
    if (params.categoryId) query.set("categoryId", params.categoryId);
    if (params.createdFrom) query.set("createdFrom", params.createdFrom);
    if (params.createdTo) query.set("createdTo", params.createdTo);

    return apiData<SupportRequestSummary[]>(
        `/api/v1/support-requests?${query.toString()}`,
        { method: "GET" },
        accessToken,
    );
}

export function approveSupportRequest(
    accessToken: string,
    requestId: string,
): Promise<void> {
    return apiData<void>(
        `/api/v1/support-requests/${encodeURIComponent(requestId)}/approve`,
        { method: "PATCH" },
        accessToken,
    );
}

export function rejectSupportRequest(
    accessToken: string,
    requestId: string,
    payload: { rejectionReason: string },
): Promise<void> {
    return apiData<void>(
        `/api/v1/support-requests/${encodeURIComponent(requestId)}/reject`,
        {
            method: "PATCH",
            body: JSON.stringify(payload),
        },
        accessToken,
    );
}

export function assignSupportLocationToRequest(
    accessToken: string,
    requestId: string,
    payload: { supportLocationId: string },
): Promise<void> {
    return apiData<void>(
        `/api/v1/support-requests/${encodeURIComponent(requestId)}/assign-support-location`,
        {
            method: "PATCH",
            body: JSON.stringify(payload),
        },
        accessToken,
    );
}

export function getAllReports(accessToken: string): Promise<Report[]> {
    return apiData<Report[]>("/api/reports", { method: "GET" }, accessToken);
}

export function getPendingReports(accessToken: string): Promise<Report[]> {
    return apiData<Report[]>(
        "/api/reports/pending",
        { method: "GET" },
        accessToken,
    );
}

export function getReportDetail(
    accessToken: string,
    reportId: string,
): Promise<Report> {
    return apiData<Report>(
        `/api/reports/${encodeURIComponent(reportId)}`,
        { method: "GET" },
        accessToken,
    );
}

export function reviewReport(
    accessToken: string,
    reportId: string,
    payload: { resolutionNote: string },
): Promise<void> {
    return apiData<void>(
        `/api/reports/${encodeURIComponent(reportId)}/review`,
        {
            method: "PATCH",
            body: JSON.stringify(payload),
        },
        accessToken,
    );
}

export function resolveReport(
    accessToken: string,
    reportId: string,
    payload: { resolutionNote: string; supportRequestRejectionReason?: string },
): Promise<void> {
    return apiData<void>(
        `/api/reports/${encodeURIComponent(reportId)}/resolve`,
        {
            method: "PATCH",
            body: JSON.stringify(payload),
        },
        accessToken,
    );
}

export function getAdminCategories(
    accessToken: string,
    activeOnly: boolean = false,
): Promise<Category[]> {
    return apiData<Category[]>(
        `/api/v1/categories?activeOnly=${activeOnly}`,
        { method: "GET" },
        accessToken,
    );
}

export function createCategory(
    accessToken: string,
    payload: Omit<Category, "id" | "isActive" | "createdAt" | "updatedAt">,
): Promise<Category> {
    return apiData<Category>(
        "/api/v1/categories",
        {
            method: "POST",
            body: JSON.stringify(payload),
        },
        accessToken,
    );
}

export function updateCategory(
    accessToken: string,
    categoryId: string,
    payload: Omit<Category, "id" | "isActive" | "createdAt" | "updatedAt">,
): Promise<Category> {
    return apiData<Category>(
        `/api/v1/categories/${encodeURIComponent(categoryId)}`,
        {
            method: "PUT",
            body: JSON.stringify(payload),
        },
        accessToken,
    );
}

export function patchCategoryStatus(
    accessToken: string,
    categoryId: string,
    payload: { isActive: boolean },
): Promise<void> {
    return apiData<void>(
        `/api/v1/categories/${encodeURIComponent(categoryId)}/status`,
        {
            method: "PATCH",
            body: JSON.stringify(payload),
        },
        accessToken,
    );
}

export function getAdminSupportLocations(
    accessToken: string,
    activeOnly: boolean = false,
): Promise<SupportLocation[]> {
    return apiData<SupportLocation[]>(
        `/api/v1/support-locations?activeOnly=${activeOnly}`,
        { method: "GET" },
        accessToken,
    );
}

export function createSupportLocation(
    accessToken: string,
    payload: Omit<SupportLocation, "id" | "isActive" | "createdAt">,
): Promise<SupportLocation> {
    return apiData<SupportLocation>(
        "/api/v1/support-locations",
        {
            method: "POST",
            body: JSON.stringify(payload),
        },
        accessToken,
    );
}

export function updateSupportLocation(
    accessToken: string,
    locationId: string,
    payload: Omit<SupportLocation, "id" | "isActive" | "createdAt">,
): Promise<SupportLocation> {
    return apiData<SupportLocation>(
        `/api/v1/support-locations/${encodeURIComponent(locationId)}`,
        {
            method: "PUT",
            body: JSON.stringify(payload),
        },
        accessToken,
    );
}

export function patchSupportLocationStatus(
    accessToken: string,
    locationId: string,
    payload: { isActive: boolean },
): Promise<void> {
    return apiData<void>(
        `/api/v1/support-locations/${encodeURIComponent(locationId)}/status`,
        {
            method: "PATCH",
            body: JSON.stringify(payload),
        },
        accessToken,
    );
}

export function getRoleUpgradeRequestsList(
    accessToken: string,
    params: { status?: RoleUpgradeRequestStatus; page?: number; size?: number },
): Promise<PageResponse<RoleUpgradeRequest>> {
    const query = new URLSearchParams();
    if (params.status) query.set("status", params.status);
    if (params.page !== undefined) query.set("page", params.page.toString());
    if (params.size !== undefined) query.set("size", params.size.toString());
    query.set("sort", "createdAt,desc");

    return apiData<PageResponse<RoleUpgradeRequest>>(
        `/api/v1/role-upgrade-requests?${query.toString()}`,
        { method: "GET" },
        accessToken,
    );
}

export function approveRoleUpgradeRequest(
    accessToken: string,
    requestId: string,
): Promise<void> {
    return apiData<void>(
        `/api/v1/role-upgrade-requests/${encodeURIComponent(requestId)}/approve`,
        { method: "PATCH" },
        accessToken,
    );
}

export function rejectRoleUpgradeRequest(
    accessToken: string,
    requestId: string,
    payload: { rejectionReason: string },
): Promise<void> {
    return apiData<void>(
        `/api/v1/role-upgrade-requests/${encodeURIComponent(requestId)}/reject`,
        {
            method: "PATCH",
            body: JSON.stringify(payload),
        },
        accessToken,
    );
}

export function getCommunityFunds(
    accessToken: string,
    activeOnly: boolean = false,
): Promise<CommunityFund[]> {
    return apiData<CommunityFund[]>(
        `/api/v1/community-funds?activeOnly=${activeOnly}`,
        { method: "GET" },
        accessToken,
    );
}

export function createCommunityFund(
    accessToken: string,
    payload: Omit<
        CommunityFund,
        "id" | "isActive" | "createdAt" | "totalBalance"
    >,
): Promise<CommunityFund> {
    return apiData<CommunityFund>(
        "/api/v1/community-funds",
        {
            method: "POST",
            body: JSON.stringify(payload),
        },
        accessToken,
    );
}

export function updateCommunityFund(
    accessToken: string,
    fundId: string,
    payload: Omit<CommunityFund, "id" | "createdAt" | "totalBalance">,
): Promise<CommunityFund> {
    return apiData<CommunityFund>(
        `/api/v1/community-funds/${encodeURIComponent(fundId)}`,
        {
            method: "PUT",
            body: JSON.stringify(payload),
        },
        accessToken,
    );
}

export function getFundExpenses(
    accessToken: string,
    fundId: string,
): Promise<Expense[]> {
    return apiData<Expense[]>(
        `/api/v1/community-funds/${encodeURIComponent(fundId)}/expenses`,
        { method: "GET" },
        accessToken,
    );
}

export function createExpense(
    accessToken: string,
    payload: {
        fundId: string;
        supportRequestId: string | null;
        amount: number;
        description: string;
    },
): Promise<Expense> {
    return apiData<Expense>(
        "/api/v1/expenses",
        {
            method: "POST",
            body: JSON.stringify(payload),
        },
        accessToken,
    );
}
