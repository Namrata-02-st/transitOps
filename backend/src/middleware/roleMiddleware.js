// Role-Based Access Control (RBAC) authorization middleware
function roleMiddleware(allowedRoles = []) {
  return (req, res, next) => {
    // Check if user object exists (appended by authMiddleware)
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. Authentication details missing.'
      });
    }

    const hasRole = allowedRoles.includes(req.user.role);

    if (!hasRole) {
      return res.status(403).json({
        success: false,
        message: `Forbidden. Your role (${req.user.role}) does not have permission to execute this operation.`
      });
    }

    next();
  };
}

module.exports = roleMiddleware;
