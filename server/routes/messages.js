const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/messageController');
const { protect } = require('../middlewares/auth');
const upload  = require('../middlewares/upload');

router.get('/:chatId',           protect, ctrl.getMessages);
router.post('/',                 protect, upload.single('file'), ctrl.sendMessage);
router.put('/:id',               protect, ctrl.editMessage);
router.delete('/:id',            protect, ctrl.deleteMessage);
router.delete('/clear/:chatId',  protect, ctrl.clearChat);
router.post('/:id/reaction',     protect, ctrl.addReaction);
module.exports = router;
