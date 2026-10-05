const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const { validateListing } = require("../utils/middleware.js");
const { isLoggedIn, isListingOwner } = require("../middleware.js");
const listingController = require("../controllers/listings.js");

const multer = require("multer");
const { storage } = require("../cloudconfig.js");
const ExpressError = require("../utils/ExpressError.js");

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    if (["image/jpeg", "image/jpg", "image/png"].includes(file.mimetype)) {
      return callback(null, true);
    }
    callback(new ExpressError(400, "Please upload a JPG, JPEG, or PNG image."));
  },
});

router
  .route("/")
  .get(wrapAsync(listingController.index))
  .post(
    isLoggedIn,
    upload.single("listing[image]"),
    validateListing,
    wrapAsync(listingController.createListing),
  );

router.get("/new", isLoggedIn, listingController.renderNewForm);

router
  .route("/:id")
  .get(wrapAsync(listingController.showListing))
  .put(
    isLoggedIn,
    wrapAsync(isListingOwner),
    upload.single("listing[image]"),
    validateListing,
    wrapAsync(listingController.updateListing),
  )
  .delete(
    isLoggedIn,
    isListingOwner,
    wrapAsync(listingController.destroyListing),
  );

router.get(
  "/:id/edit",
  isLoggedIn,
  wrapAsync(isListingOwner),
  listingController.renderEditForm,
);

module.exports = router;
