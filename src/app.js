const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const expressLayouts = require('express-ejs-layouts');
const logger = require('./config/logger');
const requestLogger = require('./middleware/requestLogger');

const indexRoutes = require('./routes/index');
const authRoutes = require('./routes/auth');
const resourceRoutes = require('./routes/resources');
const requestRoutes = require('./routes/requests');
const donationRoutes = require('./routes/donations');
const adminRoutes = require('./routes/admin');
const volunteerRoutes = require('./routes/volunteers');
const { optionalAuth } = require('./middleware/auth');

const app = express();

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.set('layout', 'layout');
app.use(expressLayouts);

// Static
app.use('/public', express.static(path.join(__dirname, '..', 'public')));

// Security & utils middleware (ensure parsers before routes)
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(compression());
app.use(cookieParser());
app.use(morgan('dev'));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
app.use(requestLogger);

// Health endpoint for quick Postman checks
app.get('/health', (req, res) => res.json({ ok: true, env: process.env.NODE_ENV || 'dev' }));

// Routes
app.use('/', indexRoutes);
app.use('/auth', authRoutes);
app.use('/api/resources', optionalAuth, resourceRoutes);
app.use('/api/requests', optionalAuth, requestRoutes);
app.use('/api/donations', optionalAuth, donationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/volunteers', volunteerRoutes);

// 404
app.use((req, res, next) => {
  res.status(404);
  // Render a friendly 404 page
  return res.render('pages/404', { title: 'Not Found' });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  if (req.accepts('html')) {
    return res.status(500).render('pages/500', { title: 'Server Error' });
  }
  return res.status(500).json({ message: 'Internal Server Error' });
});

module.exports = app;
