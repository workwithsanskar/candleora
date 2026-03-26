export function getCurrentLocation() {
  if (typeof window === "undefined" || !navigator.geolocation) {
    return Promise.reject(new Error("Location access is not available in this browser."));
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = Number(position.coords.latitude.toFixed(6));
        const longitude = Number(position.coords.longitude.toFixed(6));

        resolve({
          latitude,
          longitude,
          locationLabel: `Lat ${latitude}, Lng ${longitude}`,
        });
      },
      (error) => {
        reject(new Error(error.message || "Location access was denied."));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      },
    );
  }).then(async (coordinates) => {
    try {
      const resolvedAddress = await reverseGeocodeLocation(
        coordinates.latitude,
        coordinates.longitude,
      );
      return {
        ...coordinates,
        ...resolvedAddress,
      };
    } catch {
      return coordinates;
    }
  });
}

async function reverseGeocodeLocation(latitude, longitude) {
  const query = new URLSearchParams({
    format: "jsonv2",
    lat: String(latitude),
    lon: String(longitude),
    addressdetails: "1",
    zoom: "18",
    "accept-language": "en",
  });

  const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${query.toString()}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("We found your location, but the address lookup could not be completed.");
  }

  const payload = await response.json();
  const address = payload?.address ?? {};

  return {
    locationLabel:
      firstNonEmpty(
        address.suburb,
        address.neighbourhood,
        address.city_district,
        address.city,
        address.town,
        address.village,
      ) || `Lat ${latitude}, Lng ${longitude}`,
    addressLine1:
      joinAddressParts(
        address.house_number,
        address.road,
        address.pedestrian,
        address.footway,
        address.residential,
      ) || firstNonEmpty(address.hamlet, address.suburb, address.neighbourhood, payload?.name),
    city: firstNonEmpty(
      address.city,
      address.town,
      address.village,
      address.municipality,
      address.county,
    ),
    state: firstNonEmpty(address.state, address.state_district, address.region),
    postalCode: address.postcode ?? "",
    country: address.country ?? "",
    displayAddress: payload?.display_name ?? "",
  };
}

function joinAddressParts(...values) {
  return values
    .map((value) => String(value ?? "").trim())
    .filter(Boolean)
    .join(", ");
}

function firstNonEmpty(...values) {
  return values.find((value) => String(value ?? "").trim()) ?? "";
}
