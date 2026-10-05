module.exports = function wrapAsync(fn) {
  return function (req, res, next) {
    return Promise.resolve(fn(req, res, next)).catch(next);
  };
};
