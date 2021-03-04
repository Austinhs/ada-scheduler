<template>
  <v-app id="app">
    <v-app-bar app>
      <v-toolbar-title>ADA Scheduler</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-toolbar-title>Server Status: <span :class="{ 'serverOnline': isOnline(), 'serverOffline': !isOnline() }">{{status}}</span></v-toolbar-title>
      <v-spacer></v-spacer>
      <v-toolbar-title>
        <div class="current-epoch">Current Epoch Section: {{blocks.current_epoch}}</div>
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <v-toolbar-title>Time Until Next Block: {{timeUntil}}</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-toolbar-title>Now: {{utc}}</v-toolbar-title>
    </v-app-bar>

    <v-content>
      <v-container fluid>
        <div class="block-container">
          <div class="block-col" v-for="epoch in 3" :key="epoch">
            <v-card-title class="epoch-section-header">Epoch section {{epoch}} - {{getEpochDate(epoch)}} <v-spacer></v-spacer><div class="epoch-counter">({{countEpoch(epoch)}})</div></v-card-title>
            <v-card v-for="block in getEpoch(epoch)" :key="block.scheduled_at_time" light class="block-card" :disabled="!isPending(block.status)">
              <v-card-title>
                Scheduled Time: {{computedTime(block.scheduled_at_time)}}
                <v-spacer></v-spacer>
                <span :class="{ 'pending': isPending(block.status), 'finalized': !isPending(block.status)}">{{block.status}}</span>
              </v-card-title>
              <v-card-text>
                Raw Data - <ul>
                  <li>"created_at_time": <span class="block-raw-data">"{{block.created_at_time}}"</span></li>
                  <li>"scheduled_at_time": <span class="block-raw-data">"{{block.scheduled_at_time}}"</span></li>
                  <li>"scheduled_at_date": <span class="block-raw-data">"{{block.scheduled_at_date}}"</span></li>
                  <li>"wake_at_time": <span class="block-raw-data">"{{block.wake_at_time}}"</span></li>
                  <li>"finished_at_time": <span class="block-raw-data">"{{block.finished_at_time}}"</span></li>
                  <li>"status": <span class="block-raw-data">"{{block.status}}"</span></li>
                  <li>"enclave_leader_id": <span class="block-raw-data number">{{block.enclave_leader_id}}</span></li>
                </ul>
              </v-card-text>
            </v-card>
          </div>
        </div>

      </v-container>
    </v-content>
  </v-app>
</template>

<script>
const BACKEND_URL = `http://${window.location.hostname}:2000`;

function getUTCTime(date, ret_str = true) {
  var hours = date.getUTCHours();
  var mins  = date.getUTCMinutes();
  var secs  = date.getUTCSeconds();

  if(hours < 10) {
    hours = '0' + hours;
  }

  if(mins < 10) {
    mins = '0' + mins;
  }

  if(secs < 10) {
    secs = '0' + secs;
  }

  if(ret_str) {
    return `${hours}:${mins}:${secs}`;
  } else {
    return {
      hours: hours,
      mins : mins,
      secs : secs
    }
  }
}

function sortBlockData(data) {
  // Sort
  for(let index in data) {
    if(index == 'current_epoch') {
      continue;
    } // Otherwise an epoch index

    data[index].sort(function(a,b) {
      // Force none pending cards to the bottom
      return a.scheduled_at_date - b.scheduled_at_date;
    });
  }

  return data;
}

export default {
  name: 'app',

  props: {
    source: String
  },

  data() {
    return {
      stats: null,
      utc: null,
      status: 'Offline',
      blocks: {
        current_epoch: 'Unknown'
      },
      timeUntil: '00:00:00'
    }
  },

  methods: {
    isOnline() {
      return this.status == 'Online';
    },

    updateBlocks() {
      // Get blocks
      fetch(`${BACKEND_URL}/api/updateBlock`).then(async (res) => {
        let { data } = await res.json();
        data = sortBlockData(data);

        this.blocks = data;
      }).catch(console.warn);
    },

    isPending(status) {
      return status == 'Pending';
    },

    computedTime(block_time) {
      let date = new Date(block_time);
      return getUTCTime(date);
    },

    getEpoch(epoch_index) {
      return this.blocks['epoch_'+epoch_index]
    },

    getEpochDate(epoch_index) {
      let epoch = this.getEpoch(epoch_index);

      if(epoch.length > 0) {
        let date  = new Date(epoch[0].scheduled_at_time);

        return `${date.getUTCMonth()}/${date.getUTCDay()}/${date.getUTCFullYear()}`;
      }
    },

    countEpoch(epoch_index) {
      let epoch = this.getEpoch(epoch_index);
      return epoch.length;
    }
  },

  async created() {
    this.$vuetify.theme.dark = true;

    // Get stats
    fetch(`${BACKEND_URL}/api/stats`).then(async (res) => {
      let { data } = await res.json();
      this.stats = data;
    }).catch(console.warn);

    // Get blocks
    fetch(`${BACKEND_URL}/api/blocks`).then(async (res) => {
      let { data } = await res.json();
      data = sortBlockData(data);

      this.blocks = data;
    }).catch(console.warn);

    // Check Server Status
    setInterval(() => {
      fetch(`${BACKEND_URL}/api/status`).then(async (res) => {
        let { data } = await res.json();
        this.status = data;
      }).catch((err) => {
        console.warn(err);
        this.status = 'Offline';
      });
    }, 500);

    // Update UTC timer clock (top right)
    setInterval(() => {
      var date  = new Date();
      this.utc = getUTCTime(date);
    }, 500);

    // Update UTC timer clock, next block (top right)
    setInterval(() => {
      if(this.blocks.epoch_1 && !Object.keys(this.blocks).length < 2) {
        let target_epoch  = this.blocks['epoch_' + this.blocks.current_epoch];
        let closest_block = target_epoch[0];

        if(!closest_block) {
          return;
        }

        if(closest_block.status != 'Pending') {
          target_epoch.forEach(function(block) {
            if(block.status == 'Pending') {
              closest_block = block;
              return;
            }
          });
        }

        let closest_time_dt = new Date(closest_block.scheduled_at_time)
        let closest_time    = getUTCTime(closest_time_dt, false);

        let closest_now_dt  = new Date();
        let closest_now     = getUTCTime(closest_now_dt, false);

        if(closest_now_dt > closest_time_dt) {
          this.timeUntil = '00:00:00';
          this.updateBlocks();
          return;
        }

        if(closest_time_dt.getUTCDay() > closest_now_dt.getUTCDay()) {
          closest_time.hours += 24;
        }

        let hours = Math.abs(closest_time.hours - closest_now.hours);
        if(hours < 10) {
          hours = '0' + hours;
        }

        let mins  = Math.abs(closest_time.mins - closest_now.mins);
        if(mins < 10) {
          mins = '0' + mins;
        }

        let secs  = Math.abs(closest_time.secs - closest_now.secs);
        if(secs < 10) {
          secs = '0' + secs;
        }

        this.timeUntil = `${hours}:${mins}:${secs}`;
      }
    }, 500);
  }
}
</script>

<style scoped>
.epoch-section-header {
  background-color: slategray;
  border: 1px solid black;
  margin-left: 5px;
  margin-top: 5px;
  margin-right: 5px;
}

.epoch-counter {
  background-color: dodgerblue;
  border: 1px solid darkslategray;
  border-radius: 5%;
  padding: 10px;
  min-width: 60px;
  text-align: center
}

.pending {
  color: dodgerblue;
  float: right;
  margin-left: 2em;
}

.finalized {
  color: green;
}

.serverOnline {
  color: green;
  font-weight: bolder;
}

.serverOffline {
  color: crimson;
  font-weight: bolder;
}

.block-container {
  display: flex;
}

.block-raw-data {
  color: green;
}

.block-raw-data.number {
  color: blue;
}

.block-col {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  background-color: gray;
  box-shadow: 4px 1px 10px black;
  margin: 10px;
}

.block-card {
  margin: 10px;
}
</style>
