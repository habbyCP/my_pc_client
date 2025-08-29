<template>
  <div class="downloads-view">
    <client-list :clients="clients"></client-list>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useAppStore } from '../store.js'
import ClientList from '../components/ClientList.vue'

export default {
  name: 'Downloads',
  components: {
    ClientList
  },
  setup() {
    const store = useAppStore()
    const clients = ref([])

    onMounted(async () => {
      clients.value = await store.get_clients_list()
    })

    return {
      clients
    }
  }
}
</script>

<style scoped>
.downloads-view {
  height: 100%;
  width: 100%;
}
</style>