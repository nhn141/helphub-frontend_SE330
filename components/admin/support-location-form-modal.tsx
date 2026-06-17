"use client";

import { useState, useEffect } from "react";

import { LocationPicker } from "@/components/location-picker";
import { SupportLocation } from "@/lib/admin-api";

interface SupportLocationFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (
        payload: Omit<SupportLocation, "id" | "isActive" | "createdAt">,
    ) => Promise<void>;
    initialData?: SupportLocation | null;
    isSubmitting: boolean;
}

export function SupportLocationFormModal({
    isOpen,
    onClose,
    onSave,
    initialData,
    isSubmitting,
}: SupportLocationFormModalProps) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [address, setAddress] = useState("");
    const [contactPhone, setContactPhone] = useState("");
    const [latitude, setLatitude] = useState("");
    const [longitude, setLongitude] = useState("");
    const [bankName, setBankName] = useState("");
    const [bankAccountNumber, setBankAccountNumber] = useState("");
    const [locationError, setLocationError] = useState<string | null>(null);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            setLocationError(null);

            if (initialData) {
                setName(initialData.name || "");
                setDescription(initialData.description || "");
                setAddress(initialData.address || "");
                setContactPhone(initialData.contactPhone || "");
                setLatitude(initialData.latitude?.toString() || "");
                setLongitude(initialData.longitude?.toString() || "");
                setBankName(initialData.bankName || "");
                setBankAccountNumber(initialData.bankAccountNumber || "");
            } else {
                setName("");
                setDescription("");
                setAddress("");
                setContactPhone("");
                setLatitude("");
                setLongitude("");
                setBankName("");
                setBankAccountNumber("");
            }
        }, 0);

        return () => window.clearTimeout(timer);
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const parsedLatitude = Number(latitude);
        const parsedLongitude = Number(longitude);

        if (
            !latitude.trim() ||
            !longitude.trim() ||
            !Number.isFinite(parsedLatitude) ||
            !Number.isFinite(parsedLongitude)
        ) {
            setLocationError(
                "Search for this support location or select a point on the map.",
            );
            return;
        }

        await onSave({
            name: name.trim(),
            description: description.trim(),
            address: address.trim(),
            contactPhone: contactPhone.trim(),
            latitude: parsedLatitude,
            longitude: parsedLongitude,
            bankName: bankName.trim() || null,
            bankAccountNumber: bankAccountNumber.trim() || null,
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
                    <h3 className="text-lg font-bold text-slate-900">
                        {initialData
                            ? "Edit Support Location"
                            : "Create New Location"}
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
                    <div className="space-y-4">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                            General Info
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2 sm:col-span-1">
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Location Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    maxLength={100}
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    disabled={isSubmitting}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    placeholder="e.g. Central Relief Hub"
                                />
                            </div>
                            <div className="col-span-2 sm:col-span-1">
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Contact Phone *
                                </label>
                                <input
                                    type="tel"
                                    required
                                    minLength={9}
                                    maxLength={15}
                                    value={contactPhone}
                                    onChange={(e) =>
                                        setContactPhone(e.target.value)
                                    }
                                    disabled={isSubmitting}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    placeholder="e.g. 0901234567"
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Description *
                                </label>
                                <textarea
                                    required
                                    rows={2}
                                    value={description}
                                    onChange={(e) =>
                                        setDescription(e.target.value)
                                    }
                                    disabled={isSubmitting}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                                    placeholder="Details about capacity, operating hours, etc."
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 pt-2">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-t pt-4">
                            Address & Location
                        </h4>
                        <LocationPicker
                            required
                            disabled={isSubmitting}
                            label="Support location"
                            value={{ address, latitude, longitude }}
                            onChange={(location) => {
                                setLocationError(null);
                                setAddress(location.address);
                                setLatitude(location.latitude);
                                setLongitude(location.longitude);
                            }}
                        />
                        {locationError ? (
                            <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
                                {locationError}
                            </p>
                        ) : null}
                    </div>

                    <div className="space-y-4 pt-2">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-t pt-4">
                            Banking Details (Optional)
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2 sm:col-span-1">
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Bank Name
                                </label>
                                <input
                                    type="text"
                                    value={bankName}
                                    onChange={(e) =>
                                        setBankName(e.target.value)
                                    }
                                    disabled={isSubmitting}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    placeholder="e.g. VCB"
                                />
                            </div>
                            <div className="col-span-2 sm:col-span-1">
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Account Number
                                </label>
                                <input
                                    type="text"
                                    value={bankAccountNumber}
                                    onChange={(e) =>
                                        setBankAccountNumber(e.target.value)
                                    }
                                    disabled={isSubmitting}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    placeholder="e.g. 123456789"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-2 border-t border-slate-100 mt-6">
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
                                isSubmitting ||
                                !name?.trim() ||
                                !address?.trim() ||
                                !contactPhone?.trim() ||
                                !latitude.trim() ||
                                !longitude.trim()
                            }
                            className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition"
                        >
                            {isSubmitting ? "Saving..." : "Save Location"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
