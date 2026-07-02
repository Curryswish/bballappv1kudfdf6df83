"use client";

import { GoogleMap, MarkerF, useJsApiLoader } from "@react-google-maps/api";

export default function CourtMap({
  latitude,
  longitude,
  name,
}: {
  latitude: number;
  longitude: number;
  name: string;
}) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
  });

  if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
    return (
      <div className="flex h-40 items-center justify-center rounded-card bg-court-100 text-sm text-court-900/40">
        Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to show the map
      </div>
    );
  }

  if (!isLoaded) {
    return <div className="h-40 animate-pulse rounded-card bg-court-100" />;
  }

  return (
    <GoogleMap
      mapContainerClassName="h-40 w-full rounded-card overflow-hidden"
      center={{ lat: latitude, lng: longitude }}
      zoom={14}
      options={{ disableDefaultUI: true, gestureHandling: "cooperative" }}
    >
      <MarkerF position={{ lat: latitude, lng: longitude }} title={name} />
    </GoogleMap>
  );
}
