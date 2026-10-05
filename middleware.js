const Listing = require("./models/listing.js");
const Review = require("./models/review.js");

module.exports.isLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.session.redirectUrl = req.originalUrl;
    req.flash("error", "You must be logged in to do that.");
    return res.redirect("/login");
  }
  next();
};

module.exports.isListingOwner = async (req, res, next) => {
  const listing = await Listing.findById(req.params.id);

  if (!listing) {
    req.flash("error", "The listing you requested does not exist.");
    return res.redirect("/listings");
  }

  if (!listing.owner || !listing.owner.equals(req.user._id)) {
    req.flash("error", "You do not have permission to do that.");
    return res.redirect(`/listings/${listing._id}`);
  }

  res.locals.listing = listing;
  next();
};

module.exports.isReviewAuthor = async (req, res, next) => {
  const [listing, review] = await Promise.all([
    Listing.findById(req.params.id),
    Review.findById(req.params.reviewId),
  ]);

  if (
    !listing ||
    !review ||
    !listing.reviews.some((id) => id.equals(review._id))
  ) {
    req.flash("error", "The review you requested does not exist.");
    return res.redirect(`/listings/${req.params.id}`);
  }

  if (!review.author || !review.author.equals(req.user._id)) {
    req.flash("error", "You do not have permission to do that.");
    return res.redirect(`/listings/${req.params.id}`);
  }

  next();
};

module.exports.saveRedirectUrl = (req, res, next) => {
  if (req.session.redirectUrl) {
    res.locals.redirectUrl = req.session.redirectUrl;
  }
  next();
};
