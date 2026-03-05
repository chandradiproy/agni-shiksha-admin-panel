// src/features/content/api/content.api.ts
import { api } from '@/lib/axios';

export interface ExamPayload {
  name: string;
  slug: string;
  category: string;
  conducting_body: string;
  description?: string;
}

export interface TestSeriesSection {
  name: string;
  question_count: number;
}

export interface TestSeriesPayload {
  exam_id: string;
  title: string;
  description: string;
  type: 'free' | 'premium' | 'premium_plus';
  test_type: 'full_mock' | 'sectional' | 'topic_wise' | 'pyq' | 'ca';
  subject?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  
  // Mechanics & Grading
  total_questions: number;
  duration_minutes: number;
  total_marks: number;
  negative_marking: boolean;
  negative_marks_per_wrong: number;
  sections?: TestSeriesSection[];
  instructions?: string;
  
  // Publishing & Scheduling
  is_all_india?: boolean;
  max_attempts?: number;
  price_if_standalone?: number;
  is_scheduled?: boolean;
  scheduled_at?: string | Date | null;
  available_from?: string | Date | null;
  available_until?: string | Date | null;
  show_solutions?: boolean;
  show_solutions_after?: 'immediate' | 'after_expiry' | 'never';
  is_published?: boolean;
}

export const contentApi = {
  // --- Exams ---
  getExams: async () => {
    const response = await api.get('/admin/content/exams');
    return response.data;
  },
  createExam: async (payload: ExamPayload) => {
    const response = await api.post('/admin/content/exams', payload);
    return response.data;
  },

  // --- Test Series ---
  getTestSeries: async (examId: string) => {
    const response = await api.get(`/admin/content/test-series/exam/${examId}`);
    return response.data;
  },
  createTestSeries: async (payload: TestSeriesPayload) => {
    const response = await api.post('/admin/content/test-series', payload);
    return response.data;
  },
  updateTestSeries: async (id: string, payload: Partial<TestSeriesPayload>) => {
    const response = await api.put(`/admin/content/test-series/${id}`, payload);
    return response.data;
  },
  deleteTestSeries: async (id: string) => {
    const response = await api.delete(`/admin/content/test-series/${id}`);
    return response.data;
  },

  // --- Question Bulk Upload (Contextual to Test Series) ---
  previewBulkQuestions: async (testSeriesId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/admin/questions/test-series/${testSeriesId}/preview-bulk`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  commitBulkQuestions: async (testSeriesId: string, questions: any[]) => {
    const response = await api.post(`/admin/questions/test-series/${testSeriesId}/commit-bulk`, { questions });
    return response.data;
  },

  // --- Individual Question Management ---
  getQuestions: async (testSeriesId: string) => {
    // Fetches all questions for a specific test series
    const response = await api.get(`/admin/questions/test-series/${testSeriesId}`);
    return response.data;
  },
  updateQuestion: async (testSeriesId: string, questionId: string, payload: any) => {
    const response = await api.put(`/admin/questions/test-series/${testSeriesId}/question/${questionId}`, payload);
    return response.data;
  },
  deleteQuestion: async (testSeriesId: string, questionId: string) => {
    const response = await api.delete(`/admin/questions/test-series/${testSeriesId}/questions/${questionId}`);
    return response.data;
  },
};