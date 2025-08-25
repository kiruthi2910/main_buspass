const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

// Simulated payment push endpoint
app.post('/api/payment/push', (req, res) => {
  // You can log or process payment data here
  console.log('Payment push received:', req.body);
  res.json({ status: 'received', transactionId: 'demo123' });
});

// Health check endpoint
app.get('/', (req, res) => {
  res.send('TCE Bus Payment Backend is running');
});

// Payment gateway return URL endpoint
app.get('/api/payment/return', (req, res) => {
  // You can process query params from the gateway here
  // For now, just simulate a response
  res.send('Payment gateway return received. Thank you for your payment.');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
