import { defineStore } from 'pinia'
import { supabase } from '../lib/supabase'

const RECENT_SUBMISSION_WINDOW_DAYS = 7
const RECENT_SUBMISSION_LIMIT = 3

export const useFeedbackStore = defineStore('Feedback', {
  state: () => ({
    feedbackList: [],
    error: null,
    loading: false,
  }),

  actions: {
    async fetchFeedback() {
      this.error = null
      this.loading = true

      try {
        if (!supabase) {
          this.error = 'Supabase client is not configured.'
          return []
        }

        const { data, error } = await supabase
          .from('feedback')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) {
          this.error = error.message
          return []
        }

        this.feedbackList = data || []
        return this.feedbackList
      } finally {
        this.loading = false
      }
    },

    async countRecentSubmissions(userId) {
      this.error = null

      if (!supabase || !userId) {
        return 0
      }

      const windowStart = new Date(
        Date.now() - RECENT_SUBMISSION_WINDOW_DAYS * 24 * 60 * 60 * 1000,
      ).toISOString()

      const { count, error } = await supabase
        .from('feedback')
        .select('feedback_id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', windowStart)

      if (error) {
        this.error = error.message
        return 0
      }

      return count || 0
    },

    async hasReachedRecentSubmissionLimit(userId) {
      const recentCount = await this.countRecentSubmissions(userId)
      return recentCount >= RECENT_SUBMISSION_LIMIT
    },

    async createFeedback(userId, feedback = {}) {
      this.error = null

      if (!supabase) {
        this.error = 'Supabase client is not configured.'
        return null
      }

      if (!userId) {
        this.error = 'No current user is available.'
        return null
      }

      const payload = {
        user_id: userId,
        feedback_type: feedback.feedback_type || '',
        subject: feedback.subject || '',
        description: feedback.description || '',
        contact: feedback.contact || null,
        email: feedback.email || null,
        allow_contact: Boolean(feedback.allow_contact),
      }

      const { data, error } = await supabase.from('feedback').insert(payload).select().single()

      if (error) {
        this.error = error.message
        return null
      }

      this.feedbackList = [data, ...this.feedbackList]
      return data
    },
  },
})
