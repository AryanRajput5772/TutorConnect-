const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

module.exports = {
  // Protect routes that require a logged-in Tutor
  isTutorAuth: (req, res, next) => {
    if (req.session && req.session.tutorId) {
      if (req.session.loginTime && (Date.now() - req.session.loginTime > TWENTY_FOUR_HOURS)) {
        return req.session.destroy(() => {
          res.clearCookie('connect.sid');
          res.redirect('/tutor/login?expired=1');
        });
      }
      return next();
    }
    req.flash('error_msg', 'Please log in to access your tutor portal');
    res.redirect('/tutor/login');
  },

  // Protect routes that require Admin access
  isAdminAuth: (req, res, next) => {
    if (req.session && req.session.adminId) {
      if (req.session.loginTime && (Date.now() - req.session.loginTime > TWENTY_FOUR_HOURS)) {
        return req.session.destroy(() => {
          res.clearCookie('connect.sid');
          res.redirect('/admin/login?expired=1');
        });
      }
      return next();
    }
    req.flash('error_msg', 'Please log in with admin credentials to access the Admin Dashboard');
    res.redirect('/admin/login');
  },

  // Redirect tutor to dashboard if already logged in (unless session expired)
  redirectIfTutorAuth: (req, res, next) => {
    if (req.session && req.session.tutorId) {
      if (req.session.loginTime && (Date.now() - req.session.loginTime > TWENTY_FOUR_HOURS)) {
        return req.session.destroy(() => {
          res.clearCookie('connect.sid');
          next();
        });
      }
      return res.redirect('/tutor/dashboard');
    }
    next();
  },

  // Redirect admin to dashboard if already logged in (unless session expired)
  redirectIfAdminAuth: (req, res, next) => {
    if (req.session && req.session.adminId) {
      if (req.session.loginTime && (Date.now() - req.session.loginTime > TWENTY_FOUR_HOURS)) {
        return req.session.destroy(() => {
          res.clearCookie('connect.sid');
          next();
        });
      }
      return res.redirect('/admin/dashboard');
    }
    next();
  }
};
