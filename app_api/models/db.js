// ✅ Mongoose 및 환경 설정 로드
const mongoose = require('mongoose');
const readline = require('readline');
require('dotenv').config();   // .env 파일 로드
require('./locations.js');    // 모델 불러오기

// ✅ Atlas 연결 URI (.env 파일에 MONGODB_URI=... 로 저장)
const dbURI = process.env.MONGODB_URI;

const connect = async () => {
  try {
    await mongoose.connect(dbURI);
    console.log(`✅ Mongoose connected successfully`);
    console.log(`🔗 Host: ${mongoose.connection.host}, DB: ${mongoose.connection.name}`);
  } catch (err) {
    console.error('❌ Mongoose connection error:', err.message);
    setTimeout(connect, 3000);
  }
};

// ✅ 연결 이벤트 로그
mongoose.connection.on('connected', () => {
  console.log('🟢 Mongoose connection established.');
});

mongoose.connection.on('error', (err) => {
  console.log('🔴 Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('🟡 Mongoose disconnected.');
});

// ✅ 윈도우용 SIGINT 처리
if (process.platform === 'win32') {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.on('SIGINT', () => {
    process.emit('SIGINT');
  });
}

// ✅ 종료 시 처리 (Promise 기반)
const gracefulShutdown = async (msg) => {
  try {
    await mongoose.connection.close();
    console.log(`⚙️ Mongoose disconnected through ${msg}`);
  } catch (err) {
    console.error('❌ Error during disconnection:', err);
  }
};

// Nodemon 종료 시
process.once('SIGUSR2', async () => {
  await gracefulShutdown('nodemon restart');
  process.kill(process.pid, 'SIGUSR2');
});

// 앱 강제 종료 시
process.on('SIGINT', async () => {
  await gracefulShutdown('app termination');
  process.exit(0);
});

// Heroku 종료 시
process.on('SIGTERM', async () => {
  await gracefulShutdown('Heroku app shutdown');
  process.exit(0);
});

// ✅ 연결 시도
connect();
