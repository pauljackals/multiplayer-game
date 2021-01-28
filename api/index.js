const express = require('express');
const cors = require('cors');
const app = express();
// const users = require('./routes/users');

app.use(cors())
app.use(express.json());

// app.use('/users', users);

require('dotenv').config();

const port = process.env.PORT
app.listen(port, () => {
    console.log(`API server listening at http://localhost:${port}`);
});