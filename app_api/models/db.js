const mongoose = require('mongoose');
const readline = require('readline');
require('dotenv').config();

// ===============================================
// 🔥 1. DB URI 설정
// ===============================================
const dbURI = process.env.MONGODB_URI;

// ===============================================
// 🔥 2. DB 연결 함수
// ===============================================
const connect = async () => {
  try {
    await mongoose.connect(dbURI);
    console.log(`🟢 Mongoose connected successfully`);
    console.log(`🔗 Host: ${mongoose.connection.host}, DB: ${mongoose.connection.name}`);
  } catch (err) {
    console.error('❌ Mongoose connection error:', err.message);
    setTimeout(connect, 3000);
  }
};


// ===============================================
// 🔥 3. 모델 등록 (DB 옵션 설정 후에 require해야 안정적)
// ===============================================
require('./locations.js');   // Location 모델 등록
require('./users.js');       // User 모델 등록 (중요!)


// ===============================================
// 🔥 4. Mongoose 이벤트 처리
// ===============================================
mongoose.connection.on('connected', () => {
  console.log('🟢 Mongoose connection established.');
});

mongoose.connection.on('error', (err) => {
  console.log('🔴 Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('🟡 Mongoose disconnected.');
});


// ===============================================
// 🔥 5. 윈도우 SIGINT 처리
// ===============================================
if (process.platform === 'win32') {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.on('SIGINT', () => {
    process.emit('SIGINT');
  });
}


// ===============================================
// 🔥 6. 종료 시 Graceful Shutdown
// ===============================================
const gracefulShutdown = async (msg) => {
  try {
    await mongoose.connection.close();
    console.log(`⚙️ Mongoose disconnected through ${msg}`);
  } catch (err) {
    console.error('❌ Error during disconnection:', err);
  }
};

process.once('SIGUSR2', async () => {
  await gracefulShutdown('nodemon restart');
  process.kill(process.pid, 'SIGUSR2');
});

process.on('SIGINT', async () => {
  await gracefulShutdown('app termination');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await gracefulShutdown('Heroku app shutdown');
  process.exit(0);
});


// ===============================================
// 🔥 7. 연결 시작
// ===============================================
connect();

