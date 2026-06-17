"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
    LatLngExpression,
    Map as LeafletMap,
    Marker as LeafletMarker,
} from "leaflet";

type LeafletModule = typeof import("leaflet");

export type LocationValue = {
    address: string;
    latitude: string;
    longitude: string;
};

type LocationPickerProps = {
    value: LocationValue;
    onChange: (value: LocationValue) => void;
    disabled?: boolean;
    required?: boolean;
    label?: string;
};

type LatLng = {
    lat: number;
    lng: number;
};

type NominatimResult = {
    place_id: number;
    display_name: string;
    lat: string;
    lon: string;
    name?: string;
    type?: string;
};

const DEFAULT_CENTER: LatLng = { lat: 10.7769, lng: 106.7009 };
const DEFAULT_ZOOM = 12;
const SELECTED_ZOOM = 15;
const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org";

export function LocationPicker({
    value,
    onChange,
    disabled = false,
    required = false,
    label = "Location",
}: LocationPickerProps) {
    const mapContainerRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<LeafletMap | null>(null);
    const markerRef = useRef<LeafletMarker | null>(null);
    const leafletRef = useRef<LeafletModule | null>(null);
    const disabledRef = useRef(disabled);
    const currentAddressRef = useRef(value.address);
    const applyLocationRef = useRef<(position: LatLng, address: string) => void>(
        () => undefined,
    );
    const lastLocalAddressRef = useRef(value.address);
    const searchControllerRef = useRef<AbortController | null>(null);

    const [mapReady, setMapReady] = useState(false);
    const [searchValue, setSearchValue] = useState(value.address);
    const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
    const [suggestionsLoading, setSuggestionsLoading] = useState(false);
    const [pickerError, setPickerError] = useState<string | null>(null);

    const selectedPosition = useMemo(
        () => parsePosition(value.latitude, value.longitude),
        [value.latitude, value.longitude],
    );
    const initialPositionRef = useRef(selectedPosition);

    const applyLocation = useCallback(
        (position: LatLng, address: string) => {
            setPickerError(null);
            lastLocalAddressRef.current = address;
            currentAddressRef.current = address;
            setSearchValue(address);
            setSuggestions([]);
            onChange({
                address,
                latitude: position.lat.toFixed(6),
                longitude: position.lng.toFixed(6),
            });
        },
        [onChange],
    );

    useEffect(() => {
        disabledRef.current = disabled;
    }, [disabled]);

    useEffect(() => {
        currentAddressRef.current = value.address;
    }, [value.address]);

    useEffect(() => {
        applyLocationRef.current = applyLocation;
    }, [applyLocation]);

    useEffect(() => {
        if (
            value.address !== searchValue &&
            value.address !== lastLocalAddressRef.current
        ) {
            setSearchValue(value.address);
        }
    }, [searchValue, value.address]);

    useEffect(() => {
        let cancelled = false;

        async function createMap() {
            const L = await import("leaflet");

            if (cancelled || !mapContainerRef.current || mapRef.current) {
                return;
            }

            leafletRef.current = L;

            const initialPosition = initialPositionRef.current;
            const initialCenter: LatLngExpression = initialPosition
                ? [initialPosition.lat, initialPosition.lng]
                : [DEFAULT_CENTER.lat, DEFAULT_CENTER.lng];

            const map = L.map(mapContainerRef.current, {
                attributionControl: true,
                scrollWheelZoom: true,
                zoomControl: true,
            }).setView(
                initialCenter,
                initialPosition ? SELECTED_ZOOM : DEFAULT_ZOOM,
            );

            L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution:
                    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                maxZoom: 19,
            }).addTo(map);

            map.on("click", async (event) => {
                if (disabledRef.current) {
                    return;
                }

                const position = {
                    lat: event.latlng.lat,
                    lng: event.latlng.lng,
                };

                try {
                    const address = await reverseSearch(position);
                    applyLocationRef.current(position, address);
                } catch {
                    applyLocationRef.current(
                        position,
                        currentAddressRef.current || formatCoordinates(position),
                    );
                }
            });

            mapRef.current = map;
            setMapReady(true);
            window.setTimeout(() => map.invalidateSize(), 0);
        }

        void createMap();

        return () => {
            cancelled = true;

            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }

            markerRef.current = null;
            leafletRef.current = null;
        };
    }, []);

    useEffect(() => {
        const L = leafletRef.current;
        const map = mapRef.current;

        if (!mapReady || !L || !map) {
            return;
        }

        if (!selectedPosition) {
            if (markerRef.current) {
                markerRef.current.remove();
                markerRef.current = null;
            }
            return;
        }

        const latLng: LatLngExpression = [
            selectedPosition.lat,
            selectedPosition.lng,
        ];

        if (!markerRef.current) {
            markerRef.current = L.marker(latLng, {
                icon: createSelectedIcon(L),
                keyboard: false,
            }).addTo(map);
        } else {
            markerRef.current.setLatLng(latLng);
        }

        map.setView(
            latLng,
            Math.max(map.getZoom() || DEFAULT_ZOOM, SELECTED_ZOOM),
        );
    }, [mapReady, selectedPosition]);

    useEffect(() => {
        return () => searchControllerRef.current?.abort();
    }, []);

    const handleInputChange = useCallback(
        (nextValue: string) => {
            setPickerError(null);
            lastLocalAddressRef.current = nextValue;
            currentAddressRef.current = nextValue;
            setSearchValue(nextValue);
            setSuggestions([]);
            setSuggestionsLoading(false);
            onChange({
                address: nextValue,
                latitude: "",
                longitude: "",
            });
        },
        [onChange],
    );

    const handleSearch = useCallback(async () => {
        const query = searchValue.trim();

        if (query.length < 3) {
            setPickerError("Enter at least 3 characters to search.");
            setSuggestions([]);
            return;
        }

        searchControllerRef.current?.abort();

        const controller = new AbortController();
        searchControllerRef.current = controller;
        setSuggestionsLoading(true);
        setPickerError(null);

        try {
            const results = await searchPlaces(query, controller.signal);

            if (searchControllerRef.current === controller) {
                setSuggestions(results);

                if (!results.length) {
                    setPickerError("No locations found. Try a more specific address.");
                }
            }
        } catch (error) {
            if (!controller.signal.aborted) {
                setPickerError(getSearchErrorMessage(error));
                setSuggestions([]);
            }
        } finally {
            if (searchControllerRef.current === controller) {
                setSuggestionsLoading(false);
            }
        }
    }, [searchValue]);

    const handleSuggestionSelect = useCallback(
        (result: NominatimResult) => {
            const position = {
                lat: Number(result.lat),
                lng: Number(result.lon),
            };

            if (!isValidPosition(position)) {
                setPickerError("This search result does not include coordinates.");
                return;
            }

            applyLocation(position, result.display_name);
        },
        [applyLocation],
    );

    const handleUseCurrentLocation = useCallback(() => {
        setPickerError(null);

        if (!navigator.geolocation) {
            setPickerError("Your browser does not support geolocation.");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const selected = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                };

                try {
                    const address = await reverseSearch(selected);
                    applyLocation(selected, address);
                } catch {
                    applyLocation(
                        selected,
                        currentAddressRef.current || formatCoordinates(selected),
                    );
                }
            },
            () => {
                setPickerError(
                    "Unable to get your current location. Check browser location permission.",
                );
            },
            { enableHighAccuracy: true, timeout: 10000 },
        );
    }, [applyLocation]);

    return (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <p className="text-sm font-semibold text-slate-900">
                        {label}
                        {required ? " *" : ""}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                        Search with OpenStreetMap or click directly on the map.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    disabled={disabled}
                    className="h-9 shrink-0 rounded-lg border border-emerald-200 bg-white px-3 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    Use current location
                </button>
            </div>

            <div className="relative mt-4">
                <label className="sr-only" htmlFor="location-search">
                    Search location
                </label>
                <div className="flex gap-2">
                    <input
                        id="location-search"
                        value={searchValue}
                        onChange={(event) =>
                            handleInputChange(event.target.value)
                        }
                        onKeyDown={(event) => {
                            if (event.key === "Enter") {
                                event.preventDefault();
                                void handleSearch();
                            }
                        }}
                        disabled={disabled}
                        placeholder="Search by address, ward, district..."
                        className="h-11 min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-100"
                    />
                    <button
                        type="button"
                        onClick={() => void handleSearch()}
                        disabled={disabled || suggestionsLoading}
                        className="h-11 rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                        {suggestionsLoading ? "Searching..." : "Search"}
                    </button>
                </div>

                {suggestions.length ? (
                    <div className="absolute left-0 right-0 top-full z-[1000] mt-2 max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10">
                        {suggestions.map((suggestion) => {
                            const { primary, secondary } =
                                splitDisplayName(suggestion);

                            return (
                                <button
                                    key={suggestion.place_id}
                                    type="button"
                                    onClick={() =>
                                        handleSuggestionSelect(suggestion)
                                    }
                                    className="block w-full px-3 py-2.5 text-left text-sm text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-900"
                                >
                                    <span className="font-medium">
                                        {primary}
                                    </span>
                                    {secondary ? (
                                        <span className="mt-0.5 block text-xs text-slate-500">
                                            {secondary}
                                        </span>
                                    ) : null}
                                </button>
                            );
                        })}
                    </div>
                ) : null}
            </div>

            <div className="relative mt-3 h-[300px] overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                <div ref={mapContainerRef} className="h-full w-full" />
                {!mapReady ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-50 text-sm text-slate-500">
                        Loading map...
                    </div>
                ) : null}
            </div>

            <div className="mt-3 rounded-lg bg-white px-3 py-2 text-xs text-slate-500">
                {selectedPosition ? (
                    <span>
                        Selected coordinates:{" "}
                        <strong className="text-slate-700">
                            {selectedPosition.lat.toFixed(6)},{" "}
                            {selectedPosition.lng.toFixed(6)}
                        </strong>
                    </span>
                ) : (
                    <span>No location selected yet.</span>
                )}
            </div>

            {pickerError ? (
                <p className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
                    {pickerError}
                </p>
            ) : null}
        </div>
    );
}

function createSelectedIcon(L: LeafletModule) {
    return L.divIcon({
        className: "",
        html: [
            '<div style="display:flex;flex-direction:column;align-items:center;">',
            '<div style="width:24px;height:24px;border-radius:9999px;background:#047857;border:2px solid #fff;box-shadow:0 10px 20px rgba(15,23,42,.3);"></div>',
            '<div style="width:12px;height:12px;margin-top:-4px;transform:rotate(45deg);background:#047857;border-right:2px solid #fff;border-bottom:2px solid #fff;box-shadow:0 8px 16px rgba(15,23,42,.2);"></div>',
            "</div>",
        ].join(""),
        iconAnchor: [14, 34],
        iconSize: [28, 36],
    });
}

function parsePosition(latitude: string, longitude: string): LatLng | null {
    const position = {
        lat: Number(latitude),
        lng: Number(longitude),
    };

    return isValidPosition(position) ? position : null;
}

function isValidPosition(position: LatLng) {
    return (
        Number.isFinite(position.lat) &&
        Number.isFinite(position.lng) &&
        position.lat >= -90 &&
        position.lat <= 90 &&
        position.lng >= -180 &&
        position.lng <= 180
    );
}

async function searchPlaces(query: string, signal: AbortSignal) {
    const params = new URLSearchParams({
        "accept-language": "en",
        addressdetails: "1",
        countrycodes: "vn",
        format: "jsonv2",
        limit: "6",
        q: query,
    });

    const response = await fetch(`${NOMINATIM_BASE_URL}/search?${params}`, {
        headers: { Accept: "application/json" },
        signal,
    });

    if (!response.ok) {
        throw new Error("OpenStreetMap search is temporarily unavailable.");
    }

    return (await response.json()) as NominatimResult[];
}

async function reverseSearch(position: LatLng) {
    const params = new URLSearchParams({
        "accept-language": "en",
        addressdetails: "1",
        format: "jsonv2",
        lat: position.lat.toString(),
        lon: position.lng.toString(),
        zoom: "18",
    });

    const response = await fetch(`${NOMINATIM_BASE_URL}/reverse?${params}`, {
        headers: { Accept: "application/json" },
    });

    if (!response.ok) {
        throw new Error("OpenStreetMap reverse lookup is unavailable.");
    }

    const result = (await response.json()) as Partial<NominatimResult> & {
        error?: string;
    };

    if (result.error || !result.display_name) {
        return formatCoordinates(position);
    }

    return result.display_name;
}

function splitDisplayName(result: NominatimResult) {
    const parts = result.display_name
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean);

    return {
        primary: result.name || parts[0] || result.display_name,
        secondary: parts.slice(result.name ? 0 : 1).join(", "),
    };
}

function formatCoordinates(position: LatLng) {
    return `${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}`;
}

function getSearchErrorMessage(error: unknown) {
    if (error instanceof Error) {
        return error.message;
    }

    return "Unable to search locations. Try again in a moment.";
}
