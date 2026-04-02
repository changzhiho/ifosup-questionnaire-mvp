<template>
  <div class="min-h-screen bg-gray-50 flex flex-col">
    <div v-if="loading" class="flex-1 flex items-center justify-center px-6 text-center text-gray-500">
      Chargement du questionnaire...
    </div>

    <div v-else-if="errorMsg" class="flex-1 flex items-center justify-center px-4">
      <div class="w-full max-w-md bg-white border border-red-200 rounded-2xl p-6 text-center shadow-sm">
        <p class="text-red-600 font-medium mb-2">Impossible d’accéder au questionnaire</p>
        <p class="text-sm text-gray-500">{{ errorMsg }}</p>
      </div>
    </div>

    <div v-else-if="submitted" class="flex-1 flex items-center justify-center px-4">
      <div class="w-full max-w-md bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-200">
        <div class="text-5xl mb-4">✅</div>
        <h1 class="text-2xl font-bold text-gray-800 mb-3">Merci pour votre réponse</h1>
        <p class="text-sm text-gray-500">
          Votre formulaire a bien été envoyé de manière anonyme.
        </p>
      </div>
    </div>

    <div v-else class="flex-1 flex flex-col">
      <header class="px-4 pt-6 pb-4">
        <div class="max-w-md mx-auto">
          <p class="text-xs uppercase tracking-wide text-gray-400 font-semibold mb-2">
            IFOSUP
          </p>
          <h1 class="text-xl font-bold text-gray-800 leading-tight">
            {{ session?.form_title || 'Questionnaire' }}
          </h1>
          <p class="text-sm text-gray-500 mt-1">
            Session : {{ session?.title }}
          </p>

          <div class="mt-4">
            <div class="flex items-center justify-between text-xs text-gray-400 mb-2">
              <span>Question {{ currentIndex + 1 }} / {{ questions.length }}</span>
              <span>{{ progress }}%</span>
            </div>
            <div class="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div class="h-full bg-blue-600 rounded-full transition-all duration-300" :style="{ width: `${progress}%` }"></div>
            </div>
          </div>
        </div>
      </header>

      <main class="flex-1 px-4 pb-6 flex items-center">
        <div class="w-full max-w-md mx-auto bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
          <p class="text-xs uppercase tracking-wide text-gray-400 font-semibold mb-2">
            Question {{ currentIndex + 1 }}
          </p>

          <h2 class="text-xl font-semibold text-gray-800 leading-snug mb-6">
            {{ currentQuestion.label }}
          </h2>

          <!-- Multiple choice (checkbox) -->
          <div v-if="currentQuestion.type === 'multiple_choice'" class="space-y-3">
            <button
              v-for="option in currentQuestion.options"
              :key="option.id"
              type="button"
              @click="setAnswer(currentQuestion.id, option.id)"
              :class="[
                'w-full text-left rounded-xl border px-4 py-4 text-base transition',
                Number(answers[currentQuestion.id]) === option.id
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-700'
              ]"
            >
              {{ option.label }}
            </button>
          </div>

          <!-- Scale -->
          <div v-else-if="currentQuestion.type === 'scale'" class="grid grid-cols-5 gap-2">
            <button
              v-for="value in [1, 2, 3, 4, 5]"
              :key="value"
              type="button"
              @click="setAnswer(currentQuestion.id, value)"
              :class="[
                'rounded-xl border py-4 text-base font-semibold transition',
                Number(answers[currentQuestion.id]) === value
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-700'
              ]"
            >
              {{ value }}
            </button>
          </div>

          <!-- Text -->
          <div v-else>
            <textarea
              v-model="answers[currentQuestion.id]"
              rows="6"
              class="w-full rounded-xl border border-gray-200 px-4 py-3 text-base focus:border-blue-500 focus:ring-0 resize-none"
              placeholder="Votre réponse..."
            />
          </div>

          <p v-if="stepError" class="text-sm text-red-500 mt-4">
            {{ stepError }}
          </p>
        </div>
      </main>

      <footer class="px-4 pb-6">
        <div class="max-w-md mx-auto flex gap-3">
          <button
            type="button"
            @click="previousQuestion"
            :disabled="currentIndex === 0 || sending"
            class="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-4 text-base font-medium text-gray-700 disabled:opacity-50"
          >
            Précédent
          </button>

          <button
            v-if="currentIndex < questions.length - 1"
            type="button"
            @click="nextQuestion"
            :disabled="sending"
            class="flex-1 rounded-xl bg-blue-600 px-4 py-4 text-base font-medium text-white disabled:opacity-50"
          >
            Suivant
          </button>

          <button
            v-else
            type="button"
            @click="submitAnswers"
            :disabled="sending || alreadySubmitted"
            class="flex-1 rounded-xl bg-green-600 px-4 py-4 text-base font-medium text-white disabled:opacity-50"
          >
            {{ sending ? 'Envoi...' : alreadySubmitted ? 'Déjà envoyé' : 'Envoyer' }}
          </button>
        </div>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/api/axios'

const route = useRoute()
const joinCode = route.params.joinCode

const loading = ref(true)
const sending = ref(false)
const submitted = ref(false)
const errorMsg = ref('')
const stepError = ref('')
const session = ref(null)
const questions = ref([])
const currentIndex = ref(0)
const answers = ref({})

const storageKey = `ifosup_submitted_${joinCode}`
const alreadySubmitted = ref(false)

const currentQuestion = computed(() => questions.value[currentIndex.value] || null)
const progress = computed(() => {
  if (!questions.value.length) return 0
  return Math.round(((currentIndex.value + 1) / questions.value.length) * 100)
})

function setAnswer(questionId, value) {
  answers.value[questionId] = value
  stepError.value = ''
}

function validateCurrentQuestion() {
  const q = currentQuestion.value
  if (!q) return false

  const value = answers.value[q.id]

  if (q.type === 'text') {
    if (!value || !String(value).trim()) {
      stepError.value = 'Veuillez écrire une réponse avant de continuer.'
      return false
    }
  } else {
    if (value === undefined || value === null || value === '') {
      stepError.value = 'Veuillez sélectionner une réponse avant de continuer.'
      return false
    }
  }

  stepError.value = ''
  return true
}


function nextQuestion() {
  if (!validateCurrentQuestion()) return
  if (currentIndex.value < questions.value.length - 1) {
    currentIndex.value++
  }
}

function previousQuestion() {
  if (currentIndex.value > 0) {
    currentIndex.value--
    stepError.value = ''
  }
}

async function loadQuestionnaire() {
  loading.value = true
  errorMsg.value = ''

  try {
    const response = await api.get(`/join/${joinCode}`)
    session.value = response.data.session
    questions.value = response.data.questions

    for (const question of questions.value) {
      answers.value[question.id] = ''
    }

    alreadySubmitted.value = localStorage.getItem(storageKey) === 'true'
  } catch (err) {
    console.error('Erreur chargement questionnaire', err)
    errorMsg.value = err.response?.data?.error || 'Questionnaire indisponible.'
  } finally {
    loading.value = false
  }
}

function buildAnswerPayload(question) {
  const value = answers.value[question.id]

  if (question.type === 'multiple_choice') {
    return {
      question_id: question.id,
      value_text: null,
      value_number: null,
      value_option_id: value ? Number(value) : null,
    }
  }

  if (question.type === 'scale') {
    return {
      question_id: question.id,
      value_text: null,
      value_number: Number(value),
      value_option_id: null,
    }
  }

  return {
    question_id: question.id,
    value_text: String(value || '').trim(),
    value_number: null,
    value_option_id: null,
  }
}


async function submitAnswers() {
  if (!validateCurrentQuestion()) return
  if (alreadySubmitted.value) return

  sending.value = true
  errorMsg.value = ''
  stepError.value = ''

  try {
    const payload = questions.value.map(buildAnswerPayload)

    await api.post(`/join/${joinCode}/submit`, {
      submit_token: localStorage.getItem(storageKey) || null,
      answers: payload,
    })

    localStorage.setItem(storageKey, 'true')
    alreadySubmitted.value = true
    submitted.value = true
  } catch (err) {
    console.error('Erreur envoi questionnaire', err)
    stepError.value = err.response?.data?.error || 'Erreur lors de l’envoi.'
  } finally {
    sending.value = false
  }
}

onMounted(loadQuestionnaire)
</script>
