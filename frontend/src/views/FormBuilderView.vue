<template>
  <div class="min-h-screen bg-gray-50">

    <header class="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
      <button @click="$router.push('/dashboard')" class="text-sm text-gray-500 hover:text-gray-700">
        ← Retour
      </button>
      <h1 class="text-lg font-bold text-gray-800">Éditeur de formulaire</h1>
      <button
        @click="saveForm"
        :disabled="saving"
        class="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
      >
        {{ saving ? 'Sauvegarde...' : 'Sauvegarder' }}
      </button>
    </header>

    <main class="max-w-3xl mx-auto px-4 py-8">

      <div class="mb-8">
        <label class="block text-sm font-medium text-gray-700 mb-1">Titre du formulaire</label>
        <input
          v-model="form.title"
          type="text"
          placeholder="Ex: Évaluation du cours..."
          class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div class="space-y-4 mb-6">
        <div
          v-for="(question, index) in form.questions"
          :key="question.tempId"
          class="bg-white rounded-xl border border-gray-200 p-5"
        >
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-semibold text-gray-400 uppercase">Question {{ index + 1 }}</span>
            <button @click="removeQuestion(index)" class="text-xs text-red-400 hover:text-red-600 transition">
              Supprimer
            </button>
          </div>

          <input
            v-model="question.question_text"
            type="text"
            placeholder="Libellé de la question"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <div class="flex gap-2 mb-3">
            <button
              v-for="type in questionTypes"
              :key="type.value"
              @click="question.question_type = type.value"
              :class="[
                'text-xs px-3 py-1 rounded-full border transition',
                question.question_type === type.value
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-500 border-gray-300 hover:border-blue-400'
              ]"
            >
              {{ type.label }}
            </button>
          </div>

          <div v-if="question.question_type === 'multiple_choice'" class="space-y-2">
            <div v-for="(option, oIndex) in question.options" :key="oIndex" class="flex items-center gap-2">
              <input
                v-model="option.option_text"
                type="text"
                :placeholder="`Option ${oIndex + 1}`"
                class="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button @click="removeOption(question, oIndex)" class="text-red-400 hover:text-red-600 text-xs">✕</button>
            </div>
            <button @click="addOption(question)" class="text-xs text-blue-600 hover:underline mt-1">
              + Ajouter une option
            </button>
          </div>

          <div v-if="question.question_type === 'scale'" class="text-xs text-gray-400 mt-1">
            Échelle de 1 à 5
          </div>
        </div>
      </div>

      <button
        @click="addQuestion"
        class="w-full border-2 border-dashed border-gray-300 hover:border-blue-400 text-gray-400 hover:text-blue-500 rounded-xl py-4 text-sm transition"
      >
        + Ajouter une question
      </button>

      <p v-if="feedbackMsg" :class="['text-sm text-center mt-4', feedbackOk ? 'text-green-600' : 'text-red-500']">
        {{ feedbackMsg }}
      </p>

    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/api/axios'

const route = useRoute()

const form = ref({ title: '', questions: [] })
const saving = ref(false)
const feedbackMsg = ref('')
const feedbackOk = ref(true)

const questionTypes = [
  { value: 'free_text', label: 'Texte libre' },
  { value: 'multiple_choice', label: 'Choix multiple' },
  { value: 'scale', label: 'Échelle' },
]

let tempIdCounter = 0

onMounted(async () => {
  try {
    const { data } = await api.get(`/forms/${route.params.id}`)
    form.value.title = data.title || ''
    form.value.questions = (data.questions || []).map(q => ({
      ...q,
      tempId: ++tempIdCounter,
      question_text: q.label,
      question_type: q.type,
      options: (q.options || []).map(o => ({
        ...o,
        option_text: o.label,
      })),
    }))
  } catch (err) {
    console.error('Erreur chargement formulaire', err)
  }
})

function addQuestion() {
  form.value.questions.push({
    tempId: ++tempIdCounter,
    question_text: '',
    question_type: 'free_text',
    options: [],
  })
}

function removeQuestion(index) {
  form.value.questions.splice(index, 1)
}

function addOption(question) {
  question.options.push({ option_text: '' })
}

function removeOption(question, index) {
  question.options.splice(index, 1)
}

async function saveForm() {
  saving.value = true
  feedbackMsg.value = ''
  try {
    await api.put(`/forms/${route.params.id}`, {
      title: form.value.title,
      questions: form.value.questions.map((q, i) => ({
        type: q.question_type,
        label: q.question_text,
        order_index: i,
        is_required: q.is_required || false,
        options: q.options.map((o, j) => ({
          label: o.option_text,
          value: o.option_text.toLowerCase().replace(/\s+/g, '_'),
          order_index: j,
        })),
      })),
    })
    feedbackOk.value = true
    feedbackMsg.value = 'Formulaire sauvegardé ✓'
  } catch (err) {
    feedbackOk.value = false
    feedbackMsg.value = 'Erreur lors de la sauvegarde.'
    console.error(err)
  } finally {
    saving.value = false
  }
}
</script>
