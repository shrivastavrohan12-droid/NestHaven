(() => {
  const listing = window.listingMapData;
  const coordinates = listing?.geometry?.coordinates;
  const mapElement = document.getElementById("map");

  if (
    !mapElement ||
    !window.L ||
    !Array.isArray(coordinates) ||
    coordinates.length !== 2
  ) {
    return;
  }

  const [longitude, latitude] = coordinates.map(Number);
  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) return;

  const map = L.map(mapElement).setView([latitude, longitude], 12);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
    maxZoom: 19,
  }).addTo(map);

  const popupContent = document.createElement("div");
  const title = document.createElement("h5");
  title.textContent = listing.title || "Listing location";
  const message = document.createElement("p");
  message.className = "mb-0";
  message.textContent = "Exact location will be provided after booking.";
  popupContent.append(title, message);

  L.marker([latitude, longitude]).addTo(map).bindPopup(popupContent).openPopup();
})();
