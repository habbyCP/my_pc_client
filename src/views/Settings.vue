<template>
  <div class="settings-view">
    <SettingsComponent />
  </div>
</template>

<script>
import SettingsComponent from '../components/Settings.vue'

export default {
  name: 'Settings',
  components: {
    SettingsComponent
  }
}
</script>

<style scoped>
.settings-view {
  height: 100%;
  width: 100%;
}
</style>