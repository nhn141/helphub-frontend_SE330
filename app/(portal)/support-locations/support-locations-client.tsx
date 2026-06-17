"use client";

import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { SupportLocationFormModal } from "@/components/admin/support-location-form-modal";
import { SupportLocationTable } from "@/components/admin/support-location-table";
import {
    EmptyState,
    LoadingBlock,
    Notice,
    PageHeading,
} from "@/components/support-ui";
import {
    createSupportLocation,
    getAdminSupportLocations,
    patchSupportLocationStatus,
    updateSupportLocation,
    type SupportLocation,
} from "@/lib/admin-api";

export function SupportLocationsClient() {
    const { profile, getAccessToken } = useAuth();
    const [locations, setLocations] = useState<SupportLocation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingLocation, setEditingLocation] =
        useState<SupportLocation | null>(null);

    const canManage =
        profile.role === "ADMIN" || profile.role === "COLLABORATOR";

    const fetchLocations = useCallback(async () => {
        if (!canManage) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const token = await getAccessToken();
            const data = await getAdminSupportLocations(token, false);
            setLocations(data);
        } catch (loadError) {
            setError(getErrorMessage(loadError));
        } finally {
            setLoading(false);
        }
    }, [canManage, getAccessToken]);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            void fetchLocations();
        }, 0);

        return () => window.clearTimeout(timer);
    }, [fetchLocations]);

    if (!canManage) {
        return (
            <Notice type="error">
                Only admins and collaborators can manage support locations.
            </Notice>
        );
    }

    const openCreateModal = () => {
        setEditingLocation(null);
        setIsModalOpen(true);
    };

    const openEditModal = (location: SupportLocation) => {
        setEditingLocation(location);
        setIsModalOpen(true);
    };

    const handleToggleStatus = async (id: string, currentStatus: boolean) => {
        const action = currentStatus ? "deactivate" : "activate";

        if (
            !window.confirm(
                `Are you sure you want to ${action} this support location?`,
            )
        ) {
            return;
        }

        setProcessingId(id);
        setError(null);
        setSuccess(null);

        try {
            const token = await getAccessToken();
            await patchSupportLocationStatus(token, id, {
                isActive: !currentStatus,
            });
            setLocations((current) =>
                current.map((location) =>
                    location.id === id
                        ? { ...location, isActive: !currentStatus }
                        : location,
                ),
            );
            setSuccess(
                `Support location ${
                    currentStatus ? "deactivated" : "activated"
                } successfully.`,
            );
        } catch (statusError) {
            setError(getErrorMessage(statusError));
        } finally {
            setProcessingId(null);
        }
    };

    const handleSaveLocation = async (
        payload: Omit<SupportLocation, "id" | "isActive" | "createdAt">,
    ) => {
        setIsSubmitting(true);
        setError(null);
        setSuccess(null);

        try {
            const token = await getAccessToken();

            if (editingLocation) {
                const updatedLocation = await updateSupportLocation(
                    token,
                    editingLocation.id,
                    payload,
                );
                setLocations((current) =>
                    current.map((location) =>
                        location.id === editingLocation.id
                            ? updatedLocation
                            : location,
                    ),
                );
                setSuccess("Support location updated successfully.");
            } else {
                const newLocation = await createSupportLocation(token, payload);
                setLocations((current) => [newLocation, ...current]);
                setSuccess("Support location created successfully.");
            }

            setIsModalOpen(false);
            setEditingLocation(null);
        } catch (saveError) {
            setError(getErrorMessage(saveError));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <PageHeading
                eyebrow="Support locations"
                title="Manage support locations"
                description="Create physical hubs, warehouses, and drop-off points that can be assigned to approved support requests."
                action={
                    <button
                        type="button"
                        onClick={openCreateModal}
                        className="inline-flex h-11 items-center rounded-xl bg-emerald-700 px-5 text-sm font-semibold text-white transition hover:bg-emerald-800"
                    >
                        New location
                    </button>
                }
            />

            {error ? <Notice type="error">{error}</Notice> : null}
            {success ? <Notice type="success">{success}</Notice> : null}

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                {loading ? (
                    <div className="py-10">
                        <LoadingBlock message="Loading support locations..." />
                    </div>
                ) : locations.length ? (
                    <SupportLocationTable
                        locations={locations}
                        processingId={processingId}
                        onEdit={openEditModal}
                        onToggleStatus={handleToggleStatus}
                    />
                ) : (
                    <div className="border-t border-slate-100 py-8">
                        <EmptyState
                            title="No support locations yet"
                            description="Create your first support location so coordinators can assign it to approved requests."
                        />
                    </div>
                )}
            </section>

            <SupportLocationFormModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingLocation(null);
                }}
                onSave={handleSaveLocation}
                initialData={editingLocation}
                isSubmitting={isSubmitting}
            />
        </div>
    );
}

function getErrorMessage(error: unknown) {
    return error instanceof Error
        ? error.message
        : "Unable to update support locations.";
}
