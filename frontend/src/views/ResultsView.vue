<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <button
        @click="$router.push(`/session/${sessionId}`)"
        class="text-sm text-gray-600 hover:text-gray-900"
      >
        ← Retour session
      </button>

      <h1 class="text-lg font-bold text-gray-800">Résultats</h1>

      <button
        @click="loadResults"
        :disabled="loading"
        class="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg"
      >
        {{ loading ? 'Actualisation...' : 'Actualiser' }}
      </button>
    </header>

    <main class="max-w-4xl mx-auto px-4 py-8">
      <div v-if="loading && !session" class="text-center text-gray-400 py-12">
        Chargement des résultats...
      </div>

      <div v-else-if="errorMsg" class="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 mb-6">
        {{ errorMsg }}
      </div>

      <div v-else-if="session">
        <div class="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div class="flex items-center justify-between gap-4">
            <div>
              <h2 class="text-xl font-semibold text-gray-800">{{ session.title }}</h2>
              <p class="text-sm text-gray-500 mt-1">Formulaire : {{ session.form_title }}</p>
            </div>
            <span
              :class="[
                'text-xs font-semibold px-3 py-1 rounded-full',
                session.status === 'open'
                  ? 'bg-green-100 text-green-700'
                  : session.status === 'closed'
                  ? 'bg-red-100 text-red-600'
                  : 'bg-yellow-100 text-yellow-700'
              ]"
            >
              {{ session.status }}
            </span>
          </div>
        </div>

        <div class="space-y-6">
          <section
            v-for="(question, index) in results"
            :key="question.id"
            class="bg-white rounded-xl border border-gray-200 p-6"
          >
            <div class="mb-4">
              <p class="text-xs uppercase tracking-wide text-gray-400 font-semibold">
                Question {{ index + 1 }}
              </p>
              <h3 class="text-lg font-semibold text-gray-800 mt-1">
                {{ question.question_text }}
              </h3>
              <p class="text-sm text-gray-500 mt-1">
                Type : {{ question.question_type }} · Réponses : {{ question.total_responses }}
              </p>
            </div>

            <!-- QCM + scale -->
            <div v-if="question.question_type === 'multiple_choice' || question.question_type === 'scale'" class="space-y-3">
              <div
                v-for="choice in question.choices"
                :key="choice.label"
                class="border border-gray-100 rounded-lg p-3"
              >
                <div class="flex items-center justify-between text-sm mb-2">
                  <span class="font-medium text-gray-700">{{ choice.label }}</span>
                  <span class="text-gray-500">{{ choice.count }} ({{ choice.percentage }}%)</span>
                </div>
                <div class="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    class="h-full bg-blue-600 rounded-full transition-all"
                    :style="{ width: `${choice.percentage}%` }"
                  />
                </div>
              </div>
            </div>

            <!-- Texte libre -->
            <div v-else>
              <div v-if="question.text_answers && question.text_answers.length" class="space-y-3">
                <div
                  v-for="(answer, answerIndex) in question.text_answers"
                  :key="answerIndex"
                  class="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-700"
                >
                  {{ answer }}
                </div>
              </div>
              <p v-else class="text-sm text-gray-400">Aucune réponse texte pour le moment.</p>
            </div>
          </section>
        </div>
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

const loading = ref(false)
const errorMsg = ref('')
const session = ref(null)
const results = ref([])

async function loadResults() {
  loading.value = true
  errorMsg.value = ''

  try {
    const response = await api.get(`/sessions/${sessionId}/results`)
    session.value = response.data.session
    results.value = response.data.results
  } catch (err) {
    console.error('Erreur chargement résultats', err)
    errorMsg.value = 'Impossible de charger les résultats.'
  } finally {
    loading.value = false
  }
}

onMounted(loadResults)
</script>
