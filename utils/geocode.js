const ExpressError = require("./ExpressError.js");

async function geocodeLocation(location, country) {
  const query = [location, country]
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .join(", ");

  if (!query) {
    throw new ExpressError(400, "Please provide a valid location and country.");
  }

  const params = new URLSearchParams({ q: query, format: "json", limit: "1" });
  let response;

  try {
    response = await fetch(
      `https://nominatim.openstreetmap.org/search?${params.toString()}`,
      { headers: { "User-Agent": "WanderlustCollegeProject/1.0" } },
    );
  } catch (error) {
    throw new ExpressError(502, "Could not reach the location service. Please try again.");
  }

  if (!response.ok) {
    throw new ExpressError(502, "The location service is unavailable. Please try again.");
  }

  let results;
  try {
    results = await response.json();
  } catch (error) {
    throw new ExpressError(502, "The location service returned an invalid response.");
  }

  const result = results[0];
  const latitude = Number(result?.lat);
  const longitude = Number(result?.lon);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new ExpressError(400, "We could not find that location. Please check it and try again.");
  }

  return { type: "Point", coordinates: [longitude, latitude] };
}

module.exports = { geocodeLocation };
