import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import DropZone from '../components/upload/DropZone';
import UploadForm from '../components/upload/UploadForm';
import ProgressTracker from '../components/upload/ProgressTracker';
import { useAuthStore } from '../store/useAuthStore';
import { useWebSocket } from '../hooks/useWebSocket';
import { uploadVideo, TranscodeProgress } from '../api/video.api';
import type { TranscodeProgress as TranscodeProgressType } from '../../shared/types';

interface UploadFormData {
  title: string;
  description: string;
  category: 'tech' | 'entertainment' | 'education' | 'gaming' | 'music' | 'other';
  isPaid: boolean;
  price: number;
}

type UploadState = 'idle' | 'uploading' | 'processing' | 'done' | 'error';

export default function UploadPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { onMessage, sendMessage } = useWebSocket();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [videoId, setVideoId] = useState<number | null>(null);
  const [progress, setProgress] = useState<TranscodeProgressType | null>(null);

  useEffect(() => {
    if (!videoId) return;
    const unsub = onMessage((msg) => {
      if (msg.type === 'transcode_progress') {
        const tp = msg.payload as TranscodeProgressType;
        if (tp.videoId === videoId) {
          setProgress(tp);
          if (tp.stage === 'done') {
            setUploadState('done');
          }
        }
      }
    });
    return unsub;
  }, [videoId, onMessage]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/upload' } });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (data: UploadFormData) => {
    if (!selectedFile || !user) return;

    setUploadState('uploading');
    setError(null);

    try {
      const formData = new FormData();
      formData.append('video', selectedFile);
      formData.append('title', data.title);
      formData.append('description', data.description);
      formData.append('category', data.category);
      formData.append('isPaid', String(data.isPaid));
      formData.append('price', String(data.price));

      const result = await uploadVideo(formData, (p) => {
        setProgress({
          videoId: 0,
          stage: 'uploading',
          stageProgress: p * 100,
          overallProgress: p * 5,
          completedResolutions: [],
          message: `正在上传文件... ${(p * 100).toFixed(0)}%`,
        });
      });

      setVideoId(result.videoId);
      setUploadState('processing');
      setProgress({
        videoId: result.videoId,
        stage: 'analyzing',
        stageProgress: 0,
        overallProgress: 5,
        completedResolutions: [],
        message: '视频上传完成，正在分析视频信息...',
      });

      sendMessage?.({
        type: 'hello',
        videoId: result.videoId,
        userId: user.id,
      });
    } catch (err: any) {
      setError(err.response?.data?.error || '上传失败，请重试');
      setUploadState('error');
    }
  };

  if (!isAuthenticated) return null;

  if (uploadState === 'done' && progress) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16">
        <div className="card-base p-10 text-center animate-fade-in">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-success/15 flex items-center justify-center mb-6">
            <CheckCircle2 className="w-10 h-10 text-success animate-pulse" />
          </div>
          <h1 className="text-3xl font-bold font-display text-text-primary mb-3">
            上传成功！
          </h1>
          <p className="text-text-muted mb-8 max-w-md mx-auto">
            您的视频已完成转码，生成了 360P / 720P / 1080P 多分辨率 HLS 流，可以立即分享给观众了。
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate(`/video/${videoId}`)}
              className="btn-primary h-12 px-8 font-semibold inline-flex items-center justify-center gap-2"
            >
              观看视频
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setSelectedFile(null);
                setProgress(null);
                setVideoId(null);
                setUploadState('idle');
              }}
              className="btn-secondary h-12 px-8 font-semibold"
            >
              继续上传
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="mb-8 animate-slide-up">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl bg-brand-gradient flex items-center justify-center shadow-lg glow-sm">
            <Upload className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold font-display text-text-primary">
              上传视频
            </h1>
            <p className="text-text-muted mt-0.5">
              分享您的创作，系统将自动转码为多分辨率 HLS 自适应流
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-error/30 bg-error/10 p-4 flex items-start gap-3 animate-fade-in">
          <AlertCircle className="w-5 h-5 text-error shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-error">上传失败</p>
            <p className="text-sm text-text-muted mt-1">{error}</p>
          </div>
          <button
            onClick={() => {
              setError(null);
              setUploadState('idle');
            }}
            className="text-sm text-text-secondary hover:text-text-primary font-medium"
          >
            重试
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <DropZone
            selectedFile={selectedFile}
            onFileSelect={setSelectedFile}
            onClear={() => setSelectedFile(null)}
          />
          {progress && uploadState !== 'idle' && uploadState !== 'error' && (
            <ProgressTracker progress={progress} />
          )}
        </div>
        <div className="lg:col-span-2 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <UploadForm
            onSubmit={handleSubmit}
            disabled={!selectedFile || uploadState === 'uploading' || uploadState === 'processing'}
            loading={uploadState === 'uploading'}
          />
        </div>
      </div>
    </div>
  );
}
