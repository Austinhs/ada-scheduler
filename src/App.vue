<template>
  <div id="app">
    <div>Yo we got this: {{stats}}</div>
    <div>Yo the UTC is: {{utc}}</div>
  </div>
</template>

<script>
const BACKEND_URL = window.location.hostname;

export default {
  name: 'app',
  data() {
    return {
      stats: null,
      utc: null
    }
  },

  async created() {
    const res = await fetch(`http://${BACKEND_URL}:2000/api/stats`);
    const { data } = await res.json();

    this.stats = data;

    setInterval(() => {
      var date  = new Date();
      var hours = date.getUTCHours();
      var mins  = date.getUTCMinutes();
      var secs  = date.getUTCSeconds();

      this.utc = `${hours}:${mins}:${secs}`;
    }, 500);
  }
}
</script>