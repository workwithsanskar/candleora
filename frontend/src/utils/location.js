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
      let postalDetails = null;

      if (resolvedAddress?.postalCode) {
        try {
          postalDetails = await lookupPostalCodeDetails(resolvedAddress.postalCode);
        } catch {
          postalDetails = null;
        }
      }

      return {
        ...coordinates,
        ...resolvedAddress,
        city: resolvedAddress.city || postalDetails?.city || "",
        state: resolvedAddress.state || postalDetails?.state || "",
        country: resolvedAddress.country || postalDetails?.country || "",
        postalCode: resolvedAddress.postalCode || postalDetails?.postalCode || "",
        nearestPostOffice:
          resolvedAddress.nearestPostOffice || postalDetails?.nearestPostOffice || "",
        nearestPostalReference:
          resolvedAddress.nearestPostalReference || postalDetails?.postalReference || "",
      };
    } catch {
      return coordinates;
    }
  });
}

export async function lookupPostalCodeDetails(postalCode, countryCode = "in") {
  const normalizedPostalCode = String(postalCode ?? "").replace(/\D/g, "").slice(0, 6);

  if (normalizedPostalCode.length !== 6) {
    return null;
  }

  const query = new URLSearchParams({
    format: "jsonv2",
    postalcode: normalizedPostalCode,
    countrycodes: countryCode,
    addressdetails: "1",
    limit: "1",
    "accept-language": "en",
  });

  const response = await fetch(`https://nominatim.openstreetmap.org/search?${query.toString()}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("We could not verify this postal code right now.");
  }

  const payload = await response.json();
  const match = Array.isArray(payload) ? payload[0] : null;

  if (!match) {
    return null;
  }

  const address = match.address ?? {};

  return {
    city: firstNonEmpty(
      address.city,
      address.town,
      address.village,
      address.municipality,
      address.county,
      address.city_district,
    ),
    state: firstNonEmpty(address.state, address.state_district, address.region),
    country: address.country ?? "",
    postalCode: address.postcode ?? normalizedPostalCode,
    nearestPostOffice: firstNonEmpty(
      address.post_office,
      address.suburb,
      address.neighbourhood,
      address.city_district,
      address.city,
      address.town,
      address.village,
    ),
    postalReference: firstNonEmpty(
      joinAddressParts(
        firstNonEmpty(
          address.post_office,
          address.suburb,
          address.neighbourhood,
          address.city_district,
          address.city,
          address.town,
          address.village,
        ),
        address.postcode,
      ),
      joinAddressParts(firstNonEmpty(address.city, address.town, address.village), address.postcode),
    ),
  };
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
  const localArea = firstNonEmpty(
    address.suburb,
    address.neighbourhood,
    address.city_district,
    address.hamlet,
    address.city,
    address.town,
    address.village,
  );
  const nearestPostOffice = firstNonEmpty(
    address.post_office,
    joinAddressParts(localArea, firstNonEmpty(address.city, address.town, address.village)),
    localArea,
    firstNonEmpty(address.city, address.town, address.village),
  );
  const postalReference = firstNonEmpty(
    joinAddressParts(nearestPostOffice, address.postcode),
    joinAddressParts(localArea, address.postcode),
    address.postcode ? `Postal area ${address.postcode}` : "",
  );

  return {
    locationLabel: firstNonEmpty(
      joinAddressParts(firstNonEmpty(address.post_office, payload?.name), localArea),
      firstNonEmpty(address.post_office, payload?.name),
      localArea,
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
    nearestPostOffice,
    nearestPostalReference: postalReference,
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
