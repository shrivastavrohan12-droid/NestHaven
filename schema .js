const Joi = require("joi");
const { LISTING_CATEGORIES } = require("./models/listing.js");

module.exports.listingSchema = Joi.object({
  listing: Joi.object({
    title: Joi.string().trim().required(),

    description: Joi.string().trim().required(),

    location: Joi.string().trim().required(),

    country: Joi.string().trim().required(),

    price: Joi.number().min(0).required(),
    category: Joi.string().valid(...LISTING_CATEGORIES).required(),
    phone: Joi.string().trim().pattern(/^(?:\+91)?[6-9]\d{9}$/).required()
      .messages({ "string.pattern.base": "Please provide a valid Indian phone number." }),
  }).required(),
});

module.exports.reviewSchema = Joi.object({
  review: Joi.object({
    rating: Joi.number().required().min(1).max(5),
    comment: Joi.string().required(),
  }).required(),
});
