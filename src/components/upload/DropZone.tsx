import { useCallback, useRef, useState } from 'react';
import { Upload, FileVideo, X } from 'lucide-react';
import clsx from 'clsx';

interface DropZoneProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  onClear: () => void;
}

export default function DropZone({ onFileSelect, selectedFile, onClear }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith('video/')) {
      onFileSelect(files[0]);
    }
  }, [onFileSelect]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileSelect(files[0]);
    }
  }, [onFileSelect]);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (selectedFile) {
    return (
      <div className="card-base p-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-brand-primary/20 flex items-center justify-center shrink-0">
            <FileVideo className="w-8 h-8 text-brand-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-semibold text-text-primary truncate">{selectedFile.name}</h3>
                <div className="flex items-center gap-3 mt-1 text-sm text-text-muted">
                  <span>{formatSize(selectedFile.size)}</span>
                  <span>·</span>
                  <span>{selectedFile.type || 'video/*'}</span>
                </div>
              </div>
              <button
                onClick={onClear}
                className="shrink-0 w-9 h-9 rounded-lg hover:bg-border-subtle flex items-center justify-center text-text-muted hover:text-text-primary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-3 h-1.5 bg-border-subtle rounded-full overflow-hidden">
              <div className="h-full bg-accent-gradient rounded-full animate-pulse-glow" style={{ width: '8%' }} />
            </div>
            <p className="text-xs text-text-muted mt-2">文件已就绪，填写下方信息后点击开始上传</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={clsx(
        'card-base p-10 cursor-pointer transition-all duration-300 border-2 border-dashed select-none',
        isDragging
          ? 'border-brand-primary bg-brand-primary/10 scale-[1.01] glow-md'
          : 'border-border-subtle hover:border-brand-primary/50 hover:bg-bg-card/50'
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        onChange={handleChange}
        className="hidden"
      />
      <div className="flex flex-col items-center text-center">
        <div className={clsx(
          'w-20 h-20 rounded-2xl flex items-center justify-center mb-5 transition-all duration-300',
          isDragging ? 'bg-brand-primary glow-md' : 'bg-brand-primary/15'
        )}>
          <Upload className={clsx(
            'w-10 h-10 transition-colors',
            isDragging ? 'text-white' : 'text-brand-primary'
          )} />
        </div>
        <h3 className="text-xl font-bold text-text-primary mb-2 font-display">
          {isDragging ? '释放文件开始上传' : '拖拽视频文件到此处'}
        </h3>
        <p className="text-text-muted mb-5 max-w-sm">
          或点击此区域选择文件，支持 MP4 / MOV / AVI / MKV / WebM 等主流视频格式，最大支持 2GB
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {['MP4', 'MOV', 'AVI', 'MKV', 'WebM', 'FLV'].map((fmt) => (
            <span key={fmt} className="chip bg-bg-card/80 text-text-muted text-xs">
              {fmt}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
