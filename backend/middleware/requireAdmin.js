// Runs after `protect`. Allows only users with role === 'admin'.
// protect sets req.user from the User model; req.user is null for Admin-model tokens.
const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') return next();
  res.status(403).json({ message: 'Not authorized as admin' });
};

module.exports = requireAdmin;
