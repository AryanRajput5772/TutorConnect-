module.exports = {
  // Protect routes that require a logged-in Tutor
  isTutorAuth: (req, res, next) => {
    if (req.session && req.session.tutorId) {
      return next();
    }
    req.flash('error_msg', 'Please log in to access your tutor portal');
    res.redirect('/tutor/login');
  },

  // Protect routes that require Admin access
  isAdminAuth: (req, res, next) => {
    if (req.session && req.session.adminId) {
      return next();
    }
    req.flash('error_msg', 'Please log in with admin credentials to access the Admin Dashboard');
    res.redirect('/admin/login');
  },

  // Redirect tutor to dashboard if already logged in
  redirectIfTutorAuth: (req, res, next) => {
    if (req.session && req.session.tutorId) {
      return res.redirect('/tutor/dashboard');
    }
    next();
  },

  // Redirect admin to dashboard if already logged in
  redirectIfAdminAuth: (req, res, next) => {
    if (req.session && req.session.adminId) {
      return res.redirect('/admin/dashboard');
    }
    next();
  }
};
