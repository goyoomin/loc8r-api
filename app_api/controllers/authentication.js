const passport = require('passport');
const mongoose = require('mongoose');
const User = mongoose.model('User');

/**
 * 회원가입
 */
const register = async (req, res) => {
  if (!req.body.name || !req.body.email || !req.body.password) {
    return res.status(400).json({ message: "All fields required" });
  }

  try {
    const user = new User();
    user.name = req.body.name;
    user.email = req.body.email;
    user.setPassword(req.body.password);

    await user.save();

    const token = user.generateJwt();
    return res.status(200).json({ token });

  } catch (err) {
    console.error(err);
    return res.status(400).json(err);
  }
};


/**
 * 로그인
 */
const login = (req, res, next) => {
  if (!req.body.email || !req.body.password) {
    return res.status(400).json({ message: "All fields required" });
  }

  passport.authenticate('local', (err, user, info) => {

    if (err) {
      return next(err);
    }

    if (!user) {
      return res.status(401).json(info);
    }

    const token = user.generateJwt();
    return res.status(200).json({ token });

  })(req, res, next);  
};


module.exports = {
  register,
  login
};
