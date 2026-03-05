const express = require('express');
const router  = express.Router();
const { createTicket, listTickets } = require('../controllers/ticketController');
const authenticate = require('../middleware/auth');

router.use(authenticate);

router.post('/',  createTicket);
router.get('/',   listTickets);

module.exports = router;
