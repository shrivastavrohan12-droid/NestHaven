const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");
const { LISTING_CATEGORIES } = Listing;

const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";

main()
  .then(() => {
    console.log("Connected to DB");
  })
  .catch((err) => {
    console.log("MongoDB connection error:", err);
  });

async function main() {
  await mongoose.connect(MONGO_URL);
}

const initDB = async () => {
  await Listing.deleteMany({});
  // The starter dataset predates the contact/category fields. Supplying demo
  // values here keeps reseeding compatible with the same validation as the app.
  const listings = initData.data.map((listing, index) => ({
    ...listing,
    category: LISTING_CATEGORIES[index % LISTING_CATEGORIES.length],
    phone: "9876543210",
  }));
  await Listing.insertMany(listings);
  console.log("data was initalized");
};

initDB();
