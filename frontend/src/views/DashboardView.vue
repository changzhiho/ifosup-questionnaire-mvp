<template>
  <div class="min-h-screen bg-gray-50">

    <!-- Header -->
    <header class="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
      <h1 class="text-lg font-bold text-gray-800">IFOSUP — Tableau de bord</h1>
      <div class="flex items-center gap-4">
        <span class="text-sm text-gray-500">{{ auth.user?.email }}</span>
        <button
          @click="handleLogout"
          class="text-sm text-red-500 hover:text-red-700 transition"
        >
          Déconnexion
        </button>
      </div>
    </header>

    <!-- Contenu -->
    <main class="max-w-4xl mx-auto px-4 py-8">

      <!-- Actions -->
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-semibold text-gray-700">Mes sessions</h2>
        <button
          @click="createSession"
          :disabled="creating"
          class="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
        >
          {{ creating ? 'Création...' : '+ Nouvelle session' }}
        </button>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="text-center py-12 text-gray-400">
        Chargement...
      </div>

      <!-- Empty state -->
      <div
        v-else-if="sessions.length === 0"
        class="text-center py-12 text-gray-400"
      >
        <p class="text-lg">Aucune session pour le moment.</p>
        <p class="text-sm mt-1">Crée ta première session pour commencer.</p>
      </div>

      <!-- Liste des sessions -->
      <div v-else class="space-y-3">
        <div
          v-for="session in sessions"
          :key="session.id"
          class="bg-white rounded-xl shadow-sm border border-gray-100 px-5 py-4 flex items-center justify-between"
        >
          <div>
            <p class="font-medium text-gray-800">{{ session.title || 'Session sans titre' }}</p>
            <p class="text-xs text-gray-400 mt-0.5">
              Code : <span class="font-mono">{{ session.join_code }}</span>
              · Statut :
              <span
                :class="{
                  'text-green-600': session.status === 'open',
                  'text-yellow-600': session.status === 'draft',
                  'text-red-500': session.status === 'closed',
                }"
              >
                {{ session.status }}
              </span>
            </p>
          </div>
          <button
            @click="goToSession(session.id)"
            class="text-sm text-blue-600 hover:underline"
          >
            Gérer →
          </button>
        </div>
      </div>

    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import api from '@/api/axios'

const router = useRouter()
const auth = useAuthStore()

const sessions = ref([])
const loading = ref(true)
const creating = ref(false)

onMounted(async () => {
  try {
    const { data } = await api.get('/api/sessions')
    sessions.value = data
  } catch (err) {
    console.error('Erreur chargement sessions', err)
  } finally {
    loading.value = false
  }
})

async function createSession() {
  creating.value = true
  try {
    const { data } = await api.post('/api/sessions', {
      title: 'Nouvelle session',
    })
    router.push(`/session/${data.id}`)
  } catch (err) {
    console.error('Erreur création session', err)
  } finally {
    creating.value = false
  }
}

function goToSession(id) {
  router.push(`/session/${id}`)
}

function handleLogout() {
  auth.logout()
  router.push('/login')
}
</script>
