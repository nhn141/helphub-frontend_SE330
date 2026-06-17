"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import {
    getMyProfile,
    updateMyProfile,
    UserProfileResponse,
    UpdateProfileRequest,
} from "@/lib/user-api";

export default function ProfilePage() {
    const { getAccessToken } = useAuth();

    const [profile, setProfile] = useState<UserProfileResponse | null>(null);
    const [loading, setLoading] = useState(true);

    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState<UpdateProfileRequest>({
        fullName: "",
        phone: "",
        avatarUrl: "",
    });

    useEffect(() => {
        let isMounted = true;

        async function fetchProfile() {
            try {
                const token = await getAccessToken();
                if (!token) return;

                const data = await getMyProfile(token);
                if (isMounted) {
                    setProfile(data);
                    setFormData({
                        fullName: data.fullName || "",
                        phone: data.phone || "",
                        avatarUrl: data.avatarUrl || "",
                    });
                }
            } catch (err) {
                console.error(err);
                if (isMounted) setError("Failed to load profile information.");
            } finally {
                if (isMounted) setLoading(false);
            }
        }

        fetchProfile();

        return () => {
            isMounted = false;
        };
    }, [getAccessToken]);

    const handleSave = async (e: React.FormEvent) => {
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

    return (
        <div className="max-w-3xl mx-auto p-4 md:p-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900">
                    User Profile
                </h1>
                <p className="text-sm text-slate-500">
                    Manage your profile information and account settings.
                </p>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm">
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
                        <form onSubmit={handleSave} className="space-y-5">
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
                                    disabled={isSaving}
                                    className="px-5 py-2 text-sm font-semibold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={
                                        isSaving || !formData.fullName.trim()
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
        </div>
    );
}
