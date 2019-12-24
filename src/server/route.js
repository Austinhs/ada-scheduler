const express = require('express');
const app = express();
const port = 2000;

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.get('/api/stats', (req, res) => {
    // get the stat;
    res.send({
        data: 'testing'
    });
});

app.listen(port, () => console.log(`Running port: ${port}`));