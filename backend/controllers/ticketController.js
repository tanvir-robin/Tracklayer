const Ticket = require('../models/Ticket');

// POST /api/tickets — submit a new ticket
async function createTicket(req, res) {
  try {
    const { subject, message } = req.body;
    if (!subject?.trim() || !message?.trim()) {
      return res.status(400).json({ message: 'Subject and message are required' });
    }
    const ticket = await Ticket.create({
      user:    req.user.id,
      email:   req.user.email,
      subject: subject.trim(),
      message: message.trim(),
    });
    res.status(201).json(ticket);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// GET /api/tickets — list the current user's tickets (newest first)
async function listTickets(req, res) {
  try {
    const tickets = await Ticket.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .lean();
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = { createTicket, listTickets };
