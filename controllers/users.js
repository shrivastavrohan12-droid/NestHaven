const User = require("../models/user.js");

module.exports.renderSignupForm = (req, res) => res.render("users/signup.ejs");

module.exports.signup = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    if (!/^[^\s@]+@gmail\.com$/i.test(email || "")) {
      req.flash("error", "Please provide a valid Gmail address.");
      return res.redirect("/signup");
    }
    const registeredUser = await User.register(
      new User({ email, username }),
      password,
    );
    req.login(registeredUser, (err) => {
      if (err) return next(err);
      req.flash("success", "Welcome to NestHaven!");
      res.redirect("/listings");
    });
  } catch (err) {
    req.flash("error", err.message);
    res.redirect("/signup");
  }
};

module.exports.renderLoginForm = (req, res) => res.render("users/login.ejs");

module.exports.login = (req, res) => {
  req.flash("success", "Welcome back to NestHaven!");
  res.redirect(res.locals.redirectUrl || "/listings");
};

module.exports.logout = (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.flash("success", "You are logged out!");
    res.redirect("/listings");
  });
};
