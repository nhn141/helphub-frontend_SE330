"use client";

import { useState, useEffect } from "react";
import { Category } from "@/lib/admin-api";

interface CategoryFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (
        payload: Omit<Category, "id" | "isActive" | "createdAt" | "updatedAt">,
    ) => Promise<void>;
    initialData?: Category | null;
    isSubmitting: boolean;
}

export function CategoryFormModal({
    isOpen,
    onClose,
    onSave,
    initialData,
    isSubmitting,
}: CategoryFormModalProps) {
    const [name, setName] = useState("");
    const [code, setCode] = useState("");
    const [description, setDescription] = useState("");
    const [iconUrl, setIconUrl] = useState("");

    useEffect(() => {
        if (initialData) {
            setName(initialData.name || "");
            setCode(initialData.code || "");
            setDescription(initialData.description || "");
            setIconUrl(initialData.iconUrl || "");
        } else {
            setName("");
            setCode("");
            setDescription("");
            setIconUrl("");
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSave({
            name: name.trim(),
            code: code.trim().toUpperCase(),
            description: description.trim(),
            iconUrl: iconUrl.trim() || null,
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-900">
                        {initialData ? "Edit Category" : "Create New Category"}
                    </h3>
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="text-slate-400 hover:text-slate-600"
                    >
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 sm:col-span-1">
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Name *
                            </label>
                            <input
                                type="text"
                                required
                                maxLength={100}
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                disabled={isSubmitting}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                placeholder="e.g. Medical Supplies"
                            />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Code *
                            </label>
                            <input
                                type="text"
                                required
                                maxLength={50}
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                disabled={isSubmitting}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 uppercase"
                                placeholder="e.g. MEDICAL"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Description
                        </label>
                        <textarea
                            required
                            rows={3}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            disabled={isSubmitting}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                            placeholder="Briefly describe what belongs in this category..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Icon URL (Optional)
                        </label>
                        <input
                            type="url"
                            value={iconUrl}
                            onChange={(e) => setIconUrl(e.target.value)}
                            disabled={isSubmitting}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            placeholder="https://example.com/icon.png"
                        />
                    </div>

                    <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={
                                isSubmitting || !name?.trim() || !code?.trim()
                            }
                            className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition"
                        >
                            {isSubmitting ? "Saving..." : "Save Category"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
