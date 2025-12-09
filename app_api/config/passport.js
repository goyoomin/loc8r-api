const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const mongoose = require('mongoose');
const path = require('path');

// User 모델 로드
require(path.join(__dirname, '..', 'models', 'users.js'));
const User = mongoose.model('User');

passport.use(new LocalStrategy(
  {
    usernameField: 'email'
  },
  async (username, password, done) => {
    try {
      // Mongoose v7 이상은 async/await만 지원
      const user = await User.findOne({ email: username });

      if (!user) {
        return done(null, false, { message: 'Incorrect username.' });
      }

      if (!user.validPassword(password)) {
        return done(null, false, { message: 'Incorrect password.' });
      }

      return done(null, user);

    } catch (err) {
      return done(err);
    }
  }
));
