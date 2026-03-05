// src/features/content/pages/ExamManagementPage.tsx
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { BookOpen, Plus, FolderKanban, Clock, AlertCircle, X, CheckCircle, Settings, Calendar, Trash2, Edit3, List, Edit2, Save, Lock } from 'lucide-react';
import { contentApi, type TestSeriesPayload, type TestSeriesSection } from '@/features/content/api/content.api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

// Utility to convert ISO strings to local datetime for HTML5 input type="datetime-local"
const toDatetimeLocal = (isoStr?: string | null) => {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

// Polished inner components for the complex forms
const Select = ({ className = '', ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select className={`flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 shadow-sm transition-colors disabled:cursor-not-allowed disabled:bg-gray-50 disabled:opacity-50 ${className}`} {...props} />
);

const Textarea = ({ className = '', ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea className={`flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 shadow-sm transition-colors disabled:cursor-not-allowed disabled:bg-gray-50 disabled:opacity-50 ${className}`} {...props} />
);

export const ExamManagementPage = () => {
  const [exams, setExams] = useState<any[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [testSeries, setTestSeries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Layout View State: 'list' | 'create' | 'publish' | 'edit-basic' | 'questions'
  const [activeView, setActiveView] = useState<'list' | 'create' | 'publish' | 'edit-basic' | 'questions'>('list');

  // EXAM FORM STATE
  const [showExamForm, setShowExamForm] = useState(false);
  const [examForm, setExamForm] = useState({ name: '', slug: '', category: '', conducting_body: '' });

  // TEST SERIES: BASIC INFO / MECHANICS STATE
  const [creationStep, setCreationStep] = useState<1 | 2>(1);
  const [isProcessingTs, setIsProcessingTs] = useState(false);
  const [tsForm, setTsForm] = useState<Omit<TestSeriesPayload, 'exam_id'>>({
    title: '', description: '', type: 'free', test_type: 'full_mock', subject: '', difficulty: 'medium',
    total_questions: 100, duration_minutes: 120, total_marks: 200, negative_marking: false, negative_marks_per_wrong: 0.5,
    sections: [], instructions: ''
  });

  // TARGET TEST SERIES STATE (Used for Publishing, Editing, and Viewing Questions)
  const [targetTs, setTargetTs] = useState<any>(null); 
  const [publishForm, setPublishForm] = useState({
    is_all_india: false, max_attempts: 3, price_if_standalone: 0,
    is_scheduled: false, scheduled_at: '', available_from: '', available_until: '',
    show_solutions: true, show_solutions_after: 'after_expiry' as 'immediate' | 'after_expiry' | 'never',
    is_published: false
  });

  // QUESTIONS MANAGEMENT STATE
  const [questions, setQuestions] = useState<any[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [questionEditForm, setQuestionEditForm] = useState<any>({});

  useEffect(() => {
    if (publishForm.is_all_india) {
      setPublishForm(prev => ({ ...prev, show_solutions_after: 'after_expiry' }));
    }
  }, [publishForm.is_all_india]);

  const fetchExams = async () => {
    setIsLoading(true);
    try {
      const res = await contentApi.getExams();
      setExams(res.data || []);
    } catch (error: any) {
      toast.error('Failed to fetch exams');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTestSeries = async (examId: string) => {
    try {
      const res = await contentApi.getTestSeries(examId);
      setTestSeries(res.data || []);
    } catch (error: any) {
      toast.error('Failed to fetch test series');
    }
  };

  const fetchQuestions = async (tsId: string) => {
    setIsLoadingQuestions(true);
    try {
      const res = await contentApi.getQuestions(tsId);
      setQuestions(res.data || res.questions || []);
    } catch (error: any) {
      toast.error('Failed to fetch questions');
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  useEffect(() => { fetchExams(); }, []);

  useEffect(() => {
    if (selectedExamId) {
      fetchTestSeries(selectedExamId);
      setActiveView('list');
    }
  }, [selectedExamId]);

  // --- Handlers: EXAM ---
  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await contentApi.createExam(examForm as any);
      toast.success('Exam created successfully');
      setShowExamForm(false);
      setExamForm({ name: '', slug: '', category: '', conducting_body: '' });
      fetchExams();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create exam');
    }
  };

  // --- Handlers: TEST SERIES ---
  const handleCreateDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExamId) return toast.error('Please select an exam first');

    setIsProcessingTs(true);
    try {
      const payload: TestSeriesPayload = {
        ...tsForm,
        exam_id: selectedExamId,
        total_questions: Number(tsForm.total_questions),
        duration_minutes: Number(tsForm.duration_minutes),
        total_marks: Number(tsForm.total_marks),
        negative_marks_per_wrong: Number(tsForm.negative_marks_per_wrong),
        is_published: false
      };

      await contentApi.createTestSeries(payload);
      toast.success('Test Series Draft created successfully!');
      setActiveView('list');
      setCreationStep(1);
      fetchTestSeries(selectedExamId);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create draft');
    } finally {
      setIsProcessingTs(false);
    }
  };

  const handleUpdateBasicInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetTs) return;
    if (targetTs.is_published) return toast.error('Cannot edit a published test series');

    setIsProcessingTs(true);
    try {
      const payload: Partial<TestSeriesPayload> = {
        ...tsForm,
        total_questions: Number(tsForm.total_questions),
        duration_minutes: Number(tsForm.duration_minutes),
        total_marks: Number(tsForm.total_marks),
        negative_marks_per_wrong: Number(tsForm.negative_marks_per_wrong),
      };

      await contentApi.updateTestSeries(targetTs.id, payload);
      toast.success('Test Series details updated successfully!');
      setActiveView('list');
      fetchTestSeries(selectedExamId!);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update test series');
    } finally {
      setIsProcessingTs(false);
    }
  };

  const handlePublishTest = async (e: React.FormEvent, goLive: boolean = false) => {
    e.preventDefault();
    if (!targetTs) return;

    setIsProcessingTs(true);
    try {
      const payload = {
        ...publishForm,
        is_published: goLive ? true : publishForm.is_published,
        scheduled_at: publishForm.scheduled_at ? new Date(publishForm.scheduled_at).toISOString() : null,
        available_from: publishForm.available_from ? new Date(publishForm.available_from).toISOString() : null,
        available_until: publishForm.available_until ? new Date(publishForm.available_until).toISOString() : null,
        max_attempts: Number(publishForm.max_attempts),
        price_if_standalone: Number(publishForm.price_if_standalone)
      };

      await contentApi.updateTestSeries(targetTs.id, payload);
      toast.success(goLive ? 'Test Series is now LIVE!' : 'Settings updated successfully');
      
      if (selectedExamId) fetchTestSeries(selectedExamId);
      setActiveView('list');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update test series');
    } finally {
      setIsProcessingTs(false);
    }
  };

  const handleDeleteTestSeries = async (id: string, is_published: boolean) => {
    if (is_published) return toast.error("Cannot delete a live Test Series. Unpublish it first.");
    if (!confirm("Are you sure you want to delete this test series? All its questions will be lost.")) return;
    
    try {
      await contentApi.deleteTestSeries(id);
      toast.success("Test series deleted successfully");
      fetchTestSeries(selectedExamId!);
    } catch(e: any) {
      toast.error(e.response?.data?.error || "Failed to delete test series");
    }
  };

  // --- Handlers: QUESTIONS ---
  const handleUpdateQuestion = async (index: number) => {
    if (!targetTs || targetTs.is_published) return;
    try {
      const q = questionEditForm;
      
      // Map flat form data to backend payload matching your Zod schema
      const payload = {
        question_text: q.question_text,
        question_text_hindi: q.question_text_hindi || '',
        subject: q.subject,
        topic: q.topic,
        sub_topic: q.sub_topic || '',
        section: q.section,
        question_type: q.question_type || 'mcq',
        correct_option: q.correct_option_id, // Sent for bulk parsing fallback
        correct_option_id: q.correct_option_id, // Sent for direct update
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c,
        option_d: q.option_d,
        explanation: q.explanation || '',
        explanation_hindi: q.explanation_hindi || '',
        difficulty: q.difficulty || 'medium',
        cognitive_type: q.question_type_cognitive || '', 
        question_type_cognitive: q.question_type_cognitive || '', // Send both for safety
        marks: Number(q.marks) || 1,
        tags: q.tags ? q.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
        source: q.source || '',
        pyq_year: q.pyq_year || '',
      };

      await contentApi.updateQuestion(targetTs.id, q.id, payload);
      toast.success("Question updated successfully");
      setEditingQuestionId(null);
      fetchQuestions(targetTs.id);
    } catch (e: any) {
      toast.error(e.response?.data?.error || "Failed to update question");
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!targetTs || targetTs.is_published) return toast.error("Cannot delete questions from a published test");
    if (!confirm("Delete this question?")) return;
    try {
      await contentApi.deleteQuestion(targetTs.id, questionId);
      toast.success("Question deleted");
      fetchQuestions(targetTs.id);
    } catch (e: any) {
      toast.error(e.response?.data?.error || "Failed to delete question");
    }
  };

  // --- Navigation Helpers ---
  const openCreateTs = () => {
    setTsForm({
      title: '', description: '', type: 'free', test_type: 'full_mock', subject: '', difficulty: 'medium',
      total_questions: 100, duration_minutes: 120, total_marks: 200, negative_marking: false, negative_marks_per_wrong: 0.5,
      sections: [], instructions: ''
    });
    setCreationStep(1);
    setActiveView('create');
  };

  const openEditBasic = (ts: any) => {
    setTargetTs(ts);
    setTsForm({
      title: ts.title, description: ts.description, type: ts.type, test_type: ts.test_type, subject: ts.subject || '', difficulty: ts.difficulty,
      total_questions: ts.total_questions, duration_minutes: ts.duration_minutes, total_marks: ts.total_marks,
      negative_marking: ts.negative_marking, negative_marks_per_wrong: ts.negative_marks_per_wrong,
      sections: ts.sections || [], instructions: ts.instructions || ''
    });
    setCreationStep(1);
    setActiveView('edit-basic');
  };

  const openPublishing = (ts: any) => {
    setTargetTs(ts);
    setPublishForm({
      is_all_india: ts.is_all_india || false, max_attempts: ts.max_attempts || 3, price_if_standalone: ts.price_if_standalone || 0,
      is_scheduled: ts.is_scheduled || false, scheduled_at: toDatetimeLocal(ts.scheduled_at), available_from: toDatetimeLocal(ts.available_from),
      available_until: toDatetimeLocal(ts.available_until), show_solutions: ts.show_solutions ?? true, show_solutions_after: ts.show_solutions_after || 'after_expiry',
      is_published: ts.is_published || false
    });
    setActiveView('publish');
  };

  const openQuestionsView = (ts: any) => {
    setTargetTs(ts);
    setActiveView('questions');
    fetchQuestions(ts.id);
  };

  const startEditQuestion = (q: any) => {
    if (targetTs?.is_published) return toast.error("Published tests are locked");
    setEditingQuestionId(q.id);
    setQuestionEditForm({
      id: q.id,
      question_type: q.question_type || 'mcq',
      question_text: q.question_text || '',
      question_text_hindi: q.question_text_hindi || '',
      subject: q.subject || '',
      topic: q.topic || '',
      sub_topic: q.sub_topic || '',
      section: q.section || '',
      correct_option_id: q.correct_option_id || 'a',
      option_a: q.options?.find((o: any) => o.id === 'a')?.text || '',
      option_b: q.options?.find((o: any) => o.id === 'b')?.text || '',
      option_c: q.options?.find((o: any) => o.id === 'c')?.text || '',
      option_d: q.options?.find((o: any) => o.id === 'd')?.text || '',
      explanation: q.explanation || '',
      explanation_hindi: q.explanation_hindi || '',
      difficulty: q.difficulty || 'medium',
      question_type_cognitive: q.question_type_cognitive || '',
      marks: q.marks || 1,
      tags: q.tags?.join(', ') || '',
      source: q.source || '',
      pyq_year: q.pyq_year || '',
    });
  };

  const addSection = () => setTsForm({ ...tsForm, sections: [...(tsForm.sections || []), { name: '', question_count: 0 }] });
  const updateSection = (index: number, field: keyof TestSeriesSection, value: any) => {
    const newSec = [...(tsForm.sections || [])];
    newSec[index] = { ...newSec[index], [field]: value };
    setTsForm({ ...tsForm, sections: newSec });
  };
  const removeSection = (index: number) => {
    const newSec = [...(tsForm.sections || [])];
    newSec.splice(index, 1);
    setTsForm({ ...tsForm, sections: newSec });
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-8rem)] animate-in fade-in">
      
      {/* ------------------------------------------------------------------------- */}
      {/* LEFT PANE: Exams List */}
      {/* ------------------------------------------------------------------------- */}
      <div className="w-full md:w-1/3 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="font-bold text-gray-800 flex items-center gap-2">
            <BookOpen size={18} className="text-orange-500" /> Exam Categories
          </h2>
          <Button variant="ghost" className="h-8 w-8 p-0 text-orange-600 hover:bg-orange-50" onClick={() => setShowExamForm(!showExamForm)}>
            <Plus size={18} />
          </Button>
        </div>
        
        <div className="overflow-y-auto flex-1 p-2 space-y-1">
          {showExamForm && (
            <form onSubmit={handleCreateExam} className="p-3 bg-orange-50/50 border border-orange-100 rounded-lg mb-4 space-y-3 animate-in slide-in-from-top-2">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-orange-800 uppercase tracking-wider">New Exam</span>
                <button type="button" onClick={() => setShowExamForm(false)} className="text-orange-400 hover:text-orange-700"><X size={14}/></button>
              </div>
              <Input placeholder="Exam Name" required value={examForm.name} onChange={e => setExamForm({...examForm, name: e.target.value})} className="focus:ring-orange-500 shadow-sm" />
              <Input placeholder="URL Slug" required value={examForm.slug} onChange={e => setExamForm({...examForm, slug: e.target.value})} className="focus:ring-orange-500 shadow-sm" />
              <Input placeholder="Category" required value={examForm.category} onChange={e => setExamForm({...examForm, category: e.target.value})} className="focus:ring-orange-500 shadow-sm" />
              <Input placeholder="Conducting Body" required value={examForm.conducting_body} onChange={e => setExamForm({...examForm, conducting_body: e.target.value})} className="focus:ring-orange-500 shadow-sm" />
              <Button type="submit" className="w-full h-8 text-xs bg-orange-600 hover:bg-orange-700 text-white">Save Exam</Button>
            </form>
          )}

          {isLoading ? (
            <p className="text-center text-gray-400 py-4 text-sm">Loading exams...</p>
          ) : exams.length === 0 ? (
             <p className="text-center text-gray-400 py-4 text-sm">No exams found.</p>
          ) : (
            exams.map(exam => (
              <button
                key={exam.id}
                onClick={() => setSelectedExamId(exam.id)}
                className={`w-full text-left px-4 py-3 rounded-lg transition-all border ${
                  selectedExamId === exam.id ? 'bg-orange-50 border-orange-200 text-orange-800 shadow-sm' : 'bg-white border-transparent hover:bg-gray-50 text-gray-700'
                }`}
              >
                <div className="font-semibold text-sm">{exam.name}</div>
                <div className="text-xs text-gray-400 uppercase tracking-wider mt-1">{exam.conducting_body} • {exam.category}</div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------------------- */}
      {/* RIGHT PANE: Workspace */}
      {/* ------------------------------------------------------------------------- */}
      <div className="w-full md:w-2/3 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
        {selectedExamId ? (
          <>
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="font-bold text-gray-800 flex items-center gap-2">
                <FolderKanban size={18} className="text-orange-500" />
                {activeView === 'create' ? 'Drafting New Test' 
                  : activeView === 'publish' ? 'Publishing Settings' 
                  : activeView === 'edit-basic' ? `Editing: ${targetTs?.title}` 
                  : activeView === 'questions' ? `Questions: ${targetTs?.title}` 
                  : 'Test Series Catalog'}
              </h2>
              
              {activeView === 'list' ? (
                <Button onClick={openCreateTs} className="h-8 text-xs bg-white text-orange-600 border border-orange-200 hover:bg-orange-50 shadow-sm">
                  <Plus size={14} className="mr-1" /> Create Test Series
                </Button>
              ) : (
                <Button onClick={() => setActiveView('list')} variant="ghost" className="h-8 text-xs text-gray-500">
                  <X size={14} className="mr-1" /> Back to Catalog
                </Button>
              )}
            </div>
            
            <div className="p-4 overflow-y-auto flex-1 relative bg-gray-50/30">
              
              {/* ========================================================= */}
              {/* VIEW: CREATION & EDITING WIZARD (Basic Info & Mechanics) */}
              {/* ========================================================= */}
              {(activeView === 'create' || activeView === 'edit-basic') && (
                <div className="animate-in fade-in duration-300">
                  
                  {targetTs?.is_published && activeView === 'edit-basic' && (
                    <div className="mb-4 bg-orange-50 text-orange-800 border border-orange-200 p-3 rounded-lg text-sm flex items-center gap-2 shadow-sm">
                      <Lock size={16} /> This Test Series is live. Core parameters cannot be modified.
                    </div>
                  )}

                  <div className="flex border-b border-gray-200 mb-6">
                    <button className={`pb-3 px-6 font-semibold text-sm transition-colors border-b-2 ${creationStep === 1 ? 'border-orange-600 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`} onClick={() => setCreationStep(1)}>1. Basic Information</button>
                    <button className={`pb-3 px-6 font-semibold text-sm transition-colors border-b-2 ${creationStep === 2 ? 'border-orange-600 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`} onClick={() => setCreationStep(2)}>2. Test Mechanics & Grading</button>
                  </div>

                  <form onSubmit={activeView === 'create' ? handleCreateDraft : handleUpdateBasicInfo}>
                    {/* Step 1: Basic Info */}
                    <div className={creationStep === 1 ? 'block space-y-4' : 'hidden'}>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Test Title</label>
                        <Input disabled={targetTs?.is_published} required value={tsForm.title} onChange={e => setTsForm({...tsForm, title: e.target.value})} className="focus:ring-orange-500 bg-white shadow-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
                        <Textarea disabled={targetTs?.is_published} className="min-h-[100px]" value={tsForm.description} onChange={e => setTsForm({...tsForm, description: e.target.value})} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Monetization Type</label>
                          <Select disabled={targetTs?.is_published} value={tsForm.type} onChange={e => setTsForm({...tsForm, type: e.target.value as any})}>
                            <option value="free">Free</option>
                            <option value="premium">Premium</option>
                            <option value="premium_plus">Premium Plus</option>
                          </Select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Test Type Classification</label>
                          <Select disabled={targetTs?.is_published} value={tsForm.test_type} onChange={e => setTsForm({...tsForm, test_type: e.target.value as any})}>
                            <option value="full_mock">Full Mock Test</option>
                            <option value="sectional">Sectional Test</option>
                            <option value="topic_wise">Topic Wise</option>
                            <option value="pyq">Previous Year Question (PYQ)</option>
                            <option value="ca">Current Affairs (CA)</option>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        {tsForm.test_type === 'sectional' && (
                          <div className="animate-in fade-in">
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Subject Scope</label>
                            <Input disabled={targetTs?.is_published} value={tsForm.subject || ''} onChange={e => setTsForm({...tsForm, subject: e.target.value})} className="focus:ring-orange-500 bg-white shadow-sm" />
                          </div>
                        )}
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Overall Difficulty</label>
                          <Select disabled={targetTs?.is_published} value={tsForm.difficulty} onChange={e => setTsForm({...tsForm, difficulty: e.target.value as any})}>
                            <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
                          </Select>
                        </div>
                      </div>

                      <div className="flex justify-end pt-4">
                        <Button type="button" onClick={() => setCreationStep(2)} className="bg-gray-800 text-white hover:bg-gray-900 shadow-md">Next Step &rarr;</Button>
                      </div>
                    </div>

                    {/* Step 2: Mechanics */}
                    <div className={creationStep === 2 ? 'block space-y-4' : 'hidden'}>
                      <div className="grid grid-cols-3 gap-4 p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Total Questions</label>
                          <Input disabled={targetTs?.is_published} type="number" required value={tsForm.total_questions} onChange={e => setTsForm({...tsForm, total_questions: e.target.value as any})} className="focus:ring-orange-500 shadow-sm" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Duration (Mins)</label>
                          <Input disabled={targetTs?.is_published} type="number" required value={tsForm.duration_minutes} onChange={e => setTsForm({...tsForm, duration_minutes: e.target.value as any})} className="focus:ring-orange-500 shadow-sm" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Total Marks</label>
                          <Input disabled={targetTs?.is_published} type="number" step="0.5" required value={tsForm.total_marks} onChange={e => setTsForm({...tsForm, total_marks: e.target.value as any})} className="focus:ring-orange-500 shadow-sm" />
                        </div>
                      </div>

                      <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-2">
                          <input disabled={targetTs?.is_published} type="checkbox" id="negMark" checked={tsForm.negative_marking} onChange={e => setTsForm({...tsForm, negative_marking: e.target.checked})} className="rounded border-gray-300 text-orange-600 focus:ring-orange-500 h-4 w-4 disabled:opacity-50" />
                          <label htmlFor="negMark" className="text-sm font-medium text-gray-700">Negative Marking</label>
                        </div>
                        {tsForm.negative_marking && (
                          <div className="flex items-center gap-2 border-l border-gray-200 pl-4 ml-2 animate-in slide-in-from-left-2">
                            <label className="text-xs font-semibold text-gray-600">Penalty per wrong answer:</label>
                            <input disabled={targetTs?.is_published} type="number" step="0.25" required={tsForm.negative_marking} value={tsForm.negative_marks_per_wrong} onChange={e => setTsForm({...tsForm, negative_marks_per_wrong: e.target.value as any})} className="h-8 w-24 rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-sm disabled:opacity-50" />
                          </div>
                        )}
                      </div>

                      <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
                        <div className="flex justify-between items-center mb-3">
                          <label className="block text-xs font-semibold text-gray-600">Dynamic Sections (Optional)</label>
                          {!targetTs?.is_published && <Button type="button" variant="outline" onClick={addSection} className="h-7 text-xs border-orange-200 text-orange-700 hover:bg-orange-50 px-2">+ Add Section</Button>}
                        </div>
                        {tsForm.sections && tsForm.sections.length > 0 ? (
                          <div className="space-y-2">
                            {tsForm.sections.map((sec, idx) => (
                              <div key={idx} className="flex gap-2 items-center">
                                <Input disabled={targetTs?.is_published} value={sec.name} onChange={e => updateSection(idx, 'name', e.target.value)} className="flex-1 shadow-sm" />
                                <Input disabled={targetTs?.is_published} type="number" value={sec.question_count} onChange={e => updateSection(idx, 'question_count', Number(e.target.value))} className="w-32 shadow-sm" />
                                {!targetTs?.is_published && <button type="button" onClick={() => removeSection(idx)} className="p-2 text-red-500 hover:bg-red-50 rounded-md"><Trash2 size={16}/></button>}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400 italic">No sections defined.</p>
                        )}
                      </div>

                      <div className="flex justify-between pt-4 border-t border-gray-200">
                        <Button type="button" variant="ghost" onClick={() => setCreationStep(1)}>&larr; Back</Button>
                        {!targetTs?.is_published && (
                          <Button type="submit" isLoading={isProcessingTs} className="bg-orange-600 hover:bg-orange-700 text-white shadow-md">
                            <Save size={16} className="mr-2" /> {activeView === 'create' ? 'Save Draft' : 'Save Changes'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </form>
                </div>
              )}

              {/* ========================================================= */}
              {/* VIEW: PUBLISHING SETTINGS (UPDATE) */}
              {/* ========================================================= */}
              {activeView === 'publish' && targetTs && (
                <div className="animate-in slide-in-from-bottom-4 duration-300">
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-gray-900">{targetTs.title}</h3>
                    <p className="text-sm text-gray-500">Configure scheduling, visibility, and go live.</p>
                  </div>
                  <form onSubmit={e => handlePublishTest(e, false)} className="space-y-6">
                    <div className="p-5 bg-white border border-gray-200 rounded-xl shadow-sm space-y-4">
                      <h4 className="font-semibold text-gray-800 border-b pb-2 flex items-center gap-2"><Settings size={16}/> General Rules</h4>
                      
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <div>
                          <p className="font-medium text-sm text-gray-800">All India Mock Test Mode</p>
                          <p className="text-xs text-gray-500">Forces concurrent ranking and delayed solutions.</p>
                        </div>
                        <input disabled={targetTs.is_published} type="checkbox" checked={publishForm.is_all_india} onChange={e => setPublishForm({...publishForm, is_all_india: e.target.checked})} className="h-5 w-5 text-orange-600 rounded disabled:opacity-50"/>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Max Attempts per User</label>
                          <Input disabled={targetTs.is_published} type="number" min="1" required value={publishForm.max_attempts} onChange={e => setPublishForm({...publishForm, max_attempts: Number(e.target.value)})} className="shadow-sm" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Standalone Price (₹)</label>
                          <Input disabled={targetTs.is_published} type="number" min="0" value={publishForm.price_if_standalone} onChange={e => setPublishForm({...publishForm, price_if_standalone: Number(e.target.value)})} className="shadow-sm" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <div className="flex items-center gap-2">
                          <input disabled={targetTs.is_published} type="checkbox" id="showSol" checked={publishForm.show_solutions} onChange={e => setPublishForm({...publishForm, show_solutions: e.target.checked})} className="h-4 w-4 text-orange-600 rounded disabled:opacity-50"/>
                          <label htmlFor="showSol" className="text-sm font-medium text-gray-800">Show Solutions</label>
                        </div>
                        <div>
                          <Select disabled={targetTs.is_published || !publishForm.show_solutions || publishForm.is_all_india} value={publishForm.show_solutions_after} onChange={e => setPublishForm({...publishForm, show_solutions_after: e.target.value as any})}>
                            <option value="immediate">Immediately after submission</option>
                            <option value="after_expiry">After the test window expires</option>
                            <option value="never">Never</option>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <div className="p-5 bg-white border border-gray-200 rounded-xl shadow-sm space-y-4">
                      <div className="flex justify-between items-center border-b pb-2">
                        <h4 className="font-semibold text-gray-800 flex items-center gap-2"><Calendar size={16}/> Scheduling</h4>
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-medium text-gray-700">Enable Schedule</label>
                          <input disabled={targetTs.is_published} type="checkbox" checked={publishForm.is_scheduled} onChange={e => setPublishForm({...publishForm, is_scheduled: e.target.checked})} className="h-4 w-4 text-orange-600 rounded disabled:opacity-50"/>
                        </div>
                      </div>
                      {publishForm.is_scheduled && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div><label className="block text-xs font-semibold text-gray-600 mb-1">Scheduled At (Event Time)</label><Input disabled={targetTs.is_published} type="datetime-local" value={publishForm.scheduled_at} onChange={e => setPublishForm({...publishForm, scheduled_at: e.target.value})} className="shadow-sm" /></div>
                          <div><label className="block text-xs font-semibold text-gray-600 mb-1">Available From</label><Input disabled={targetTs.is_published} type="datetime-local" value={publishForm.available_from} onChange={e => setPublishForm({...publishForm, available_from: e.target.value})} className="shadow-sm" /></div>
                          <div><label className="block text-xs font-semibold text-gray-600 mb-1">Available Until</label><Input disabled={targetTs.is_published} type="datetime-local" value={publishForm.available_until} onChange={e => setPublishForm({...publishForm, available_until: e.target.value})} className="shadow-sm" /></div>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-center bg-white p-4 border border-gray-200 rounded-xl shadow-sm">
                      {!targetTs.is_published && <Button type="submit" variant="outline" isLoading={isProcessingTs}>Save Settings</Button>}
                      
                      {!targetTs.is_published ? (
                        <Button type="button" onClick={(e) => handlePublishTest(e, true)} isLoading={isProcessingTs} className="bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/20"><CheckCircle size={16} className="mr-2" /> Publish Test (Go Live)</Button>
                      ) : (
                        <div className="flex w-full justify-between items-center text-green-600 font-bold bg-green-50 px-4 py-2 rounded-lg border border-green-200">
                          <span className="flex items-center gap-2"><CheckCircle size={16} /> TEST IS LIVE</span>
                          <span className="text-xs font-normal text-gray-500">Settings are locked to protect student records.</span>
                        </div>
                      )}
                    </div>
                  </form>
                </div>
              )}

              {/* ========================================================= */}
              {/* VIEW: QUESTIONS MANAGER */}
              {/* ========================================================= */}
              {activeView === 'questions' && targetTs && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col animate-in fade-in">
                  <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/80">
                    <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                      Questions Bank <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">{questions.length} / {targetTs.total_questions}</span>
                    </h3>
                    {targetTs.is_published && <span className="text-xs text-orange-600 font-bold flex items-center gap-1"><Lock size={12}/> Live - Locked</span>}
                  </div>

                  {isLoadingQuestions ? (
                    <div className="p-8 text-center text-gray-500">Loading questions...</div>
                  ) : questions.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 italic">No questions have been uploaded yet.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-4 py-3 w-12">#</th>
                            <th className="px-4 py-3">Section / Topic</th>
                            <th className="px-4 py-3 w-1/3">Question Text</th>
                            <th className="px-4 py-3">Correct Option</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {questions.map((q, index) => (
                            <React.Fragment key={q.id}>
                              <tr className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-3 text-gray-400 font-mono">{index + 1}</td>
                                <td className="px-4 py-3 font-medium text-gray-700">
                                  {q.section} <br/><span className="text-xs text-gray-400 font-normal">{q.subject} • {q.topic}</span>
                                </td>
                                <td className="px-4 py-3 text-gray-600 truncate max-w-xs">{q.question_text}</td>
                                <td className="px-4 py-3">
                                  {/* PERSONALIZATION: Explicitly display ONLY the correct option text in read-only view */}
                                  <div className="flex items-center gap-2">
                                    <span className="bg-orange-100 text-orange-800 text-xs font-bold px-1.5 py-0.5 rounded uppercase">{q.correct_option_id}</span>
                                    <span className="text-gray-600 truncate max-w-[150px]">
                                      {q.options?.find((o: any) => o.id === q.correct_option_id)?.text || 'N/A'}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-right">
                                  {!targetTs.is_published && (
                                    <>
                                      <Button variant="ghost" className="h-8 w-8 p-0 text-gray-400 hover:text-orange-600 mr-1" onClick={() => startEditQuestion(q)}><Edit2 size={14} /></Button>
                                      <Button variant="ghost" className="h-8 w-8 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50" onClick={() => handleDeleteQuestion(q.id)}><Trash2 size={14} /></Button>
                                    </>
                                  )}
                                </td>
                              </tr>

                              {/* Question Inline Edit Mode */}
                              {editingQuestionId === q.id && !targetTs.is_published && (
                                <tr className="bg-orange-50/30 border-y border-orange-200 shadow-inner">
                                  <td colSpan={5} className="p-0">
                                    <div className="p-6">
                                      <div className="flex items-center justify-between mb-4 pb-2 border-b border-orange-100">
                                        <div className="flex items-center gap-2">
                                          <Edit3 size={16} className="text-orange-600" />
                                          <h4 className="text-sm font-bold text-gray-800">Advanced Question Editor</h4>
                                        </div>
                                        <div className="flex gap-2">
                                          <Button variant="outline" onClick={() => setEditingQuestionId(null)} className="h-8 text-xs border-gray-300 text-gray-600 bg-white"><X size={14} className="mr-1"/> Cancel</Button>
                                          <Button onClick={() => handleUpdateQuestion(index)} className="h-8 text-xs bg-orange-600 hover:bg-orange-700 text-white shadow-md"><CheckCircle size={14} className="mr-1"/> Save</Button>
                                        </div>
                                      </div>
                                      
                                      <div className="space-y-6">
                                        {/* Block 1: Metadata */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                                          <div><label className="block text-xs font-semibold text-gray-600 mb-1">Section</label><Input value={questionEditForm.section || ''} onChange={e => setQuestionEditForm({...questionEditForm, section: e.target.value})} className="shadow-sm" /></div>
                                          <div><label className="block text-xs font-semibold text-gray-600 mb-1">Subject</label><Input value={questionEditForm.subject || ''} onChange={e => setQuestionEditForm({...questionEditForm, subject: e.target.value})} className="shadow-sm" /></div>
                                          <div><label className="block text-xs font-semibold text-gray-600 mb-1">Topic</label><Input value={questionEditForm.topic || ''} onChange={e => setQuestionEditForm({...questionEditForm, topic: e.target.value})} className="shadow-sm" /></div>
                                          <div><label className="block text-xs font-semibold text-gray-600 mb-1">Sub Topic (Optional)</label><Input value={questionEditForm.sub_topic || ''} onChange={e => setQuestionEditForm({...questionEditForm, sub_topic: e.target.value})} className="shadow-sm" /></div>
                                        </div>

                                        {/* Block 2: Question Content */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                                          <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1">Question Text (English)</label>
                                            <Textarea value={questionEditForm.question_text || ''} onChange={e => setQuestionEditForm({...questionEditForm, question_text: e.target.value})} className="min-h-[80px]" />
                                          </div>
                                          <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1">Question Text (Hindi) - Optional</label>
                                            <Textarea value={questionEditForm.question_text_hindi || ''} onChange={e => setQuestionEditForm({...questionEditForm, question_text_hindi: e.target.value})} className="min-h-[80px]" />
                                          </div>
                                        </div>

                                        {/* Block 3: Options */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 p-4 bg-orange-50/50 rounded-xl border border-orange-100 shadow-sm">
                                          <div><label className="block text-xs font-semibold text-gray-600 mb-1">Option A</label><Input value={questionEditForm.option_a || ''} onChange={e => setQuestionEditForm({...questionEditForm, option_a: e.target.value})} className="shadow-sm bg-white" /></div>
                                          <div><label className="block text-xs font-semibold text-gray-600 mb-1">Option B</label><Input value={questionEditForm.option_b || ''} onChange={e => setQuestionEditForm({...questionEditForm, option_b: e.target.value})} className="shadow-sm bg-white" /></div>
                                          <div><label className="block text-xs font-semibold text-gray-600 mb-1">Option C</label><Input value={questionEditForm.option_c || ''} onChange={e => setQuestionEditForm({...questionEditForm, option_c: e.target.value})} className="shadow-sm bg-white" /></div>
                                          <div><label className="block text-xs font-semibold text-gray-600 mb-1">Option D</label><Input value={questionEditForm.option_d || ''} onChange={e => setQuestionEditForm({...questionEditForm, option_d: e.target.value})} className="shadow-sm bg-white" /></div>
                                          <div>
                                            <label className="block text-xs font-bold text-orange-700 mb-1">Correct Option</label>
                                            <Select value={questionEditForm.correct_option_id || ''} onChange={e => setQuestionEditForm({...questionEditForm, correct_option_id: e.target.value})} className="bg-orange-100 border-orange-300 text-orange-900 font-bold">
                                              <option value="a">A is Correct</option><option value="b">B is Correct</option><option value="c">C is Correct</option><option value="d">D is Correct</option>
                                            </Select>
                                          </div>
                                        </div>

                                        {/* Block 4: Explanations */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                                          <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1">Explanation (English)</label>
                                            <Textarea value={questionEditForm.explanation || ''} onChange={e => setQuestionEditForm({...questionEditForm, explanation: e.target.value})} className="min-h-[80px]" />
                                          </div>
                                          <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1">Explanation (Hindi) - Optional</label>
                                            <Textarea value={questionEditForm.explanation_hindi || ''} onChange={e => setQuestionEditForm({...questionEditForm, explanation_hindi: e.target.value})} className="min-h-[80px]" />
                                          </div>
                                        </div>

                                        {/* Block 5: Additional Settings */}
                                        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                                          <div><label className="block text-xs font-semibold text-gray-600 mb-1">Marks</label><Input type="number" step="0.5" value={questionEditForm.marks || ''} onChange={e => setQuestionEditForm({...questionEditForm, marks: e.target.value})} className="shadow-sm" /></div>
                                          <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1">Difficulty</label>
                                            <Select value={questionEditForm.difficulty || ''} onChange={e => setQuestionEditForm({...questionEditForm, difficulty: e.target.value})}>
                                              <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
                                            </Select>
                                          </div>
                                          <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1">Question Type</label>
                                            <Select value={questionEditForm.question_type || ''} onChange={e => setQuestionEditForm({...questionEditForm, question_type: e.target.value})}>
                                              <option value="mcq">MCQ</option><option value="true_false">True/False</option><option value="fill_blank">Fill in Blank</option>
                                            </Select>
                                          </div>
                                          <div><label className="block text-xs font-semibold text-gray-600 mb-1">Cognitive Type</label><Input placeholder="e.g. conceptual" value={questionEditForm.question_type_cognitive || ''} onChange={e => setQuestionEditForm({...questionEditForm, question_type_cognitive: e.target.value})} className="shadow-sm" /></div>
                                          <div><label className="block text-xs font-semibold text-gray-600 mb-1">PYQ Year</label><Input placeholder="e.g. 2023" value={questionEditForm.pyq_year || ''} onChange={e => setQuestionEditForm({...questionEditForm, pyq_year: e.target.value})} className="shadow-sm" /></div>
                                          <div><label className="block text-xs font-semibold text-gray-600 mb-1">Source</label><Input placeholder="e.g. NCERT" value={questionEditForm.source || ''} onChange={e => setQuestionEditForm({...questionEditForm, source: e.target.value})} className="shadow-sm" /></div>
                                          <div className="col-span-2 md:col-span-6"><label className="block text-xs font-semibold text-gray-600 mb-1">Tags (Comma Separated)</label><Input placeholder="e.g. math, algebra, hard" value={questionEditForm.tags || ''} onChange={e => setQuestionEditForm({...questionEditForm, tags: e.target.value})} className="shadow-sm" /></div>
                                        </div>
                                      </div>
                                      
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* ========================================================= */}
              {/* VIEW: TEST SERIES GRID (LIST) */}
              {/* ========================================================= */}
              {activeView === 'list' && (
                testSeries.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400">
                    <FolderKanban size={48} className="mb-4 text-gray-300" />
                    <p>No test series configured yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-in fade-in">
                    {testSeries.map(ts => (
                      <div key={ts.id} className="border border-gray-200 bg-white rounded-xl shadow-sm hover:border-orange-300 hover:shadow-md transition-all flex flex-col">
                        <div className="p-4 flex-1">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold text-gray-800 text-sm leading-tight pr-2">{ts.title}</h3>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0 ${ts.type === 'premium' || ts.type === 'premium_plus' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                              {ts.type.replace('_', ' ')}
                            </span>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600 mt-3">
                            <span className="flex items-center gap-1 font-medium"><BookOpen size={12} className="text-orange-500"/> {ts.total_questions} Qs</span>
                            <span className="flex items-center gap-1 font-medium"><Clock size={12} className="text-orange-500"/> {ts.duration_minutes}m</span>
                            <span className="capitalize font-medium text-gray-500 border-l border-gray-300 pl-3">{ts.test_type.replace('_', ' ')}</span>
                          </div>
                        </div>

                        {/* Action Footer */}
                        <div className="bg-gray-50 p-3 border-t border-gray-100 flex flex-wrap gap-2 justify-between items-center rounded-b-xl">
                          <div>
                            {ts.is_published ? (
                              <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 uppercase tracking-wider"><CheckCircle size={12}/> Published</span>
                            ) : (
                              <span className="flex items-center gap-1 text-[10px] font-bold text-gray-500 uppercase tracking-wider"><AlertCircle size={12}/> Draft</span>
                            )}
                          </div>
                          <div className="flex gap-1.5 shrink-0">
                            <Button variant="outline" className="h-7 text-xs border-gray-200 text-gray-600 hover:bg-white hover:border-orange-300 px-2.5" onClick={() => openEditBasic(ts)}>
                              <Edit3 size={12} className="mr-1" /> Info
                            </Button>
                            <Button variant="outline" className="h-7 text-xs border-gray-200 text-gray-600 hover:bg-white hover:border-orange-300 px-2.5" onClick={() => openQuestionsView(ts)}>
                              <List size={12} className="mr-1" /> Qs
                            </Button>
                            <Button variant="outline" className="h-7 text-xs border-orange-200 text-orange-700 hover:bg-orange-50 hover:border-orange-300 px-2.5" onClick={() => openPublishing(ts)}>
                              <Settings size={12} className="mr-1" /> Publish
                            </Button>
                            {!ts.is_published && (
                              <Button variant="ghost" className="h-7 w-7 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50" onClick={() => handleDeleteTestSeries(ts.id, ts.is_published)}>
                                <Trash2 size={14} />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50/30">
            <BookOpen size={48} className="mb-4 text-gray-300" />
            <p>Select an exam from the left panel</p>
          </div>
        )}
      </div>
    </div>
  );
};