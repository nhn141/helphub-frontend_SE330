"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/components/auth-provider";
import {
    LoadingBlock,
    Notice,
    PageHeading,
    EmptyState,
} from "@/components/support-ui";
import { SupportLocationTable } from "@/components/admin/support-location-table";
import { SupportLocationFormModal } from "@/components/admin/support-location-form-modal";
import {
    getAdminSupportLocations,
    createSupportLocation,
    updateSupportLocation,
    patchSupportLocationStatus,
    SupportLocation,
} from "@/lib/admin-api";

export function AdminLocationsClient() {
    const { getAccessToken } = useAuth();

    const [locations, setLocations] = useState<SupportLocation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [processingId, setProcessingId] = useState<string | null>(null);

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingLocation, setEditingLocation] =
        useState<SupportLocation | null>(null);

    const fetchLocations = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const token = await getAccessToken();
            const data = await getAdminSupportLocations(token, false); // Lấy tất cả
            setLocations(data);
        } catch (err: any) {
            setError(err.message || "Failed to load support locations.");
        } finally {
            setLoading(false);
        }
    }, [getAccessToken]);

    useEffect(() => {
        fetchLocations();
    }, [fetchLocations]);

    // --- ACTIONS ---

    const handleToggleStatus = async (id: string, currentStatus: boolean) => {
        const action = currentStatus ? "deactivate" : "activate";
        if (
            !window.confirm(
                `Are you sure you want to ${action} this support location?`,
            )
        )
            return;

        setProcessingId(id);
        try {
            const token = await getAccessToken();
            await patchSupportLocationStatus(token, id, {
                isActive: !currentStatus,
            });
            setLocations((prev) =>
                prev.map((loc) =>
                    loc.id === id ? { ...loc, isActive: !currentStatus } : loc,
                ),
            );
        } catch (err: any) {
            alert(`Failed to change status: ${err.message}`);
        } finally {
            setProcessingId(null);
        }
    };

    const handleSaveLocation = async (
        payload: Omit<SupportLocation, "id" | "isActive" | "createdAt">,
    ) => {
        setIsSubmitting(true);
        try {
            const token = await getAccessToken();
            if (editingLocation) {
                // Cập nhật
                const updatedLoc = await updateSupportLocation(
                    token,
                    editingLocation.id,
                    payload,
                );
                setLocations((prev) =>
                    prev.map((loc) =>
                        loc.id === editingLocation.id ? updatedLoc : loc,
                    ),
                );
            } else {
                // Tạo mới
                const newLoc = await createSupportLocation(token, payload);
                setLocations((prev) => [newLoc, ...prev]);
            }
            setIsModalOpen(false);
        } catch (err: any) {
            alert(`Operation failed: ${err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const openCreateModal = () => {
        setEditingLocation(null);
        setIsModalOpen(true);
    };

    const openEditModal = (location: SupportLocation) => {
        setEditingLocation(location);
        setIsModalOpen(true);
    };

    return (
        <>
            <PageHeading
                eyebrow="Infrastructure"
                title="Support Locations"
                description="Manage physical hubs, warehouses, and drop-off points for relief goods."
                action={
                    <button
                        onClick={openCreateModal}
                        className="inline-flex h-11 items-center rounded-xl bg-emerald-700 px-5 text-sm font-semibold text-white hover:bg-emerald-800 transition"
                    >
                        + New Location
                    </button>
                }
            />

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {error && (
                    <div className="p-4">
                        <Notice type="error">{error}</Notice>
                    </div>
                )}

                {loading ? (
                    <div className="py-10">
                        <LoadingBlock />
                    </div>
                ) : locations.length === 0 ? (
                    <div className="py-8 border-t border-slate-100">
                        <EmptyState
                            title="No locations found"
                            description="Create your first support location to get started."
                        />
                    </div>
                ) : (
                    <SupportLocationTable
                        locations={locations}
                        processingId={processingId}
                        onEdit={openEditModal}
                        onToggleStatus={handleToggleStatus}
                    />
                )}
            </div>

            <SupportLocationFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveLocation}
                initialData={editingLocation}
                isSubmitting={isSubmitting}
            />
        </>
    );
}
