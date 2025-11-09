const request = require('request');
require('dotenv').config();

const apiOptions = {
  server: 'http://localhost:3000'
};
if (process.env.NODE_ENV === 'production') {
  apiOptions.server = 'https://loc8r-api-gayp.onrender.com';
}

/* ============================
   1. 홈 리스트 (위치 리스트)
============================ */
const homelist = (req, res) => {
  const path = '/api/locations';
  const requestOptions = {
    url: `${apiOptions.server}${path}`,
    method: 'GET',
    json: {},
    qs: {
      lng: 127.2656,
      lat: 37.0087,
      maxDistance: 20000
    }
  };

  request(requestOptions, (err, response, body) => {
    let data = [];
    let message = null;
    const statusCode = response && response.statusCode ? response.statusCode : 0;

    if (err) {
      console.error('❌ API 요청 오류:', err);
      message = 'API lookup error';
    } else if (statusCode === 200 && Array.isArray(body)) {
      if (body.length) {
        data = body.map((item) => ({
          _id: item._id,
          name: item.name,
          address: item.address,
          rating: item.rating,
          facilities: item.facilities,
          distance: formatDistance(item.distance)
        }));
      } else {
        message = 'No places found nearby';
      }
    } else if (statusCode === 404) {
      message = 'No places found nearby';
    } else {
      message = `Unexpected API response: ${statusCode}`;
    }

    renderHomepage(req, res, data, message);
  });
};

const formatDistance = (distance) => {
  let thisDistance = 0;
  let unit = 'm';
  const n = typeof distance === 'string' ? parseFloat(distance) : distance;

  if (n > 1000) {
    thisDistance = parseFloat(n / 1000).toFixed(1);
    unit = 'km';
  } else {
    thisDistance = Math.floor(n);
  }
  return thisDistance + unit;
};

/* ============================
   2. 홈페이지 렌더링
============================ */
const renderHomepage = (req, res, responseBody, message) => {
  res.render('locations-list', {
    title: 'Loc8r - find a place to work with wifi',
    pageHeader: {
      title: 'Loc8r',
      strapline: 'Find places to work with wifi near you!'
    },
    sidebar:
      'Looking for wifi and a seat? Loc8r helps you find places to work when out and about. ' +
      'Perhaps with coffee, cake or a pint? Let Loc8r help you find the place you’re looking for.',
    locations: responseBody,
    message
  });
};

/* ============================
   3. 장소 상세 페이지 렌더링
============================ */
const renderDetailPage = (req, res, location) => {
  res.render('location-info', {
    title: location.name,
    pageHeader: { title: location.name },
    sidebar: {
      context:
        'is on Loc8r because it has accessible wifi and space to sit down with your laptop and get some work done.',
      callToAction:
        "If you've been and you like it - or if you don't - please leave a review to help other people just like you."
    },
    location,
    apiKey: process.env.GOOGLE_API_KEY
  });
};

/* ============================
   4. API로 장소 상세 정보 요청
============================ */
const getLocationInfo = (req, res, callback) => {
  const path = `/api/locations/${req.params.locationid}`;
  const requestOptions = {
    url: `${apiOptions.server}${path}`,
    method: 'GET',
    json: {}
  };

  request(requestOptions, (err, response, body) => {
    if (err) {
      console.error('❌ 상세 API 요청 오류:', err);
      return showError(req, res, 500);
    }

    const statusCode = response && response.statusCode ? response.statusCode : 0;
    let data = body;

    if (statusCode === 200 && data) {
      if (data.coords && data.coords.type === 'Point') {
        data.coords = {
          lng: data.coords.coordinates[0],
          lat: data.coords.coordinates[1]
        };
      } else if (Array.isArray(data.coords)) {
        data.coords = {
          lng: data.coords[0],
          lat: data.coords[1]
        };
      }

      callback(req, res, data);
    } else {
      showError(req, res, statusCode);
    }
  });
};

/* ============================
   5. 컨트롤러 라우트
============================ */
const locationInfo = (req, res) => {
  getLocationInfo(req, res, (req, res, responseData) =>
    renderDetailPage(req, res, responseData)
  );
};

const addReview = (req, res) => {
  getLocationInfo(req, res, (req, res, responseData) =>
    renderReviewForm(req, res, responseData)
  );
};

/* ============================
   6. 에러 처리
============================ */
const showError = (req, res, status) => {
  let title = '';
  let content = '';

  if (status === 404) {
    title = '404, page not found';
    content = 'Oh dear. Looks like you can’t find this page. Sorry.';
  } else {
    title = `${status}, something’s gone wrong`;
    content = 'Something went wrong while processing your request.';
  }

  res.status(status);
  res.render('generic-text', { title, content });
};

/* ============================
   7. 리뷰 작성 / 등록
============================ */
const renderReviewForm = (req, res, location) => {
  res.render('location-review-form', {
    title: `Review ${location.name} on Loc8r`,
    pageHeader: { title: `Review ${location.name}` },
    location, // ✅ location 전체 전달
    error: req.query.err
  });
};

const doAddReview = (req, res) => {
  const locationid = req.params.locationid;
  const path = `/api/locations/${locationid}/reviews`;
  const postdata = {
    author: req.body.name,
    rating: parseInt(req.body.rating, 10),
    reviewText: req.body.reviewText
  };

  if (!postdata.author || !postdata.rating || !postdata.reviewText) {
    return res.redirect(`/location/${locationid}/review/new?err=val`);
  }

  const requestOptions = {
    url: `${apiOptions.server}${path}`,
    method: 'POST',
    json: postdata
  };

  request(requestOptions, (err, { statusCode }, body) => {
    if (statusCode === 201) {
      res.redirect(`/location/${locationid}`);
    } else if (statusCode === 400 && body && body.name === 'ValidationError') {
      res.redirect(`/location/${locationid}/review/new?err=val`);
    } else {
      showError(req, res, statusCode);
    }
  });
};

/* ============================
   8. 모듈 내보내기
============================ */
module.exports = {
  homelist,
  locationInfo,
  addReview,
  doAddReview
};
