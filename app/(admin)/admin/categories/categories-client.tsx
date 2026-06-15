"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/components/auth-provider";
import {
    LoadingBlock,
    Notice,
    PageHeading,
    EmptyState,
} from "@/components/support-ui";
import { CategoryTable } from "@/components/admin/category-table";
import { CategoryFormModal } from "@/components/admin/category-form-modal";
import {
    getAdminCategories,
    createCategory,
    updateCategory,
    patchCategoryStatus,
    Category,
} from "@/lib/admin-api";

export function AdminCategoriesClient() {
    const { getAccessToken } = useAuth();

    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [processingId, setProcessingId] = useState<string | null>(null);

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(
        null,
    );

    const fetchCategories = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const token = await getAccessToken();
            const data = await getAdminCategories(token, false); // Lấy tất cả (active = false)
            setCategories(data);
        } catch (err: any) {
            setError(err.message || "Failed to load categories.");
        } finally {
            setLoading(false);
        }
    }, [getAccessToken]);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    // --- ACTIONS ---

    const handleToggleStatus = async (id: string, currentStatus: boolean) => {
        const action = currentStatus ? "deactivate" : "activate";
        if (
            !window.confirm(`Are you sure you want to ${action} this category?`)
        )
            return;

        setProcessingId(id);
        try {
            const token = await getAccessToken();
            await patchCategoryStatus(token, id, { isActive: !currentStatus });
            setCategories((prev) =>
                prev.map((cat) =>
                    cat.id === id ? { ...cat, isActive: !currentStatus } : cat,
                ),
            );
        } catch (err: any) {
            alert(`Failed to change status: ${err.message}`);
        } finally {
            setProcessingId(null);
        }
    };

    const handleSaveCategory = async (
        payload: Omit<Category, "id" | "isActive" | "createdAt" | "updatedAt">,
    ) => {
        setIsSubmitting(true);
        try {
            const token = await getAccessToken();
            if (editingCategory) {
                // Cập nhật
                const updatedCat = await updateCategory(
                    token,
                    editingCategory.id,
                    payload,
                );
                setCategories((prev) =>
                    prev.map((cat) =>
                        cat.id === editingCategory.id ? updatedCat : cat,
                    ),
                );
            } else {
                // Tạo mới
                const newCat = await createCategory(token, payload);
                setCategories((prev) => [newCat, ...prev]);
            }
            setIsModalOpen(false);
        } catch (err: any) {
            alert(`Operation failed: ${err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const openCreateModal = () => {
        setEditingCategory(null);
        setIsModalOpen(true);
    };

    const openEditModal = (category: Category) => {
        setEditingCategory(category);
        setIsModalOpen(true);
    };

    return (
        <>
            <PageHeading
                eyebrow="Taxonomy"
                title="Categories"
                description="Manage the classification system used for support requests."
                action={
                    <button
                        onClick={openCreateModal}
                        className="inline-flex h-11 items-center rounded-xl bg-emerald-700 px-5 text-sm font-semibold text-white hover:bg-emerald-800 transition"
                    >
                        + New Category
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
                ) : categories.length === 0 ? (
                    <div className="py-8 border-t border-slate-100">
                        <EmptyState
                            title="No categories found"
                            description="Create your first category to get started."
                        />
                    </div>
                ) : (
                    <CategoryTable
                        categories={categories}
                        processingId={processingId}
                        onEdit={openEditModal}
                        onToggleStatus={handleToggleStatus}
                    />
                )}
            </div>

            <CategoryFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveCategory}
                initialData={editingCategory}
                isSubmitting={isSubmitting}
            />
        </>
    );
}
