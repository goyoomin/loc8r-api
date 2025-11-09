const express = require('express');
const router = express.Router();

const ctrlLocations = require('../controllers/locations');
const ctrlOthers = require('../controllers/others');

// 홈 페이지
router.get('/', ctrlLocations.homelist);

// 장소 상세 페이지
router.get('/location/:locationid', ctrlLocations.locationInfo);

// 리뷰 작성 (GET/POST)
router
  .route('/location/:locationid/review/new')
  .get(ctrlLocations.addReview)
  .post(ctrlLocations.doAddReview);

// About 페이지
router.get('/about', ctrlOthers.about);

module.exports = router;
