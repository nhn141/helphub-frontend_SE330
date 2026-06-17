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
