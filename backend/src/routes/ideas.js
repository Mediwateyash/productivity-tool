const express = require('express');
const router = express.Router();
const ideaController = require('../controllers/ideaController');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/', ideaController.getIdeas);
router.post('/', ideaController.createIdea);
router.put('/:id', ideaController.updateIdea);
router.delete('/:id', ideaController.deleteIdea);

module.exports = router;
