<template>
  <div id="app">
    <div>Yo we got this: {{stats}}</div>
  </div>
</template>

<script>
const BACKEND_URL = window.location.hostname;
export default {
  name: 'app',
  data() {
    return {
      stats: null
    }
  },

  methods: {
    async getStats() {
      const res = await fetch(`${BACKEND_URL}:2000/api/stats`);

      this.stats = await res.json();
    }
  }
}
</script>