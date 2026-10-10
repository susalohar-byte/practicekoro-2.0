import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Eye, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { uploadQuestionImage } from '@/services/domains/admin.questions';
import { getErrorMessage } from '@/lib/errors';

export interface QuestionImageFieldProps {
  /** The current image URL (or empty string if none) */
  value?: string;
  /** Callback fired when image URL changes or is cleared */
  onChange: (url: string) => void;
  /** Custom label */
  label?: string;
  /** Sub-hint or helper text */
  helperText?: string;
  /** Whether the field is disabled or readonly */
  disabled?: boolean;
  /** Additional container classes */
  className?: string;
}

const ALLOWED_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
];

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * QuestionImageField
 *
 * Universal admin input component for attaching figures, diagrams, or charts to ANY question.
 *
 * Features:
 * - Direct image file upload (PNG, JPG, WEBP <= 5MB)
 * - Direct image URL input (e.g. CDN or public asset links)
 * - Immediate live thumbnail preview with fallback on broken links
 * - Replace and remove actions
 * - Click-to-enlarge modal for admin verification
 */
export const QuestionImageField: React.FC<QuestionImageFieldProps> = ({
  value = '',
  onChange,
  label = 'Question Figure / Diagram (Optional)',
  helperText = 'Attach diagrams for Reasoning, Geometry, Venn, Maps, or Science (Max 5MB)',
  disabled = false,
  className = '',
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const cleanUrl = (value || '').trim();

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
      return 'Invalid file type. Supported formats: PNG, JPG, WEBP.';
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      return `File size (${sizeMb} MB) exceeds maximum limit of 5 MB.`;
    }
    return null;
  };

  const handleFileUpload = async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    try {
      setIsUploading(true);
      setErrorMessage('');
      setPreviewError(false);
      const uploadedUrl = await uploadQuestionImage(file);
      onChange(uploadedUrl);
    } catch (err) {
      setErrorMessage(getErrorMessage(err, 'Failed to upload image. Please try again.'));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleRemove = () => {
    setErrorMessage('');
    setPreviewError(false);
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Header Label & Hint */}
      <div className="flex flex-wrap items-center justify-between gap-1">
        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
          {label}
        </label>
        {helperText && (
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
            {helperText}
          </span>
        )}
      </div>

      {/* Input / Upload Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="relative flex-1">
          <input
            type="url"
            value={value}
            disabled={disabled || isUploading}
            onChange={(e) => {
              setErrorMessage('');
              setPreviewError(false);
              onChange(e.target.value);
            }}
            placeholder="Paste image URL (https://...) or click Upload"
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 disabled:opacity-60 transition-all font-mono"
          />
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_MIME_TYPES.join(',')}
          disabled={disabled || isUploading}
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Upload Button */}
        <button
          type="button"
          disabled={disabled || isUploading}
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/80 rounded-xl text-xs font-bold transition-all shrink-0 disabled:opacity-50 cursor-pointer"
        >
          {isUploading ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Uploading...</span>
            </>
          ) : (
            <>
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Image</span>
            </>
          )}
        </button>

        {/* Remove Button if image present */}
        {cleanUrl && !disabled && (
          <button
            type="button"
            onClick={handleRemove}
            title="Remove Image"
            className="inline-flex items-center justify-center p-2 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-all border border-rose-200 dark:border-rose-900/50 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Inline Error Message */}
      {errorMessage && (
        <div className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 p-2 rounded-xl border border-rose-200 dark:border-rose-900/50">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Image Preview Card */}
      {cleanUrl && (
        <div className="p-2.5 bg-slate-100/80 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <div className="relative group shrink-0">
            {previewError ? (
              <div className="w-16 h-16 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex flex-col items-center justify-center text-amber-600 text-[10px] text-center p-1">
                <AlertCircle className="w-4 h-4 mb-0.5" />
                <span>Broken URL</span>
              </div>
            ) : (
              <img
                src={cleanUrl}
                alt="Question figure preview"
                onError={() => setPreviewError(true)}
                className="w-16 h-16 object-contain rounded-lg bg-white dark:bg-black border border-slate-200 dark:border-slate-700 shadow-2xs"
              />
            )}
            {!previewError && (
              <button
                type="button"
                onClick={() => setIsPreviewOpen(true)}
                title="View full preview"
                className="absolute inset-0 bg-black/40 rounded-lg opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
              >
                <Eye className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="text-[11px] text-slate-600 dark:text-slate-400 min-w-0 flex-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Figure Attached</span>
            </div>
            <p className="truncate text-slate-400 font-mono text-[10px] mt-0.5" title={cleanUrl}>
              {cleanUrl}
            </p>
            <div className="flex items-center gap-3 mt-1 text-[10px]">
              <button
                type="button"
                onClick={() => setIsPreviewOpen(true)}
                className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
              >
                Preview
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-semibold"
              >
                Replace
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="text-rose-500 hover:text-rose-600 font-semibold"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enlarge Preview Modal for Admin */}
      {isPreviewOpen && cleanUrl && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setIsPreviewOpen(false)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-4 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-3"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-indigo-500" />
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Figure Preview
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-[60vh] flex items-center justify-center p-2 bg-slate-50 dark:bg-slate-950 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800">
              <img
                src={cleanUrl}
                alt="Question diagram"
                className="max-h-[55vh] max-w-full object-contain mx-auto rounded-lg"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
