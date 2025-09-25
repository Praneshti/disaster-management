const express = require('express');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { redirectIfAuthenticated } = require('../middleware/auth');

const router = express.Router();

// Web routes for login/signup pages
router.get('/login', redirectIfAuthenticated, (req, res) => {
  res.render('pages/login', { title: 'Login', error: req.query.error });
});

router.get('/signup', redirectIfAuthenticated, (req, res) => {
  res.render('pages/signup', { title: 'Signup', error: req.query.error });
});

// API routes for authentication
router.post('/signup',
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['admin', 'donor', 'ngo', 'volunteer', 'victim']).withMessage('Invalid role'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      if (req.accepts('html')) {
        return res.redirect(`/auth/signup?error=${encodeURIComponent(errors.array()[0].msg)}`);
      }
      return res.status(400).json({ errors: errors.array() });
    }
    
    try {
      const { name, email, password, role = 'victim' } = req.body;
      const exists = await User.findOne({ email });
      if (exists) {
        if (req.accepts('html')) {
          return res.redirect('/auth/signup?error=Email already registered');
        }
        return res.status(400).json({ message: 'Email already registered' });
      }
      
      const user = await User.create({ name, email, password, role });
      const token = jwt.sign({ id: user._id, role: user.role, name: user.name }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
      
      if (req.accepts('html')) {
        res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
        return res.redirect('/dashboard');
      }
      
      res.json({ token, user: { id: user._id, name: user.name, role: user.role } });
    } catch (err) {
      if (req.accepts('html')) {
        return res.redirect('/auth/signup?error=Signup failed');
      }
      res.status(500).json({ message: 'Signup failed' });
    }
  }
);

router.post('/login',
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      if (req.accepts('html')) {
        return res.redirect(`/auth/login?error=${encodeURIComponent(errors.array()[0].msg)}`);
      }
      return res.status(400).json({ errors: errors.array() });
    }
    
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });
      if (!user) {
        if (req.accepts('html')) {
          return res.redirect('/auth/login?error=Invalid credentials');
        }
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      const match = await user.comparePassword(password);
      if (!match) {
        if (req.accepts('html')) {
          return res.redirect('/auth/login?error=Invalid credentials');
        }
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      if ((user.role === 'ngo' || user.role === 'volunteer') && !user.approved) {
        if (req.accepts('html')) {
          return res.redirect('/auth/login?error=Awaiting admin approval');
        }
        return res.status(403).json({ message: 'Awaiting admin approval' });
      }
      
      const token = jwt.sign({ id: user._id, role: user.role, name: user.name }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
      
      if (req.accepts('html')) {
        res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
        return res.redirect('/dashboard');
      }
      
      res.json({ token, user: { id: user._id, name: user.name, role: user.role } });
    } catch (err) {
      if (req.accepts('html')) {
        return res.redirect('/auth/login?error=Login failed');
      }
      res.status(500).json({ message: 'Login failed' });
    }
  }
);

router.post('/logout', (req, res) => {
  res.clearCookie('token');
  if (req.accepts('html')) {
    return res.redirect('/login');
  }
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;
