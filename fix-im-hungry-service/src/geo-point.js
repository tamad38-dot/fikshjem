// Shared input validation without the mobile UI's translation/data dependencies.
function validPoint(p) {
  return (
    p &&
    Number.isFinite(p.latitude) &&
    Number.isFinite(p.longitude) &&
    Math.abs(p.latitude) <= 90 &&
    Math.abs(p.longitude) <= 180
  );
}
module.exports = { validPoint };
