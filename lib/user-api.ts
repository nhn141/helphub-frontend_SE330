import { apiData } from "./api";

export interface UserProfileResponse {
    id: string;
    fullName: string;
    email: string;
    role: "REQUESTER" | "VOLUNTEER" | "ADMIN" | "COLLABORATOR";
    avatarUrl: string | null;
    phone: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    lastLoginAt: string;
}

export interface UpdateProfileRequest {
    fullName: string;
    phone?: string | null;
    avatarUrl?: string | null;
}

export type RoleUpgradeRequestStatus =
    | "PENDING"
    | "APPROVED"
    | "REJECTED"
    | "CANCELLED";

export interface RoleUpgradeRequestResponse {
    id: string;
    userId: string;
    reason: string;
    supportingDocumentsUrl: string | null;
    status: RoleUpgradeRequestStatus;
    rejectionReason: string | null;
    createdAt: string;
}

export interface CreateRoleUpgradePayload {
    reason: string;
    supportingDocumentsUrl?: string | null;
}

export interface PageResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
}

export function getMyProfile(
    accessToken: string,
): Promise<UserProfileResponse> {
    return apiData<UserProfileResponse>(
        "/api/v1/users/me",
        { method: "GET" },
        accessToken,
    );
}

export function updateMyProfile(
    accessToken: string,
    payload: UpdateProfileRequest,
): Promise<UserProfileResponse> {
    return apiData<UserProfileResponse>(
        "/api/v1/users/me",
        {
            method: "PATCH",
            body: JSON.stringify(payload),
        },
        accessToken,
    );
}

export function getMyRoleUpgradeRequests(
    accessToken: string,
    page: number = 0,
    size: number = 10,
): Promise<PageResponse<RoleUpgradeRequestResponse>> {
    return apiData<PageResponse<RoleUpgradeRequestResponse>>(
        `/api/v1/role-upgrade-requests/me?page=${page}&size=${size}`,
        { method: "GET" },
        accessToken,
    );
}

export function createRoleUpgradeRequest(
    accessToken: string,
    payload: CreateRoleUpgradePayload,
): Promise<RoleUpgradeRequestResponse> {
    return apiData<RoleUpgradeRequestResponse>(
        "/api/v1/role-upgrade-requests/me",
        {
            method: "POST",
            body: JSON.stringify(payload),
        },
        accessToken,
    );
}
