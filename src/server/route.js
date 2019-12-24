const express = require('express');
const app = express();
const port = 2000;

app.get('/api/stats', (req, res) => {
    // get the stat;
    res.send('Testing');
});

app.listen(port, () => console.log(`Running port: ${port}`));