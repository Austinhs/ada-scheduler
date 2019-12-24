const express = require('express');
const app     = express();
const request = require('request');
const port    = 2000;

var blocks  = {
    epoch_1: [],
    epoch_2: [],
    epoch_3: [],
    current_epoch: 1
};

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

app.get('/api/blocks', (req, res) => {
    res.send({
        data: blocks
    })
});

app.get('/api/updateBlock', (req, res) => {
    updateEpochInfo();
    res.send({
        data: blocks
    })
});

app.get('/api/status', (req, res) => {
    res.send({
        data: 'Online'
    });
});

app.listen(port, () => console.log(`Running port: ${port}`));

updateEpochInfo();
setInterval(updateEpochInfo, 60000 * 60 ); //Check info every hour

function updateEpochInfo() {
    let target_epoch = 'epoch_' + blocks.current_epoch;

    if(blocks[target_epoch] != [] && blocks[target_epoch].length > 0) {
        let last_epoch_date = new Date(blocks[target_epoch][0].scheduled_at_time);
        let date_obj        = new Date();
        let now_day         = date_obj.getUTCDay();
        let last_epoch_day  = last_epoch_date.getUTCDay();

        // New Epoch
        if(now_day != last_epoch_day) {
            if(blocks.current_epoch == 3) {
                blocks.current_epoch = 1;
            } else {
                blocks.current_epoch++
            }

            target_epoch = 'epoch_' + blocks.current_epoch;
            existing_schedules[target_epoch] = [];
        }
    }

    request('http://adaboi.stanfield.it:8300/api/v0/leaders/logs', function(err, res, body) {
        if(!err && res.statusCode == 200) {
            JSON.parse(body).forEach(function(block) {
                let found_similar_block = false;

                if(block.status != 'Pending') {
                    block.status = 'Done';
                }

                for(index in blocks[target_epoch]) {
                    let existing_block = blocks[target_epoch][index];

                    if(existing_block.scheduled_at_time == block.scheduled_at_time) {
                        found_similar_block = true;
                        blocks[target_epoch][index] = block;
                    }
                }

                if(!found_similar_block) {
                    blocks[target_epoch].push(block);
                }
            });
        }
    });
}