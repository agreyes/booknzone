var express = require('express')
  , router = express.Router()

router.use('/classes', require('./classes'));
module.exports = router;