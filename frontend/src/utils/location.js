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
  });
}
