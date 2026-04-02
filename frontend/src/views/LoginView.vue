<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center px-4">
    <div class="w-full max-w-sm bg-white rounded-xl shadow-md p-8">

      <!-- Logo / Titre -->
      <div class="text-center mb-8">
        <h1 class="text-2xl font-bold text-gray-800">IFOSUP</h1>
        <p class="text-sm text-gray-500 mt-1">Connexion professeur / admin</p>
      </div>

      <!-- Formulaire -->
      <form @submit.prevent="handleLogin" novalidate>

        <div class="mb-4">
          <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            autocomplete="email"
            required
            placeholder="prenom.nom@ifosup.be"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div class="mb-6">
          <label for="password" class="block text-sm font-medium text-gray-700 mb-1">
            Mot de passe
          </label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            autocomplete="current-password"
            required
            placeholder="••••••••"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <!-- Message d'erreur -->
        <p v-if="errorMsg" class="text-sm text-red-600 mb-4 text-center">
          {{ errorMsg }}
        </p>

        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2 rounded-lg transition text-sm"
        >
          {{ loading ? 'Connexion...' : 'Se connecter' }}
        </button>

      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import api from '@/api/axios'

const router = useRouter()
const auth = useAuthStore()

const form = ref({ email: '', password: '' })
const errorMsg = ref('')
const loading = ref(false)

// Redirect if already logged in
if (auth.isAuthenticated) {
  router.replace('/dashboard')
}

async function handleLogin() {
  errorMsg.value = ''
  loading.value = true
  try {
    const { data } = await api.post('/auth/login', form.value)
    auth.setAuth(data.token, data.user)
    router.push('/dashboard')
  } catch (err) {
    errorMsg.value = err.response?.data?.message || 'Email ou mot de passe incorrect.'
  } finally {
    loading.value = false
  }
}
</script>
