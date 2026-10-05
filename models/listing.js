const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require("./review.js");

const LISTING_CATEGORIES = [
  "Trending", "Rooms", "Iconic Cities", "Mountains", "Castles", "Pools",
  "Camping", "Farms", "Arctic", "Snow", "Boat",
];

const listingSchema = new Schema({
  title: {
    type: String,
    required: true,
  },

  description: String,

  image: {
    filename: String,
    url: String,
  },

  // GeoJSON uses [longitude, latitude]. It is optional so listings created
  // before maps were introduced remain readable.
  geometry: {
    type: {
      type: String,
      enum: ["Point"],
    },
    coordinates: {
      type: [Number],
    },
  },

  price: { type: Number, required: true, min: 0 },
  location: { type: String, required: true, trim: true },
  country: { type: String, required: true, trim: true },
  // Older records receive this sensible default; new records choose explicitly.
  category: { type: String, enum: LISTING_CATEGORIES, required: true, default: "Trending" },
  phone: {
    type: String,
    required: true,
    trim: true,
    match: [/^(?:\+91)?[6-9]\d{9}$/, "Please provide a valid Indian phone number."],
  },
  reviews: [
    {
      type: Schema.Types.ObjectId,
      ref: "Review",
    },
  ],
  owner: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
});

listingSchema.index({ geometry: "2dsphere" });

listingSchema.post("findOneAndDelete", async (listing) => {
  if (listing) {
    await Review.deleteMany({ _id: { $in: listing.reviews } });
  }
});

const Listing = mongoose.model("Listing", listingSchema);

module.exports = Listing;
module.exports.LISTING_CATEGORIES = LISTING_CATEGORIES;
