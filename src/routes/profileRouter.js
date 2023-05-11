const express = require('express');

const profileController = require(`${__dirname}/../controllers/profileController`);

const router = express.Router();

router.route('/')
    .get(profileController.createHTML);

router.route('/change-password/:username')
    .post(profileController.changePassword);


module.exports = router;