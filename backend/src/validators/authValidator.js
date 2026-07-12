function validateLogin(req, res, next) {
  const { email, password } = req.body;
  const errors = {};

  if (!email) {
    errors.email = 'Email address is required';
  } else if (!/\S+@\S+\.\S+/.test(email)) {
    errors.email = 'Please provide a valid email address';
  }

  if (!password) {
    errors.password = 'Password is required';
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
}

module.exports = {
  validateLogin
};
