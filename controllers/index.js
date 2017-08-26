var express = require('express')
  , router = express.Router()

router.use('/events', require('./events'));

router.use('/api', require('./api'));
module.exports = router;