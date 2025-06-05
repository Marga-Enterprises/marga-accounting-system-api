const express = require('express');
const router = express.Router();
const departmentController = require('@controllers/department');

router.post('/', departmentController.create);
router.get('/', departmentController.list);
router.get('/:departmentId', departmentController.getById);
router.put('/:departmentId', departmentController.update);
router.delete('/:departmentId', departmentController.delete);

module.exports = router;