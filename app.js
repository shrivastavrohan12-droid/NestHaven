if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
const session = require("express-session");
const { MongoStore } = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");

const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");

const PORT = process.env.PORT || 8080;
const dbUrl = process.env.MONGO_URL || process.env.ATLASDB_URL;
const sessionSecret = process.env.SESSION_SECRET || process.env.SECRET;

mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error:", err.message);
});

mongoose.connection.on("disconnected", () => {
  console.warn("MongoDB disconnected");
});

function configureApp() {
  app.set("trust proxy", 1);
  app.set("view engine", "ejs");
  app.set("views", path.join(__dirname, "views"));
  app.engine("ejs", ejsMate);

  app.use(express.urlencoded({ extended: true }));
  app.use(methodOverride("_method"));
  app.use(express.static(path.join(__dirname, "/public")));

  const store = MongoStore.create({
    mongoUrl: dbUrl,
    crypto: { secret: sessionSecret },
    touchAfter: 24 * 3600,
  });
  store.on("error", (err) => {
    console.error("Session store error:", err.message);
  });

  app.use(session({
    store,
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    proxy: process.env.NODE_ENV === "production",
    cookie: {
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
    },
  }));
  app.use(flash());

  app.use(passport.initialize());
  app.use(passport.session());
  passport.use(new LocalStrategy(User.authenticate()));
  passport.serializeUser(User.serializeUser());
  passport.deserializeUser(User.deserializeUser());

  app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    return next();
  });

  app.get("/health", (req, res) => res.status(200).json({ status: "ok" }));
  app.get("/", (req, res) => res.redirect("/listings"));
  app.use("/listings", listingRouter);
  app.use("/listings/:id/reviews", reviewRouter);
  app.use("/", userRouter);

  app.use((req, res, next) => next(new ExpressError(404, "Page Not Found!")));

  app.use((err, req, res, next) => {
    if (res.headersSent) return next(err);
    if (err.code === "LIMIT_FILE_SIZE") {
      err = new ExpressError(400, "Image size must be 8 MB or less.");
    }
    if (err.name === "CastError") {
      err = new ExpressError(400, "The requested listing ID is invalid.");
    }
    const { statusCode = 500, message = "Something went wrong" } = err;
    return res.status(statusCode).render("error", { message });
  });
}

async function start() {
  if (!dbUrl) {
    throw new Error("MONGO_URL or ATLASDB_URL must be set before the server can start.");
  }
  if (!sessionSecret) {
    throw new Error("SESSION_SECRET or SECRET must be set before the server can start.");
  }

  await mongoose.connect(dbUrl, { serverSelectionTimeoutMS: 10000 });
  console.log("Connected to MongoDB");
  configureApp();
  app.listen(PORT, "0.0.0.0", () => console.log(`Listening on ${PORT}`));
}

start().catch((err) => {
  console.error("Failed to connect to MongoDB; server not started:", err.message);
  process.exit(1);
});
