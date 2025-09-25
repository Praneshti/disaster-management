const express = require('express');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const Request = require('../models/Request');
const Donation = require('../models/Donation');
const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Redirect root to login if not authenticated, otherwise to dashboard
router.get('/', optionalAuth, async (req, res) => {
  // Public homepage with recent requests and donations
  try {
    const recentRequests = await Request.find({}).sort({ createdAt: -1 }).limit(6).lean();
    const recentDonations = await Donation.find({}).sort({ createdAt: -1 }).limit(6).lean();
    return res.render('pages/home', { title: 'Home', user: req.user || null, recentRequests, recentDonations });
  } catch (e) {
    return res.render('pages/home', { title: 'Home', user: req.user || null, recentRequests: [], recentDonations: [] });
  }
});

// Dashboard route - requires authentication
router.get('/dashboard', requireAuth, (req, res) => {
  res.render('pages/dashboard', { 
    title: 'Dashboard', 
    user: req.user,
    role: req.user.role 
  });
});

// Public pages that require authentication
router.get('/about', requireAuth, (req, res) => {
  res.render('pages/about', { title: 'About', user: req.user });
});

router.get('/resources', requireAuth, (req, res) => {
  res.render('pages/resources', { title: 'Resources', user: req.user });
});

router.get('/request-help', requireAuth, (req, res) => {
  res.render('pages/request-help', { title: 'Request Help', user: req.user });
});

router.get('/donate', requireAuth, (req, res) => {
  res.render('pages/donate', { title: 'Donate', user: req.user });
});

// Legacy routes for backward compatibility
router.get('/login', (req, res) => {
  res.redirect('/auth/login');
});

router.get('/signup', (req, res) => {
  res.redirect('/auth/signup');
});

module.exports = router;
