import React, { useState, useRef } from 'react';
import { Upload, FileText, Check, AlertCircle, Loader2, Lock } from 'lucide-react';
import { documentService } from '../services/api';

const DocumentUpload = ({ onUploadSuccess, onUpgradeRequired, isGuest, guestHasDocument }) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStep, setUploadStep] = useState('idle'); // 'idle', 'uploading', 'extracting', 'summarizing'
  const [status, setStatus] = useState(null); // 'success', 'error'
  const [message, setMessage] = useState('');
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const processFile = async (file) => {
    if (!file) return;

    // Validate type
    const validExtensions = ['pdf', 'docx', 'txt'];
    const ext = file.name.split('.').pop().toLowerCase();
    if (!validExtensions.includes(ext)) {
      setStatus('error');
      setMessage('Invalid file type. Please upload PDF, DOCX, or TXT.');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setUploadStep('uploading');
    setStatus(null);
    setMessage('');

    try {
      await documentService.uploadDocument(file, (percent) => {
        setUploadProgress(percent);
        if (percent === 100) {
          setUploadStep('extracting');
          setTimeout(() => {
            setUploadStep('summarizing');
          }, 1500);
        }
      });
      setStatus('success');
      setMessage(`"${file.name}" uploaded and analyzed successfully!`);
      onUploadSuccess();
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      console.error(err);
      const errData = err.response?.data;
      // Guest limit error from backend
      if (errData?.detail?.includes('Guest')) {
        onUpgradeRequired?.();
        return;
      }
      setStatus('error');
      setMessage(errData?.error || errData?.detail || 'Failed to upload and process document.');
    } finally {
      setUploading(false);
      setUploadStep('idle');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="w-full">
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={triggerFileInput}
        className={`w-full border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[220px] ${
          dragActive 
            ? 'border-brand-500 bg-brand-500/10' 
            : 'border-slate-800 bg-slate-900/20 hover:border-slate-700 hover:bg-slate-900/30'
        }`}
      >
        <input 
          ref={fileInputRef}
          type="file" 
          onChange={handleChange}
          accept=".pdf,.docx,.txt"
          className="hidden" 
        />

        {uploading ? (
          <div className="w-full space-y-4 px-2">
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span className="flex items-center gap-2 text-white">
                <Loader2 className="w-4 h-4 text-brand-450 animate-spin" />
                {uploadStep === 'uploading' && `Uploading file (${uploadProgress}%)`}
                {uploadStep === 'extracting' && 'Extracting text...'}
                {uploadStep === 'summarizing' && 'Generating summary...'}
              </span>
              <span className="font-bold text-brand-400">{uploadProgress}%</span>
            </div>

            {/* Progress Bar Container */}
            <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-900">
              <div 
                className="h-full bg-brand-500 rounded-full transition-all duration-300 ease-out" 
                style={{ width: `${uploadProgress}%` }}
              />
            </div>

            {/* Steps Visual List */}
            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-850">
              <div className={`flex flex-col gap-1 items-start text-left ${uploadStep === 'uploading' ? 'opacity-100' : 'opacity-30'}`}>
                <span className="text-[9px] uppercase font-bold text-brand-400">Step 1</span>
                <span className="text-[11px] text-white font-semibold">Upload</span>
              </div>
              <div className={`flex flex-col gap-1 items-start text-left ${uploadStep === 'extracting' ? 'opacity-100' : uploadStep === 'summarizing' ? 'opacity-70' : 'opacity-30'}`}>
                <span className="text-[9px] uppercase font-bold text-brand-400">Step 2</span>
                <span className="text-[11px] text-white font-semibold">Extract Text</span>
              </div>
              <div className={`flex flex-col gap-1 items-start text-left ${uploadStep === 'summarizing' ? 'opacity-100' : 'opacity-30'}`}>
                <span className="text-[9px] uppercase font-bold text-brand-400">Step 3</span>
                <span className="text-[11px] text-white font-semibold">AI Summary</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 flex flex-col items-center">
            <div className="bg-slate-900/80 p-3 rounded-full border border-slate-800 flex items-center justify-center">
              <Upload className="w-8 h-8 text-slate-400" />
            </div>
            <div>
              <p className="text-white font-medium text-base">
                Drag and drop your file here, or <span className="text-brand-400 hover:underline">browse</span>
              </p>
              <p className="text-xs text-slate-400 mt-1.5">
                Supports PDF, Word (DOCX), or Text (TXT) files up to 10MB
              </p>
            </div>
          </div>
        )}
      </div>

      {status && (
        <div className={`mt-4 p-4 rounded-xl flex items-start gap-3 border ${
          status === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
            : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
        } animate-in slide-in-from-top-4 duration-200`}>
          {status === 'success' ? (
            <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          )}
          <span className="text-sm font-medium">{message}</span>
        </div>
      )}
    </div>
  );
};

export default DocumentUpload;
