require('dotenv').config();
const express = require('express');
const path = require('path');
const methodOverride = require('method-override');
const morgan = require('morgan');
const session = require('express-session');
const { MongoStore } = require('connect-mongo');
const flash = require('connect-flash');
const connectDB = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB().catch(err => console.error('Initial DB connection attempt failed:', err.message));

// View Engine Setup (EJS)
app.set('view engine', 'ejs');
app.set('views', path.join(process.cwd(), 'views'));

// Static Files
app.use(express.static(path.join(process.cwd(), 'public')));

// Middleware
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.json({ limit: '10mb' }));
app.use(methodOverride('_method'));

// Ensure req.body is always an object across serverless invocations and empty-payload form submissions
app.use((req, res, next) => {
  if (!req.body) req.body = {};
  next();
});

// Ensure DB connection is active for each request (vital for serverless cold starts)
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('DB middleware connection error:', err.message);
    next(err);
  }
});

// Express Session with MongoStore for serverless persistent logins
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'tutorconnect_super_secret_key_2026',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
  }
};

if (process.env.MONGODB_URI) {
  sessionConfig.store = MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    collectionName: 'sessions',
    ttl: 14 * 24 * 60 * 60 // 14 days
  });
}

app.use(session(sessionConfig));

// Connect Flash
app.use(flash());

// Global Variables for all EJS templates
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.currentPath = req.path;
  res.locals.currentUser = req.session.tutorName || null;
  res.locals.isTutor = !!req.session.isTutor;
  res.locals.tutorId = req.session.tutorId || null;
  res.locals.adminUser = req.session.adminName || null;
  res.locals.isAdmin = !!req.session.isAdmin;
  next();
});

// Mount Routes
app.use('/', require('./routes/index'));
app.use('/tutor', require('./routes/tutor'));
app.use('/admin', require('./routes/admin'));

// 404 Handler
app.use((req, res) => {
  res.status(404).render('404', {
    title: 'Page Not Found - TutorConnect'
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).render('error', {
    title: 'Server Error - TutorConnect',
    error: process.env.NODE_ENV === 'development' ? err : null
  });
});

// Start Server if run directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\n=================================================`);
    console.log(`🎓 TutorConnect Server running at: http://localhost:${PORT}`);
    console.log(`🏠 Homepage:        http://localhost:${PORT}`);
    console.log(`👨‍🏫 Tutor Portal:   http://localhost:${PORT}/tutor/login`);
    console.log(`🛡️ Admin Portal:    http://localhost:${PORT}/admin/login`);
    console.log(`=================================================\n`);
  });
}

module.exports = app;
