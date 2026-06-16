export type UserRole = "REQUESTER" | "VOLUNTEER" | "ADMIN" | "COLLABORATOR";

export type LoginPayload = {
    email: string;
    password: string;
};

export type RegisterPayload = LoginPayload & {
    fullName: string;
    phone?: string;
    role: Extract<UserRole, "REQUESTER" | "VOLUNTEER">;
};

export type AuthResponse = {
    accessToken: string;
    refreshToken: string;
    tokenType: "Bearer";
    accessTokenExpiresIn: number;
    refreshTokenExpiresIn: number;
    message?: string | null;
};

export type RegisterResponse = Omit<
    AuthResponse,
    "accessToken" | "refreshToken" | "tokenType"
> & {
    accessToken: string | null;
    refreshToken: string | null;
    tokenType: "Bearer" | null;
};

export type VerifyEmailPayload = {
    email: string;
    otp: string;
};

export type ResendEmailOtpPayload = {
    email: string;
};

export type ForgotPasswordPayload = {
    email: string;
};

export type ResetPasswordPayload = {
    email: string;
    otp: string;
    newPassword: string;
};

export type UserProfile = {
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
    role: UserRole;
    avatarUrl: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    lastLoginAt: string | null;
};

export type SupportRequestStatus =
    | "PENDING"
    | "APPROVED"
    | "REJECTED"
    | "IN_PROGRESS"
    | "COMPLETED"
    | "CANCELLED";

export type CategorySummary = {
    id: string;
    name: string;
    code: string;
    iconUrl: string | null;
    isActive: boolean;
    createdAt: string;
};

export type SupportLocationSummary = {
    id: string;
    name: string;
    latitude: number | null;
    longitude: number | null;
    address: string | null;
    contactPhone: string | null;
    isActive: boolean;
    createdAt: string;
};

export type SupportRequestPayload = {
    title: string;
    description: string;
    categoryId: string;
    address?: string;
    latitude?: number;
    longitude?: number;
};

export type SupportRequestSummary = {
    id: string;
    title: string;
    categoryName: string;
    categoryId: string;
    requesterId: string;
    requesterName: string;
    requesterAvatarUrl: string | null;
    status: SupportRequestStatus;
    address: string | null;
    latitude: number | null;
    longitude: number | null;
    createdAt: string;
};

export type SupportRequestDetail = SupportRequestSummary & {
    description: string;
    assignedSupportLocationId: string | null;
    assignedSupportLocationName: string | null;
    reviewedBy: string | null;
    reviewedAt: string | null;
    rejectionReason: string | null;
    updatedAt: string;
};

export type SupportType = "MONEY" | "GOODS";

export type SupportNeedUnit =
    | "VND"
    | "KG"
    | "PIECE"
    | "BOX"
    | "LITER"
    | "PACKAGE"
    | "SET"
    | "PERSON"
    | "OTHER";

export type SupportNeedPayload = {
    supportType: SupportType;
    needName: string;
    unit: SupportNeedUnit;
    requiredQuantity: number;
};

export type SupportNeed = {
    id: string;
    supportRequestId: string;
    supportRequestTitle: string;
    supportType: SupportType;
    needName: string;
    unit: SupportNeedUnit;
    requiredQuantity: number;
    receivedQuantity: number;
    remainingQuantity: number;
    isFulfilled: boolean;
    createdAt: string;
    updatedAt: string;
};

export type SupportNeedContribution = {
    id: string;
    supportNeedId: string;
    needName: string;
    contributorId: string;
    contributorName: string;
    quantity: number;
    note: string | null;
    createdAt: string;
};

export type CreateReportPayload = {
    targetType: "POST" | "SUPPORT_REQUEST" | "USER";
    targetId: string;
    reason: string;
    description?: string;
};

export type VolunteerAssignmentStatus =
    | "PENDING"
    | "ACCEPTED"
    | "REJECTED"
    | "CANCELLED"
    | "COMPLETED";

export type VolunteerAssignment = {
    supportRequestId: string;
    supportRequestTitle: string;
    supportRequestStatus: SupportRequestStatus;
    requesterId: string;
    requesterName: string;
    volunteerId: string;
    volunteerName: string;
    volunteerEmail: string;
    volunteerPhone: string | null;
    status: VolunteerAssignmentStatus;
    reviewedBy: string | null;
    reviewedByName: string | null;
    reviewedAt: string | null;
    rejectionReason: string | null;
    assignedAt: string;
    updatedAt: string;
};

type ApiEnvelope<T> = {
    success: boolean;
    message: string;
    data: T;
};

export class ApiError extends Error {
    status: number;
    body: unknown;

    constructor(message: string, status: number, body: unknown) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.body = body;
    }
}

export const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8081";

async function parseResponse<T>(response: Response): Promise<T> {
    const text = await response.text();
    const body = text ? safeJsonParse(text) : null;

    if (!response.ok) {
        const message =
            getBodyMessage(body) || response.statusText || "Request failed";
        throw new ApiError(message, response.status, body);
    }

    return body as T;
}

function safeJsonParse(text: string): unknown {
    try {
        return JSON.parse(text);
    } catch {
        return text;
    }
}

function getBodyMessage(body: unknown): string | null {
    if (body && typeof body === "object" && "message" in body) {
        const message = (body as { message?: unknown }).message;
        return typeof message === "string" ? message : null;
    }

    return null;
}

async function apiRequest<T>(
    path: string,
    init: RequestInit = {},
    accessToken?: string,
): Promise<T> {
    const headers = new Headers(init.headers);

    if (!headers.has("Content-Type") && !(init.body instanceof FormData)) {
        headers.set("Content-Type", "application/json");
    }

    if (accessToken) {
        headers.set("Authorization", `Bearer ${accessToken}`);
    }

    let response: Response;

    try {
        response = await fetch(`${API_BASE_URL}${path}`, {
            ...init,
            headers,
        });
    } catch (error) {
        throw new ApiError(
            `Unable to reach HelpHub API at ${API_BASE_URL}`,
            0,
            error,
        );
    }

    return parseResponse<T>(response);
}

export async function apiData<T>(
    path: string,
    init: RequestInit,
    accessToken: string,
): Promise<T> {
    const response = await apiRequest<ApiEnvelope<T>>(path, init, accessToken);
    return response.data;
}

export function login(payload: LoginPayload): Promise<AuthResponse> {
    return apiRequest<AuthResponse>("/api/v1/auth/login", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export function register(payload: RegisterPayload): Promise<RegisterResponse> {
    return apiRequest<RegisterResponse>("/api/v1/auth/register", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export async function verifyEmail(
    payload: VerifyEmailPayload,
): Promise<string> {
    const response = await apiRequest<ApiEnvelope<null>>(
        "/api/v1/auth/verify-email",
        {
            method: "POST",
            body: JSON.stringify(payload),
        },
    );

    return response.message;
}

export async function resendEmailOtp(
    payload: ResendEmailOtpPayload,
): Promise<string> {
    const response = await apiRequest<ApiEnvelope<null>>(
        "/api/v1/auth/resend-otp",
        {
            method: "POST",
            body: JSON.stringify(payload),
        },
    );

    return response.message;
}

export async function forgotPassword(
    payload: ForgotPasswordPayload,
): Promise<string> {
    const response = await apiRequest<ApiEnvelope<null>>(
        "/api/v1/auth/forgot-password",
        {
            method: "POST",
            body: JSON.stringify(payload),
        },
    );

    return response.message;
}

export async function resetPassword(
    payload: ResetPasswordPayload,
): Promise<string> {
    const response = await apiRequest<ApiEnvelope<null>>(
        "/api/v1/auth/reset-password",
        {
            method: "POST",
            body: JSON.stringify(payload),
        },
    );

    return response.message;
}

export function refreshSession(refreshToken: string): Promise<AuthResponse> {
    return apiRequest<AuthResponse>("/api/v1/auth/refresh", {
        method: "POST",
        body: JSON.stringify({ refreshToken }),
    });
}

export function getMyProfile(accessToken: string): Promise<UserProfile> {
    return apiData<UserProfile>(
        "/api/v1/users/me",
        { method: "GET" },
        accessToken,
    );
}

export function getCategories(accessToken: string): Promise<CategorySummary[]> {
    return apiData<CategorySummary[]>(
        "/api/v1/categories?activeOnly=true",
        { method: "GET" },
        accessToken,
    );
}

export function getSupportLocations(
    accessToken: string,
): Promise<SupportLocationSummary[]> {
    return apiData<SupportLocationSummary[]>(
        "/api/v1/support-locations?activeOnly=true",
        { method: "GET" },
        accessToken,
    );
}

export function getSupportRequests(
    accessToken: string,
    status?: SupportRequestStatus,
): Promise<SupportRequestSummary[]> {
    const query = status ? `?status=${encodeURIComponent(status)}` : "";
    return apiData<SupportRequestSummary[]>(
        `/api/v1/support-requests${query}`,
        { method: "GET" },
        accessToken,
    );
}

export function getMySupportRequests(
    accessToken: string,
): Promise<SupportRequestSummary[]> {
    return apiData<SupportRequestSummary[]>(
        "/api/v1/support-requests/my-requests",
        { method: "GET" },
        accessToken,
    );
}

export function getSupportRequest(
    accessToken: string,
    id: string,
): Promise<SupportRequestDetail> {
    return apiData<SupportRequestDetail>(
        `/api/v1/support-requests/${encodeURIComponent(id)}`,
        { method: "GET" },
        accessToken,
    );
}

export function createSupportRequest(
    accessToken: string,
    payload: SupportRequestPayload,
): Promise<SupportRequestDetail> {
    return apiData<SupportRequestDetail>(
        "/api/v1/support-requests",
        {
            method: "POST",
            body: JSON.stringify(payload),
        },
        accessToken,
    );
}

export function updateSupportRequest(
    accessToken: string,
    id: string,
    payload: SupportRequestPayload,
): Promise<SupportRequestDetail> {
    return apiData<SupportRequestDetail>(
        `/api/v1/support-requests/${encodeURIComponent(id)}`,
        {
            method: "PUT",
            body: JSON.stringify(payload),
        },
        accessToken,
    );
}

export function approveSupportRequest(
    accessToken: string,
    id: string,
): Promise<SupportRequestDetail> {
    return apiData<SupportRequestDetail>(
        `/api/v1/support-requests/${encodeURIComponent(id)}/approve`,
        { method: "PATCH" },
        accessToken,
    );
}

export function rejectSupportRequest(
    accessToken: string,
    id: string,
    rejectionReason: string,
): Promise<SupportRequestDetail> {
    return apiData<SupportRequestDetail>(
        `/api/v1/support-requests/${encodeURIComponent(id)}/reject`,
        {
            method: "PATCH",
            body: JSON.stringify({ rejectionReason }),
        },
        accessToken,
    );
}

export function assignSupportLocation(
    accessToken: string,
    id: string,
    supportLocationId: string,
): Promise<SupportRequestDetail> {
    return apiData<SupportRequestDetail>(
        `/api/v1/support-requests/${encodeURIComponent(id)}/assign-support-location`,
        {
            method: "PATCH",
            body: JSON.stringify({ supportLocationId }),
        },
        accessToken,
    );
}

export function getSupportNeeds(
    accessToken: string,
    supportRequestId: string,
): Promise<SupportNeed[]> {
    return apiData<SupportNeed[]>(
        `/api/v1/support-requests/${encodeURIComponent(supportRequestId)}/needs`,
        { method: "GET" },
        accessToken,
    );
}

export function createSupportNeed(
    accessToken: string,
    supportRequestId: string,
    payload: SupportNeedPayload,
): Promise<SupportNeed> {
    return apiData<SupportNeed>(
        `/api/v1/support-requests/${encodeURIComponent(supportRequestId)}/needs`,
        {
            method: "POST",
            body: JSON.stringify(payload),
        },
        accessToken,
    );
}

export function updateSupportNeed(
    accessToken: string,
    needId: string,
    payload: SupportNeedPayload,
): Promise<SupportNeed> {
    return apiData<SupportNeed>(
        `/api/v1/support-needs/${encodeURIComponent(needId)}`,
        {
            method: "PUT",
            body: JSON.stringify(payload),
        },
        accessToken,
    );
}

export async function deleteSupportNeed(
    accessToken: string,
    needId: string,
): Promise<void> {
    await apiData<null>(
        `/api/v1/support-needs/${encodeURIComponent(needId)}`,
        { method: "DELETE" },
        accessToken,
    );
}

export function getSupportNeedContributions(
    accessToken: string,
    needId: string,
): Promise<SupportNeedContribution[]> {
    return apiData<SupportNeedContribution[]>(
        `/api/v1/support-needs/${encodeURIComponent(needId)}/contributions`,
        { method: "GET" },
        accessToken,
    );
}

export function contributeToSupportNeed(
    accessToken: string,
    needId: string,
    quantity: number,
    note?: string,
): Promise<SupportNeedContribution> {
    return apiData<SupportNeedContribution>(
        `/api/v1/support-needs/${encodeURIComponent(needId)}/contributions`,
        {
            method: "POST",
            body: JSON.stringify({ quantity, note: note || undefined }),
        },
        accessToken,
    );
}

export function applyToSupportRequest(
    accessToken: string,
    supportRequestId: string,
): Promise<VolunteerAssignment> {
    return apiData<VolunteerAssignment>(
        `/api/v1/volunteer-assignments/support-requests/${encodeURIComponent(supportRequestId)}/apply`,
        { method: "POST" },
        accessToken,
    );
}

export function getMyVolunteerAssignments(
    accessToken: string,
): Promise<VolunteerAssignment[]> {
    return apiData<VolunteerAssignment[]>(
        "/api/v1/volunteer-assignments/my-assignments",
        { method: "GET" },
        accessToken,
    );
}

export function getVolunteerAssignments(
    accessToken: string,
    supportRequestId: string,
): Promise<VolunteerAssignment[]> {
    return apiData<VolunteerAssignment[]>(
        `/api/v1/volunteer-assignments/support-requests/${encodeURIComponent(supportRequestId)}`,
        { method: "GET" },
        accessToken,
    );
}

export function approveVolunteerAssignment(
    accessToken: string,
    supportRequestId: string,
    volunteerId: string,
): Promise<VolunteerAssignment> {
    return apiData<VolunteerAssignment>(
        `/api/v1/volunteer-assignments/support-requests/${encodeURIComponent(supportRequestId)}/volunteers/${encodeURIComponent(volunteerId)}/approve`,
        { method: "PATCH" },
        accessToken,
    );
}

export function rejectVolunteerAssignment(
    accessToken: string,
    supportRequestId: string,
    volunteerId: string,
    rejectionReason: string,
): Promise<VolunteerAssignment> {
    return apiData<VolunteerAssignment>(
        `/api/v1/volunteer-assignments/support-requests/${encodeURIComponent(supportRequestId)}/volunteers/${encodeURIComponent(volunteerId)}/reject`,
        {
            method: "PATCH",
            body: JSON.stringify({ rejectionReason }),
        },
        accessToken,
    );
}

export function cancelVolunteerAssignment(
    accessToken: string,
    supportRequestId: string,
): Promise<VolunteerAssignment> {
    return apiData<VolunteerAssignment>(
        `/api/v1/volunteer-assignments/support-requests/${encodeURIComponent(supportRequestId)}/cancel`,
        { method: "PATCH" },
        accessToken,
    );
}

export function completeVolunteerAssignment(
    accessToken: string,
    supportRequestId: string,
): Promise<VolunteerAssignment> {
    return apiData<VolunteerAssignment>(
        `/api/v1/volunteer-assignments/support-requests/${encodeURIComponent(supportRequestId)}/complete`,
        { method: "PATCH" },
        accessToken,
    );
}

export function createReport(
    accessToken: string,
    payload: CreateReportPayload,
): Promise<unknown> {
    return apiData<unknown>(
        "/api/reports",
        {
            method: "POST",
            body: JSON.stringify(payload),
        },
        accessToken,
    );
}
