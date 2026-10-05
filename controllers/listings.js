const Listing = require("../models/listing.js");
const { LISTING_CATEGORIES } = Listing;
const ExpressError = require("../utils/ExpressError.js");
const { geocodeLocation } = require("../utils/geocode.js");

const cloudinaryImageFrom = (file) => {
  if (!file) return undefined;
  // multer-storage-cloudinary v4 exposes `path` as the secure Cloudinary URL
  // and `filename` as the Cloudinary public ID.
  return { url: file.path, filename: file.filename };
};

module.exports.index = async (req, res) => {
  const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
  const category = typeof req.query.category === "string" ? req.query.category.trim() : "";
  const filter = {};

  if (category && LISTING_CATEGORIES.includes(category)) {
    // Treat pre-category records as Trending until their owner updates them.
    filter.category = category === "Trending"
      ? { $in: ["Trending", null] }
      : category;
  }
  if (search) {
    // Escape regex characters so a visitor's phrase is always searched literally.
    const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = ["title", "location", "country"].map((field) => ({
      [field]: { $regex: escapedSearch, $options: "i" },
    }));
  }

  const allListings = await Listing.find(filter).lean();
  res.render("listings/index.ejs", {
    allListings,
    search,
    selectedCategory: category && LISTING_CATEGORIES.includes(category) ? category : "",
    categories: LISTING_CATEGORIES,
  });
};

module.exports.renderNewForm = (req, res) =>
  res.render("listings/new.ejs", { categories: LISTING_CATEGORIES });

module.exports.createListing = async (req, res) => {
  if (!req.file) {
    throw new ExpressError(400, "Please upload a listing image.");
  }

  const newListing = new Listing(req.body.listing);
  newListing.image = cloudinaryImageFrom(req.file);
  newListing.geometry = await geocodeLocation(
    newListing.location,
    newListing.country,
  );
  newListing.owner = req.user._id;
  await newListing.save();
  req.flash("success", "New Listing Created!");
  res.redirect("/listings");
};

module.exports.showListing = async (req, res) => {
  const listing = await Listing.findById(req.params.id)
    .populate("owner")
    .populate({ path: "reviews", populate: { path: "author" } });
  if (!listing) {
    req.flash("error", "The listing you requested does not exist.");
    return res.redirect("/listings");
  }
  res.render("listings/show.ejs", { listing });
};

module.exports.renderEditForm = (req, res) => {
  const listing = res.locals.listing;
  const imageUrl = listing.image?.url;
  const isCloudinaryUrl = /^https?:\/\/res\.cloudinary\.com\//i.test(imageUrl || "");
  const originalImageUrl = isCloudinaryUrl
    ? imageUrl.replace(
        "/upload/",
        "/upload/w_250,h_200,c_fill,q_auto,f_auto/",
      )
    : imageUrl;

  res.render("listings/edit.ejs", { listing, originalImageUrl, categories: LISTING_CATEGORIES });
};

module.exports.updateListing = async (req, res) => {
  const listing = await Listing.findById(req.params.id);
  if (!listing) {
    req.flash("error", "The listing you requested does not exist.");
    return res.redirect("/listings");
  }

  const locationChanged =
    listing.location !== req.body.listing.location ||
    listing.country !== req.body.listing.country;
  const hasGeometry =
    Array.isArray(listing.geometry?.coordinates) &&
    listing.geometry.coordinates.length === 2 &&
    listing.geometry.coordinates.every(Number.isFinite);

  Object.assign(listing, req.body.listing);

  const image = cloudinaryImageFrom(req.file);
  if (image) listing.image = image;
  if (locationChanged || !hasGeometry) {
    listing.geometry = await geocodeLocation(listing.location, listing.country);
  }

  await listing.save();
  req.flash("success", "Listing Updated!");
  res.redirect(`/listings/${listing._id}`);
};

module.exports.destroyListing = async (req, res) => {
  const listing = await Listing.findByIdAndDelete(req.params.id);
  if (!listing) {
    req.flash("error", "The listing you requested does not exist.");
    return res.redirect("/listings");
  }
  req.flash("success", "Listing Deleted!");
  res.redirect("/listings");
};
