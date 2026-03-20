const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/userController');
const { protect, adminOnly } = require('../middlewares/auth');

router.get('/',               protect, ctrl.getUsers);
router.get('/all',            protect, adminOnly, ctrl.getAllUsers);
router.get('/dashboard',      protect, adminOnly, ctrl.getDashboardStats);
router.get('/call-logs',      protect, adminOnly, ctrl.getCallLogs);
router.get('/reports',        protect, adminOnly, ctrl.getReports);
router.put('/reports/:id',    protect, adminOnly, ctrl.updateReport);
router.post('/report',        protect, ctrl.submitReport);
router.get('/:id',            protect, ctrl.getUserById);
router.delete('/:id',         protect, adminOnly, ctrl.deleteUser);
router.put('/:id/block',      protect, adminOnly, ctrl.blockUser);
module.exports = router;
