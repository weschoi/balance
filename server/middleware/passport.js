'use strict';
const axios = require('axios');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const config = require('config')['passport'];
const models = require('../../db/models');

passport.serializeUser((profile, done) => {
  done(null, profile.id);
});

passport.deserializeUser((id, done) => {
  return models.Profile.where({ id }).fetch()
    .then(profile => {
      if (!profile) {
        throw profile;
      }
      done(null, profile.serialize());
    })
    .error(error => {
      done(error, null);
    })
    .catch(() => {
      done(null, null, { message: 'No user found' });
    });
});

passport.use('local-signup', new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password',
  passReqToCallback: true
},
(req, emailAddress, password, done) => {
  // check to see if there is any account with this email address
  return models.Profile.where({ emailAddress }).fetch()
    .then(profile => {
      // create a new profile if a profile does not exist
      if (!profile) {
        return models.Profile.forge({
          emailAddress: emailAddress,
          firstName: req.body.firstName,
          lastName: req.body.lastName
        }).save();
      }
      // throw if any auth account already exists
      if (profile) {
        throw profile;
      }

      return profile;
    })
    .tap(profile => {
      // create a new local auth account with the user's profile id
      return models.Auth.forge({
        password,
        type: 'local',
        profileId: profile.get('id')
      }).save();
    })
    .then(profile => {
      // serialize profile for session
      done(null, profile.serialize());
    })
    .error(error => {
      done(error, null);
    })
    .catch(() => {
      done(null, false, req.flash('signupMessage', 'An account with this email address already exists.'));
    });
}));

passport.use('local-login', new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password',
  passReqToCallback: true
},
(req, emailAddress, password, done) => {
  // fetch any profiles that have a local auth account with this email address
  return models.Profile.where({ emailAddress }).fetch({
    withRelated: [{
      auths: query => query.where({ type: 'local' })
    }]
  })
    .then(profile => {
      // if there is no profile with that email or if there is no local auth account with profile
      if (!profile || !profile.related('auths').at(0)) {
        throw profile;
      }

      // check password and pass through account
      return Promise.all([profile, profile.related('auths').at(0).comparePassword(password)]);
    })
    .then(([profile, match]) => {
      if (!match) {
        throw profile;
      }
      // if the password matches, pass on the profile
      return profile;
    })
    .then(profile => {
      // call done with serialized profile to include in session
      done(null, profile.serialize());
    })
    .error(err => {
      done(err, null);
    })
    .catch((err) => {
      done(null, null, req.flash('loginMessage', 'Incorrect username or password'));
    });
}));

// +passport.use('twitter', new TwitterStrategy({
//  +  consumerKey: config.Twitter.consumerKey,
//  +  consumerSecret: config.Twitter.consumerSecret,
//  +  callbackURL: config.Twitter.callbackURL,
//  +  userProfileURL: 'https://api.twitter.com/1.1/account/verify_credentials.json?include_email=true'
//  +},
//  +  (accessToken, refreshToken, profile, done) => getOrCreateOAuthProfile('twitter', profile, done))
//  +);

// passport.use('github', new GitHubStrategy({
//   clientID: process.env.GITHUB_CLIENT_ID || config.GitHub.clientID,
//   clientSecret: process.env.GITHUB_CLIENT_SECRET || config.GitHub.clientSecret,
//   callbackURL: process.env.GITHUB_CALLBACK_URL || config.GitHub.callbackURL
// },
// (accessToken, refreshToken, profile, done) => getOrCreateOAuthProfile('github', accessToken, profile, done))
// );

passport.use('github', new GitHubStrategy({
  clientID: config.GitHub.clientID,
  clientSecret: config.GitHub.clientSecret,
  callbackURL: config.GitHub.callbackURL
},
(accessToken, refreshToken, profile, done) => getOrCreateOAuthProfile('github', accessToken, profile, done))
);

const getOrCreateOAuthProfile = (type, accessToken, oauthProfile, done) => {
  return models.Auth
    .where({ type, oauthId: oauthProfile.id })
    .fetch({ withRelated: ['profile'] })
    .then(oauthAccount => {
      if (oauthAccount) {
        throw oauthAccount;
      }
      console.log(oauthAccount);
      if (!oauthProfile.emails || !oauthProfile.emails.length) {
        // GitHub users can set email address as private. The below request uses
        // their access token to retrieve the primary email address
        axios({
          method: 'get',
          url: 'https://api.github.com/user/emails',
          headers: {
            authorization: `token ${accessToken}`
          }
        })
        .then(response => {
          return models.Profile
            .where({
              emailAddress: response.find(item => item.primary).email
            })
            .fetch();
        });
      }
      return models.Profile
        .where({
          emailAddress: oauthProfile.emails[0].value
        })
        .fetch();
    })
    .then(profile => {
      console.log(profile);
      let profileInfo = {
        emailAddress: oauthProfile.emails[0].value,
        firstName: oauthProfile._json.name.split(' ')[0],
        lastName: oauthProfile._json.name.split(' ')[1]
      };
      if (profile) {
        // update profile with info from oauth
        return profile.save(profileInfo, { method: 'update' });
      }
      // otherwise create new profile
      return models.Profile.forge(profileInfo).save();
    })
    .tap(profile => {
      return models.Auth.forge({
        type,
        profileId: profile.get('id'),
        oauthId: oauthProfile.id
      }).save();
    })
    .error(err => {
      console.log(err)
      done(err, null);
    })
    .catch(oauthAccount => {
      console.log('error!!!!');
      if (!oauthAccount) {
        throw oauthAccount;
      }
      return oauthAccount.related('profile');
    })
    .then(profile => {
      if (profile) {
        done(null, profile.serialize());
      }
    })
    .catch((err) => {
      // TODO: This is not working because redirect to login uses
      // req.flash('loginMessage') and there is no access to req here
      done(null, null, {
        'message': 'Signing up requires an email address. \
          Please be sure the email address associated with your \
          GitHub account is public.' });
    });
};

module.exports = passport;
