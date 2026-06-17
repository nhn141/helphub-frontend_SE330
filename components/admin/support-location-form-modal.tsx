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
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-950/50 p-3 backdrop-blur-sm sm:p-6">
            <div className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl animate-in fade-in zoom-in-95 duration-200 sm:max-h-[calc(100dvh-3rem)]">
                <div className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-white px-4 py-3 sm:px-6 sm:py-4">
                    <h3 className="text-lg font-bold text-slate-900">
                        {initialData
                            ? "Edit Support Location"
                            : "Create New Location"}
                    </h3>
                    <button
                        type="button"
                        aria-label="Close modal"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="text-[0px] text-slate-400 hover:text-slate-600 after:text-sm after:content-['X']"
                    >
                        ✕
                    </button>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-5 sm:p-6"
                >
                    <div className="space-y-4">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                            General Info
                        </h4>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
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
                            <div>
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
                            <div className="sm:col-span-2">
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
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
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
                            <div>
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

                    <div className="sticky bottom-0 -mx-4 -mb-5 mt-6 flex flex-col-reverse gap-2 border-t border-slate-100 bg-white px-4 py-4 sm:-mx-6 sm:-mb-6 sm:flex-row sm:justify-end sm:px-6">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="h-10 rounded-lg bg-slate-100 px-4 text-sm font-medium text-slate-600 transition hover:bg-slate-200"
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
                            className="h-10 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                        >
                            {isSubmitting ? "Saving..." : "Save Location"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
