const express = require('express');
const middleware = require('../middleware');

const router = express.Router();

router.route('/')
  .get(middleware.auth.verify, (req, res) => {
    res.render('index.ejs', {
      user: req.user
    });
  });

router.route('/login')
  .get((req, res) => {
    res.render('login.ejs', { message: req.flash('loginMessage') });
  })
  .post(middleware.passport.authenticate('local-login', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
  }));

router.route('/signup')
  .get((req, res) => {
    res.render('signup.ejs', { message: req.flash('signupMessage') });
  })
  .post(middleware.passport.authenticate('local-signup', {
    successRedirect: '/',
    failureRedirect: '/signup',
    failureFlash: true
  }));

router.route('/logout')
  .get((req, res) => {
    req.logout();
    res.redirect('/login');
  });

router.get('/auth/github', middleware.passport.authenticate('github', {
  scope: ['user', 'email']
}));

router.get('/auth/github/callback', middleware.passport.authenticate('github', {
  successRedirect: '/',
  failureRedirect: '/login'
}));

router.route('/loggedin')
  .get(middleware.auth.verify, (req, res) => {
    res.send(req.user);
  });

module.exports = router;
