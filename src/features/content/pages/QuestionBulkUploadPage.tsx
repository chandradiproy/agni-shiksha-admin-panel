// src/features/content/pages/QuestionBulkUploadPage.tsx
import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { UploadCloud, CheckCircle, AlertCircle, Edit2, Save, X, FileText, Download, Lock } from 'lucide-react';
import { contentApi } from '@/features/content/api/content.api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface ParsedRow {
  isValid: boolean;
  errors: string[];
  data: any;
}

export const QuestionBulkUploadPage = () => {
  // --- Context Selection States ---
  const [exams, setExams] = useState<any[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [testSeriesList, setTestSeriesList] = useState<any[]>([]);
  const [selectedTestSeriesId, setSelectedTestSeriesId] = useState<string>('');

  // --- Upload States ---
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<any>({});
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch Exams on mount
  useEffect(() => {
    contentApi.getExams()
      .then(res => setExams(res.data || []))
      .catch(() => toast.error('Failed to load exams'));
  }, []);

  // Fetch Test Series when Exam changes
  useEffect(() => {
    if (selectedExamId) {
      contentApi.getTestSeries(selectedExamId)
        .then(res => setTestSeriesList(res.data || []))
        .catch(() => toast.error('Failed to load test series'));
      setSelectedTestSeriesId(''); // Reset subsequent dropdown
    } else {
      setTestSeriesList([]);
      setSelectedTestSeriesId('');
    }
  }, [selectedExamId]);

  const handleDownloadTemplate = () => {
    // Removed 'exam_slug' since backend draws it from the URL context now
    const headers = [
      "subject", "topic", "sub_topic", "section", 
      "question_type", "question_text", "question_text_hindi", 
      "option_a", "option_b", "option_c", "option_d", "correct_option", 
      "explanation", "explanation_hindi", "difficulty", "cognitive_type", 
      "marks", "tags", "source", "pyq_year"
    ];
    
    const sampleRow = [
      "Mathematics", "Algebra", "Linear Equations", "Quantitative Aptitude", 
      "mcq", "What is the value of x if 2x = 4?", "", 
      "1", "2", "3", "4", "b", 
      "Divide both sides by 2.", "", "easy", "application", 
      "2", "math,algebra", "NCERT", "2023"
    ];
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + sampleRow.map(v => `"${v}"`).join(",");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "agni_shiksha_question_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Template downloaded successfully");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handlePreview = async () => {
    if (!selectedTestSeriesId) return toast.error("Please select a target Test Series");
    if (!file) return toast.error("Please select a CSV file first");
    
    setIsUploading(true);
    try {
      const response = await contentApi.previewBulkQuestions(selectedTestSeriesId, file);
      
      const previewData = response.preview || [];
      const mappedRows: ParsedRow[] = previewData.map((row: any) => {
        const errorMessages = row.errors ? Object.values(row.errors).map(String) : [];
        return {
          isValid: row.isValid,
          errors: errorMessages.length > 0 ? errorMessages : (row.isValid ? [] : ['Validation failed']),
          data: row.data || {}
        };
      });
      
      setRows(mappedRows);
      
      if (mappedRows.length === 0) {
        toast.error("No valid or invalid rows found in the CSV.");
      } else {
        const validCount = response.totalRows - response.invalidRows;
        toast.success(`File parsed. Found ${validCount} valid and ${response.invalidRows} invalid rows.`);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to process file");
      setRows([]);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCommit = async () => {
    if (!selectedTestSeriesId) return toast.error("Please select a target Test Series");
    
    const hasErrors = rows.some(r => !r.isValid);
    if (hasErrors) {
      return toast.error("Please fix all rows with errors before committing.");
    }
    
    setIsUploading(true);
    try {
      const questionsToCommit = rows.map(r => r.data);
      const response = await contentApi.commitBulkQuestions(selectedTestSeriesId, questionsToCommit);

      if (response.errorCount > 0) {
        toast.error(`Uploaded ${response.successCount} questions, but ${response.errorCount} failed server validation.`);
        const failedRows = response.errors.map((err: any) => {
          const originalIndex = err.row > 0 ? err.row - 1 : 0;
          const originalRow = rows[originalIndex] || rows[0];
          return {
            isValid: false,
            errors: [err.error || 'Backend validation failed'],
            data: originalRow.data
          };
        });
        setRows(failedRows);
      } else {
        toast.success(response.message || "All questions uploaded successfully to the database!");
        setRows([]);
        setFile(null);
      }
    } catch (error: any) {
      const errData = error.response?.data;
      if (errData && errData.errorCount > 0) {
        toast.error(`Uploaded ${errData.successCount || 0} questions, but ${errData.errorCount} failed.`);
        const failedRows = errData.errors.map((err: any) => {
          const originalIndex = err.row > 0 ? err.row - 1 : 0;
          const originalRow = rows[originalIndex] || rows[0];
          return {
            isValid: false,
            errors: [err.error || 'Backend validation failed'],
            data: originalRow.data
          };
        });
        setRows(failedRows);
      } else {
        toast.error(errData?.error || errData?.message || "Failed to commit questions");
      }
    } finally {
      setIsUploading(false);
    }
  };

  // --- Inline Edit Handlers ---
  const startEdit = (index: number, data: any) => {
    setEditingIndex(index);
    setEditFormData({ ...data });
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditFormData({});
  };

  const saveEdit = (index: number) => {
    const updatedRows = [...rows];
    const errors: string[] = [];
    
    // Front-end Optimistic Validation
    if (!editFormData.question_text) errors.push("Question text is required");
    if (!editFormData.correct_option) errors.push("Correct option is required");
    
    updatedRows[index] = {
      isValid: errors.length === 0,
      errors: errors,
      data: editFormData
    };
    
    setRows(updatedRows);
    setEditingIndex(null);
  };

  const totalErrors = rows.filter(r => !r.isValid).length;

  return (
    <div className="space-y-6 animate-in fade-in">
      
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Question Bulk Upload</h1>
          <p className="text-sm text-gray-500 mt-1">Select the target Exam & Test Series to upload CSV questions.</p>
        </div>
        {rows.length > 0 && (
          <Button 
            onClick={handleCommit} 
            disabled={totalErrors > 0 || isUploading}
            className="shadow-md bg-orange-600 hover:bg-orange-700 text-white"
          >
            <Save size={16} className="mr-2" />
            Commit {rows.length} Questions
          </Button>
        )}
      </div>

      {/* STEP 1: Context Selection */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">1. Select Exam Category</label>
          <select
            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            disabled={rows.length > 0} // Lock selection if previewing data
          >
            <option value="">-- Choose an Exam --</option>
            {exams.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">2. Select Target Test Series</label>
          <select
            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-100 disabled:text-gray-400"
            value={selectedTestSeriesId}
            onChange={(e) => setSelectedTestSeriesId(e.target.value)}
            disabled={!selectedExamId || testSeriesList.length === 0 || rows.length > 0}
          >
            <option value="">-- Choose a Test Series --</option>
            {testSeriesList.map(ts => <option key={ts.id} value={ts.id}>{ts.title} ({ts.test_type})</option>)}
          </select>
        </div>
      </div>

      {/* STEP 2: Upload Zone (Locked until Test Series Selected) */}
      {!rows.length && (
        !selectedTestSeriesId ? (
          <div className="bg-gray-50/50 p-8 rounded-xl border border-dashed border-gray-300 flex flex-col items-center justify-center py-12 text-center text-gray-400">
            <Lock size={32} className="mb-3 opacity-50" />
            <p className="font-medium text-gray-500">Upload Zone Locked</p>
            <p className="text-sm mt-1">Please select an Exam and Test Series above to upload questions.</p>
          </div>
        ) : (
          <div className="bg-white p-8 rounded-xl border border-dashed border-orange-300 flex flex-col items-center justify-center py-16 text-center shadow-sm animate-in zoom-in-95 duration-300">
            <div className="h-16 w-16 bg-orange-50 rounded-full flex items-center justify-center text-orange-500 mb-4">
              <UploadCloud size={32} />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-1">Select CSV File</h3>
            <p className="text-sm text-gray-500 mb-6 max-w-sm">Upload questions strictly formatted to your template.</p>
            
            <input 
              type="file" 
              accept=".csv" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
            />
            
            <div className="flex flex-col sm:flex-row gap-3 items-center">
              <Button variant="outline" onClick={handleDownloadTemplate} className="border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-orange-600">
                <Download size={16} className="mr-2" />
                Download Template
              </Button>
              <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="border-orange-200 text-orange-700 hover:bg-orange-50">
                Browse File
              </Button>
              {file && (
                <Button onClick={handlePreview} isLoading={isUploading} className="bg-orange-600 hover:bg-orange-700 text-white">
                  Preview & Validate
                </Button>
              )}
            </div>
            {file && <p className="mt-4 text-sm font-medium text-orange-600 flex items-center justify-center gap-1"><FileText size={14}/> {file.name}</p>}
          </div>
        )
      )}

      {/* STEP 3: Preview & Edit Table */}
      {rows.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/80">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              Data Preview
              {totalErrors > 0 
                ? <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">{totalErrors} Errors Found</span>
                : <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">All Valid</span>
              }
            </h3>
            <Button variant="ghost" className="text-gray-500 hover:text-orange-600 text-sm h-8" onClick={() => {setRows([]); setFile(null);}}>
              Cancel & Start Over
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 w-16">Status</th>
                  <th className="px-4 py-3">Subject / Topic</th>
                  <th className="px-4 py-3 w-1/3">Question Text</th>
                  <th className="px-4 py-3">Correct Option</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((row, index) => (
                  <React.Fragment key={index}>
                    {/* Read-Only Row */}
                    <tr className={`hover:bg-gray-50 transition-colors ${!row.isValid ? 'bg-red-50/30' : ''}`}>
                      <td className="px-4 py-3">
                        {row.isValid 
                          ? <CheckCircle size={18} className="text-green-500" />
                          : <AlertCircle size={18} className="text-red-500" />
                        }
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-700">
                        {row.data.subject} <br/>
                        <span className="text-xs text-gray-400 font-normal">{row.data.topic}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 truncate max-w-xs">
                        {row.data.question_text || <span className="text-red-400 italic">Missing text</span>}
                        {!row.isValid && (
                          <div className="text-[10px] text-red-500 mt-1 font-medium">{row.errors.join(', ')}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {/* PERSONALIZATION: Explicitly display ONLY the correct option text */}
                        <div className="flex items-center gap-2">
                          <span className="bg-orange-100 text-orange-800 text-xs font-bold px-1.5 py-0.5 rounded uppercase">
                            {row.data.correct_option || '?'}
                          </span>
                          <span className="text-gray-600 truncate max-w-[150px]">
                            {row.data[`option_${row.data.correct_option}`] || 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button 
                          variant="ghost" 
                          className={`h-8 w-8 p-0 ${!row.isValid ? 'text-red-600 hover:bg-red-50' : 'text-gray-400 hover:text-orange-600'}`}
                          onClick={() => startEdit(index, row.data)}
                        >
                          <Edit2 size={16} />
                        </Button>
                      </td>
                    </tr>

                    {/* Expandable Inline Edit Row */}
                    {editingIndex === index && (
                      <tr className="bg-orange-50/40 border-y-2 border-orange-200 shadow-inner">
                        <td colSpan={5} className="p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-3">
                              <div>
                                <label className="text-xs font-semibold text-gray-600">Question Text</label>
                                <Input 
                                  value={editFormData.question_text || ''} 
                                  onChange={(e) => setEditFormData({...editFormData, question_text: e.target.value})} 
                                  className="focus:border-orange-500 focus:ring-orange-500"
                                />
                              </div>
                              <div className="flex gap-2">
                                <div className="flex-1">
                                  <label className="text-xs font-semibold text-gray-600">Subject</label>
                                  <Input value={editFormData.subject || ''} onChange={(e) => setEditFormData({...editFormData, subject: e.target.value})} className="focus:border-orange-500 focus:ring-orange-500" />
                                </div>
                                <div className="flex-1">
                                  <label className="text-xs font-semibold text-gray-600">Topic</label>
                                  <Input value={editFormData.topic || ''} onChange={(e) => setEditFormData({...editFormData, topic: e.target.value})} className="focus:border-orange-500 focus:ring-orange-500" />
                                </div>
                              </div>
                            </div>

                            <div className="space-y-3">
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="text-xs font-semibold text-gray-600">Option A</label>
                                  <Input value={editFormData.option_a || ''} onChange={(e) => setEditFormData({...editFormData, option_a: e.target.value})} className="focus:border-orange-500 focus:ring-orange-500" />
                                </div>
                                <div>
                                  <label className="text-xs font-semibold text-gray-600">Option B</label>
                                  <Input value={editFormData.option_b || ''} onChange={(e) => setEditFormData({...editFormData, option_b: e.target.value})} className="focus:border-orange-500 focus:ring-orange-500" />
                                </div>
                                <div>
                                  <label className="text-xs font-semibold text-gray-600">Option C</label>
                                  <Input value={editFormData.option_c || ''} onChange={(e) => setEditFormData({...editFormData, option_c: e.target.value})} className="focus:border-orange-500 focus:ring-orange-500" />
                                </div>
                                <div>
                                  <label className="text-xs font-semibold text-gray-600">Option D</label>
                                  <Input value={editFormData.option_d || ''} onChange={(e) => setEditFormData({...editFormData, option_d: e.target.value})} className="focus:border-orange-500 focus:ring-orange-500" />
                                </div>
                              </div>
                              <div>
                                <label className="text-xs font-semibold text-gray-600">Correct Option (a,b,c,d)</label>
                                <select 
                                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                                  value={editFormData.correct_option || ''}
                                  onChange={(e) => setEditFormData({...editFormData, correct_option: e.target.value})}
                                >
                                  <option value="">Select Correct Option</option>
                                  <option value="a">Option A</option>
                                  <option value="b">Option B</option>
                                  <option value="c">Option C</option>
                                  <option value="d">Option D</option>
                                </select>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-orange-200">
                            <Button variant="ghost" onClick={cancelEdit} className="text-gray-600 hover:bg-gray-100 hover:text-gray-800"><X size={16} className="mr-1"/> Cancel</Button>
                            <Button onClick={() => saveEdit(index)} className="bg-orange-600 hover:bg-orange-700 text-white"><CheckCircle size={16} className="mr-1"/> Save Fixes</Button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};