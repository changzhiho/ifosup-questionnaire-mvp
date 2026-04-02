<template>
  <div class="min-h-screen bg-gray-50">

    <header class="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
      <button @click="$router.push('/dashboard')" class="text-sm text-gray-500 hover:text-gray-700">
        ← Retour
      </button>
      <h1 class="text-lg font-bold text-gray-800">Gestion de session</h1>
      <button
        @click="$router.push(`/session/${sessionId}/results`)"
        class="text-sm text-blue-600 hover:underline"
      >
        Voir les résultats →
      </button>
    </header>

    <main class="max-w-2xl mx-auto px-4 py-8">

      <div v-if="loading" class="text-center py-12 text-gray-400">Chargement...</div>

      <div v-else-if="session">

        <!-- Titre + statut -->
        <div class="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div class="flex items-center justify-between mb-2">
            <h2 class="text-xl font-semibold text-gray-800">{{ session.title }}</h2>
            <span :class="[
              'text-xs font-semibold px-3 py-1 rounded-full',
              session.status === 'open'   ? 'bg-green-100 text-green-700' :
              session.status === 'closed' ? 'bg-red-100 text-red-500' :
                                            'bg-yellow-100 text-yellow-700'
            ]">
              {{ session.status }}
            </span>
          </div>
          <p class="text-sm text-gray-400">Formulaire : {{ session.form_title }}</p>
        </div>

        <!-- Code court -->
        <div class="bg-white rounded-xl border border-gray-200 p-6 mb-6 text-center">
          <p class="text-sm text-gray-500 mb-2">Code de participation</p>
          <p class="text-5xl font-mono font-bold tracking-widest text-gray-800">
            {{ session.join_code }}
          </p>
          <p class="text-xs text-gray-400 mt-2">
            Les étudiants saisissent ce code sur <span class="font-medium">{{ frontendUrl }}/respond</span>
          </p>
        </div>

        <!-- QR Code -->
        <div class="bg-white rounded-xl border border-gray-200 p-6 mb-6 flex flex-col items-center">
          <p class="text-sm text-gray-500 mb-4">QR Code — scanner pour accéder directement</p>
          <img
            v-if="qrCode"
            :src="qrCode"
            alt="QR Code session"
            class="w-48 h-48"
          />
          <p v-else class="text-gray-400 text-sm">Chargement du QR code...</p>
          <p class="text-xs text-gray-400 mt-3 break-all">{{ joinUrl }}</p>
        </div>

        <!-- Actions -->
        <div class="flex gap-3">
          <button
            v-if="session.status === 'draft'"
            @click="updateStatus('open')"
            :disabled="updating"
            class="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-3 rounded-lg transition"
          >
            {{ updating ? 'Mise à jour...' : '▶ Ouvrir la session' }}
          </button>

          <button
            v-if="session.status === 'open'"
            @click="updateStatus('closed')"
            :disabled="updating"
            class="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-medium px-4 py-3 rounded-lg transition"
          >
            {{ updating ? 'Mise à jour...' : '■ Fermer la session' }}
          </button>

          <button
            v-if="session.status === 'closed'"
            @click="updateStatus('open')"
            :disabled="updating"
            class="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-3 rounded-lg transition"
          >
            {{ updating ? 'Mise à jour...' : '▶ Rouvrir la session' }}
          </button>

          <button
            @click="$router.push(`/form-builder/${session.form_template_id}`)"
            class="flex-1 bg-white border border-gray-300 hover:border-blue-400 text-gray-600 hover:text-blue-600 text-sm font-medium px-4 py-3 rounded-lg transition"
          >
            ✏️ Éditer le formulaire
          </button>
        </div>

        <p v-if="errorMsg" class="text-sm text-red-500 text-center mt-4">{{ errorMsg }}</p>

      </div>

      <div v-else class="text-center py-12 text-gray-400">
        Session introuvable.
      </div>

    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/api/axios'

const route = useRoute()
const sessionId = route.params.id

const session = ref(null)
const qrCode = ref(null)
const joinUrl = ref('')
const loading = ref(true)
const updating = ref(false)
const errorMsg = ref('')

const frontendUrl = import.meta.env.VITE_FRONTEND_URL || 'http://localhost:5173'

onMounted(async () => {
  try {
    // Charger les infos de la session
    const response = await api.get('/sessions')
    session.value = response.data.find(s => s.id === parseInt(sessionId))

    if (session.value) {
      // Charger le QR code
      const qrResponse = await api.get(`/sessions/${sessionId}/qrcode`)
      qrCode.value = qrResponse.data.qr_base64
      joinUrl.value = qrResponse.data.url
    }
  } catch (err) {
    console.error('Erreur chargement session', err)
    errorMsg.value = 'Impossible de charger la session.'
  } finally {
    loading.value = false
  }
})

async function updateStatus(status) {
  updating.value = true
  errorMsg.value = ''
  try {
    await api.patch(`/sessions/${sessionId}/status`, { status })
    session.value.status = status
  } catch (err) {
    console.error('Erreur mise à jour statut', err)
    errorMsg.value = 'Erreur lors de la mise à jour du statut.'
  } finally {
    updating.value = false
  }
}
</script>
