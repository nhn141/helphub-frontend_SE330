"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/components/auth-provider";
import {
    getMyProfile,
    updateMyProfile,
    UserProfileResponse,
    UpdateProfileRequest,
    getMyRoleUpgradeRequests,
    createRoleUpgradeRequest,
    RoleUpgradeRequestResponse,
} from "@/lib/user-api";

export default function ProfilePage() {
    const { getAccessToken } = useAuth();

    const [profile, setProfile] = useState<UserProfileResponse | null>(null);
    const [loading, setLoading] = useState(true);

    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState<UpdateProfileRequest>({
        fullName: "",
        phone: "",
        avatarUrl: "",
    });

    const [upgradeRequests, setUpgradeRequests] = useState<
        RoleUpgradeRequestResponse[]
    >([]);
    const [isSubmittingUpgrade, setIsSubmittingUpgrade] = useState(false);
    const [upgradeReason, setUpgradeReason] = useState("");
    const [upgradeDocsUrl, setUpgradeDocsUrl] = useState("");
    const [upgradeError, setUpgradeError] = useState<string | null>(null);
    const [showUpgradeForm, setShowUpgradeForm] = useState(false);

    useEffect(() => {
        let isMounted = true;

        async function fetchInitialData() {
            try {
                const token = await getAccessToken();
                if (!token) return;

                const profileData = await getMyProfile(token);
                if (isMounted) {
                    setProfile(profileData);
                    setFormData({
                        fullName: profileData.fullName || "",
                        phone: profileData.phone || "",
                        avatarUrl: profileData.avatarUrl || "",
                    });
                }

                const requestsData = await getMyRoleUpgradeRequests(token);
                if (isMounted && requestsData.content) {
                    setUpgradeRequests(requestsData.content);
                }
            } catch (err) {
                console.error(err);
                if (isMounted) setError("Failed to load profile information.");
            } finally {
                if (isMounted) setLoading(false);
            }
        }

        fetchInitialData();

        return () => {
            isMounted = false;
        };
    }, [getAccessToken]);

    const handleAvatarUpload = async (
        e: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploadingAvatar(true);
        setError(null);

        try {
            const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
            const uploadPreset =
                process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

            if (!cloudName || !uploadPreset) {
                throw new Error("Cloudinary configuration is missing.");
            }

            const uploadData = new FormData();
            uploadData.append("file", file);
            uploadData.append("upload_preset", uploadPreset);

            const res = await fetch(
                `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
                {
                    method: "POST",
                    body: uploadData,
                },
            );

            if (!res.ok) throw new Error("Failed to upload image");

            const data = await res.json();
            setFormData((prev) => ({ ...prev, avatarUrl: data.secure_url }));
        } catch (err: any) {
            console.error(err);
            setError(
                "Failed to upload image. Please check your connection or configuration.",
            );
        } finally {
            setIsUploadingAvatar(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.fullName.trim()) {
            setError("Full name cannot be empty.");
            return;
        }

        setIsSaving(true);
        setError(null);

        try {
            const token = await getAccessToken();
            const updatedProfile = await updateMyProfile(token, {
                fullName: formData.fullName.trim(),
                phone: formData.phone?.trim() || null,
                avatarUrl: formData.avatarUrl?.trim() || null,
            });

            setProfile(updatedProfile);
            setIsEditing(false);
        } catch (err: any) {
            console.error(err);
            setError(
                err.message || "Failed to update profile. Please try again.",
            );
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpgradeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!upgradeReason.trim()) {
            setUpgradeError("Reason is required.");
            return;
        }

        setIsSubmittingUpgrade(true);
        setUpgradeError(null);

        try {
            const token = await getAccessToken();
            const newRequest = await createRoleUpgradeRequest(token, {
                reason: upgradeReason.trim(),
                supportingDocumentsUrl: upgradeDocsUrl.trim() || null,
            });

            setUpgradeRequests((prev) => [newRequest, ...prev]);
            setShowUpgradeForm(false);
            setUpgradeReason("");
            setUpgradeDocsUrl("");
        } catch (err: any) {
            console.error(err);
            setUpgradeError(err.message || "Failed to submit upgrade request.");
        } finally {
            setIsSubmittingUpgrade(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="p-8 text-center text-slate-500">
                Profile information not found.
            </div>
        );
    }

    const displayAvatar = isEditing ? formData.avatarUrl : profile.avatarUrl;
    const hasPendingRequest = upgradeRequests.some(
        (req) => req.status === "PENDING",
    );

    return (
        <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">
                    User Profile
                </h1>
                <p className="text-sm text-slate-500">
                    Manage your profile information and account settings.
                </p>
            </div>

            {error && (
                <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm">
                    {error}
                </div>
            )}

            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="bg-slate-50 px-6 py-8 border-b border-slate-200 flex flex-col md:flex-row items-center gap-6">
                    <div className="relative size-24 rounded-full bg-emerald-100 border-4 border-white shadow-sm flex items-center justify-center text-3xl font-bold text-emerald-700 overflow-hidden shrink-0">
                        {displayAvatar ? (
                            <img
                                src={displayAvatar}
                                alt="Avatar"
                                className="size-full object-cover"
                            />
                        ) : (
                            profile.fullName.charAt(0).toUpperCase()
                        )}
                        {isUploadingAvatar && (
                            <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600"></div>
                            </div>
                        )}
                    </div>
                    <div className="text-center md:text-left flex-1">
                        <h2 className="text-xl font-bold text-slate-900">
                            {profile.fullName}
                        </h2>
                        <p className="text-slate-500 text-sm mb-2">
                            {profile.email}
                        </p>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                            {profile.role}
                        </span>
                    </div>
                    {!isEditing && (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm"
                        >
                            Edit Profile
                        </button>
                    )}
                </div>

                <div className="p-6">
                    {isEditing ? (
                        <form
                            onSubmit={handleSaveProfile}
                            className="space-y-5"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Full Name{" "}
                                        <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        disabled={isSaving}
                                        value={formData.fullName}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                fullName: e.target.value,
                                            })
                                        }
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        disabled
                                        value={profile.email}
                                        className="w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Phone Number
                                    </label>
                                    <input
                                        type="tel"
                                        disabled={isSaving}
                                        value={formData.phone || ""}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                phone: e.target.value,
                                            })
                                        }
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Avatar Image
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            ref={fileInputRef}
                                            onChange={handleAvatarUpload}
                                            className="hidden"
                                            disabled={
                                                isSaving || isUploadingAvatar
                                            }
                                        />
                                        <button
                                            type="button"
                                            onClick={() =>
                                                fileInputRef.current?.click()
                                            }
                                            disabled={
                                                isSaving || isUploadingAvatar
                                            }
                                            className="px-4 py-2 w-full bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100 transition focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        >
                                            {isUploadingAvatar
                                                ? "Uploading Image..."
                                                : "Choose from device"}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsEditing(false);
                                        setError(null);
                                        setFormData({
                                            fullName: profile.fullName || "",
                                            phone: profile.phone || "",
                                            avatarUrl: profile.avatarUrl || "",
                                        });
                                    }}
                                    disabled={isSaving || isUploadingAvatar}
                                    className="px-5 py-2 text-sm font-semibold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={
                                        isSaving ||
                                        isUploadingAvatar ||
                                        !formData.fullName.trim()
                                    }
                                    className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition flex items-center gap-2"
                                >
                                    {isSaving ? "Saving..." : "Save Changes"}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-4">
                                <div>
                                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                                        Full Name
                                    </h3>
                                    <p className="text-slate-800 font-medium">
                                        {profile.fullName}
                                    </p>
                                </div>
                                <div>
                                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                                        Email
                                    </h3>
                                    <p className="text-slate-800 font-medium">
                                        {profile.email}
                                    </p>
                                </div>
                                <div>
                                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                                        Phone Number
                                    </h3>
                                    <p className="text-slate-800 font-medium">
                                        {profile.phone || (
                                            <span className="text-slate-400 italic">
                                                Not updated
                                            </span>
                                        )}
                                    </p>
                                </div>
                                <div>
                                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                                        Joined Date
                                    </h3>
                                    <p className="text-slate-800 font-medium">
                                        {new Date(
                                            profile.createdAt,
                                        ).toLocaleDateString("en-US", {
                                            year: "numeric",
                                            month: "long",
                                            day: "numeric",
                                        })}
                                    </p>
                                </div>
                                <div>
                                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                                        Account Status
                                    </h3>
                                    <div className="mt-1">
                                        {profile.isActive ? (
                                            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700">
                                                <span className="size-1.5 rounded-full bg-emerald-500"></span>
                                                Active
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-rose-50 text-rose-700">
                                                <span className="size-1.5 rounded-full bg-rose-500"></span>
                                                Inactive
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">
                            Role Management
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">
                            View or request upgrades to your system privileges.
                        </p>
                    </div>
                    {profile.role === "VOLUNTEER" &&
                        !hasPendingRequest &&
                        !showUpgradeForm && (
                            <button
                                onClick={() => setShowUpgradeForm(true)}
                                className="px-4 py-2 bg-emerald-50 text-emerald-700 font-semibold text-sm rounded-lg hover:bg-emerald-100 transition"
                            >
                                Request Upgrade
                            </button>
                        )}
                </div>

                <div className="p-6">
                    {showUpgradeForm ? (
                        <form
                            onSubmit={handleUpgradeSubmit}
                            className="space-y-4 mb-8 bg-slate-50 p-5 rounded-xl border border-slate-200"
                        >
                            <h3 className="font-semibold text-slate-800">
                                Submit Upgrade Request
                            </h3>
                            {upgradeError && (
                                <div className="p-3 bg-rose-50 text-rose-700 text-sm rounded-lg border border-rose-200">
                                    {upgradeError}
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Reason for Upgrade{" "}
                                    <span className="text-rose-500">*</span>
                                </label>
                                <textarea
                                    required
                                    rows={3}
                                    disabled={isSubmittingUpgrade}
                                    value={upgradeReason}
                                    onChange={(e) =>
                                        setUpgradeReason(e.target.value)
                                    }
                                    placeholder="Explain why you are requesting a higher role..."
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Supporting Documents URL
                                </label>
                                <input
                                    type="url"
                                    disabled={isSubmittingUpgrade}
                                    value={upgradeDocsUrl}
                                    onChange={(e) =>
                                        setUpgradeDocsUrl(e.target.value)
                                    }
                                    placeholder="https://link-to-your-credentials.com"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowUpgradeForm(false);
                                        setUpgradeError(null);
                                    }}
                                    disabled={isSubmittingUpgrade}
                                    className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={
                                        isSubmittingUpgrade ||
                                        !upgradeReason.trim()
                                    }
                                    className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition"
                                >
                                    {isSubmittingUpgrade
                                        ? "Submitting..."
                                        : "Submit Request"}
                                </button>
                            </div>
                        </form>
                    ) : null}

                    {upgradeRequests.length > 0 ? (
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                                Request History
                            </h3>
                            {upgradeRequests.map((req) => (
                                <div
                                    key={req.id}
                                    className="p-4 border border-slate-200 rounded-xl bg-white"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-xs text-slate-500 font-medium">
                                            {new Date(
                                                req.createdAt,
                                            ).toLocaleDateString("en-US", {
                                                year: "numeric",
                                                month: "short",
                                                day: "numeric",
                                            })}
                                        </span>
                                        <span
                                            className={`text-[10px] uppercase font-bold px-2 py-1 rounded ${
                                                req.status === "APPROVED"
                                                    ? "bg-emerald-100 text-emerald-800"
                                                    : req.status === "REJECTED"
                                                      ? "bg-rose-100 text-rose-800"
                                                      : req.status ===
                                                          "CANCELLED"
                                                        ? "bg-slate-100 text-slate-600"
                                                        : "bg-amber-100 text-amber-800"
                                            }`}
                                        >
                                            {req.status}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-800">
                                        <span className="font-semibold text-slate-600">
                                            Reason:
                                        </span>{" "}
                                        {req.reason}
                                    </p>
                                    {req.supportingDocumentsUrl && (
                                        <a
                                            href={req.supportingDocumentsUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-xs text-blue-600 hover:underline mt-1 block truncate"
                                        >
                                            Supporting Documents
                                        </a>
                                    )}
                                    {req.rejectionReason && (
                                        <div className="mt-3 p-2 bg-rose-50 text-rose-700 text-xs rounded border border-rose-100">
                                            <span className="font-bold">
                                                Rejection Note:
                                            </span>{" "}
                                            {req.rejectionReason}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-slate-500 text-center py-4">
                            No role upgrade requests found.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
