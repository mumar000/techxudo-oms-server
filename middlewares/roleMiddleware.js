// Middleware to check if user is admin
export const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    return res.status(403).json({
      success: false,
      error: "Access denied. Admin privileges required.",
    });
  }
};

// Middleware to check if user is employee
export const isEmployee = (req, res, next) => {
  if (req.user && req.user.role === "employee") {
    next();
  } else {
    return res.status(403).json({
      success: false,
      error: "Access denied. Employee privileges required.",
    });
  }
};

// Middleware to allow both admin and employee
export const isAuthenticated = (req, res, next) => {
  if (req.user) {
    next();
  } else {
    return res.status(401).json({
      success: false,
      error: "Authentication required",
    });
  }
};
