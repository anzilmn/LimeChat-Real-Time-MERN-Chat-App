const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/callController');
const { protect } = require('../middlewares/auth');

router.post('/',        protect, ctrl.createCallLog);
router.put('/:id',      protect, ctrl.updateCallLog);
router.get('/my',       protect, ctrl.getMyCallLogs);
module.exports = router;
