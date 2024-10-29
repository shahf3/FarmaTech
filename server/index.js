const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/test', (req, res) => {
    res.json({ message: 'Backend is connected!' });
});

app.post('/api/data', (req, res) => {
    const { data } = req.body;
    res.json({ received: data });
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});