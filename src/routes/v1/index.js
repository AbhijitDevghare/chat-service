const express = require('express');
const router = express.Router();

const chatRoutes = require('./chatRoutes');

// Base paths
router.use('/', chatRoutes);

module.exports = router;
    