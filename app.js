require('dotenv').config();

const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const passport = require('passport');

require('./app_api/models/db');
require('./app_api/config/passport');

const apiRouter = require('./app_api/routes/index');

const app = express();

app.use('/api', (req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

// ===============================================
// 기본 미들웨어
// ===============================================
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ===============================================
// 🔥 Passport 초기화 (정적 파일보다 위에 있어야 함)
// ===============================================
app.use(passport.initialize());

// ===============================================
// 정적 파일 제공 (Angular Build)
// ===============================================
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'app_public', 'build/browser')));

// ===============================================
// API 라우팅
// ===============================================
app.use('/api', apiRouter);

// ===============================================
// Angular 라우팅 (Deep link 처리)
// ===============================================
app.get(/(.*)/, (req, res) => {
  res.sendFile(
    path.join(__dirname, 'app_public', 'build/browser', 'index.html')
  );
});

// ===============================================
// 인증 에러 처리
// ===============================================
app.use((err, req, res, next) => {
  if (err.name === 'UnauthorizedError') {
    return res
      .status(401)
      .json({ message: err.name + ": " + err.message });
  }
  next(err);
});

// ===============================================
// 기타 에러 처리 (JSON 기반)
// ===============================================
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({
    message: err.message,
    error: req.app.get('env') === 'development' ? err : {}
  });
});

module.exports = app;
