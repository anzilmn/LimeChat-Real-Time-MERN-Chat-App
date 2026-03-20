const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/groupController');
const { protect } = require('../middlewares/auth');
const upload  = require('../middlewares/upload');

router.post('/',               protect, upload.single('avatar'), ctrl.createGroup);
router.get('/',                protect, ctrl.getGroups);
router.get('/:groupId/messages', protect, ctrl.getGroupMessages);
router.post('/message',        protect, upload.single('file'), ctrl.sendGroupMessage);
router.put('/:id/members',     protect, ctrl.addMembers);
router.delete('/:id/leave',    protect, ctrl.leaveGroup);
module.exports = router;
