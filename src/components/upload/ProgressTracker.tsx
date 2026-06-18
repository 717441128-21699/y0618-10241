import { TranscodeProgress } from '../../../shared/types';
import { CheckCircle2, Loader2, FileVideo, Zap, Box } from 'lucide-react';
import clsx from 'clsx';

interface ProgressTrackerProps {
  progress: TranscodeProgress;
  onComplete?: () => void;
}

const STAGE_CONFIG = [
  { key: 'uploading', label: '上传文件', icon: FileVideo, weight: 0 },
  { key: 'analyzing', label: '分析视频', icon: Zap, weight: 5 },
  { key: 'transcoding_360p', label: '转码 360P', icon: Zap, weight: 25 },
  { key: 'transcoding_720p', label: '转码 720P', icon: Zap, weight: 30 },
  { key: 'transcoding_1080p', label: '转码 1080P', icon: Zap, weight: 30 },
  { key: 'packaging', label: '打包 HLS', icon: Box, weight: 10 },
  { key: 'done', label: '转码完成', icon: CheckCircle2, weight: 0 },
] as const;

export default function ProgressTracker({ progress }: ProgressTrackerProps) {
  const currentIndex = STAGE_CONFIG.findIndex((s) => s.key === progress.stage);
  const isComplete = progress.stage === 'done';

  const getStageStatus = (idx: number) => {
    if (idx < currentIndex) return 'done';
    if (idx === currentIndex) return 'active';
    return 'pending';
  };

  return (
    <div className="card-base p-6 space-y-6">
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-bold text-text-primary font-display flex items-center gap-2">
            {isComplete ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-success" />
                转码完成
              </>
            ) : (
              <>
                <Loader2 className="w-5 h-5 text-brand-primary animate-spin" />
                正在处理视频
              </>
            )}
          </h3>
          <span className={`text-sm font-mono font-bold ${
            isComplete ? 'text-success' : 'text-brand-primary'
          }`}>
            {progress.overallProgress.toFixed(0)}%
          </span>
        </div>
        <div className="h-2 bg-border-subtle rounded-full overflow-hidden">
          <div
            className={clsx(
              'h-full rounded-full transition-all duration-500 ease-out',
              isComplete ? 'bg-success-gradient' : 'bg-brand-gradient animate-pulse-glow'
            )}
            style={{ width: `${progress.overallProgress}%` }}
          />
        </div>
        <p className="text-sm text-text-muted mt-2">{progress.message}</p>
      </div>

      <div className="space-y-2">
        {STAGE_CONFIG.map((stage, idx) => {
          const status = getStageStatus(idx);
          const Icon = stage.icon;
          const isActive = status === 'active';
          const isDone = status === 'done';

          return (
            <div
              key={stage.key}
              className={clsx(
                'flex items-center gap-3 p-3 rounded-xl transition-all duration-300',
                isActive && 'bg-brand-primary/10 border border-brand-primary/30',
                isDone && 'opacity-60',
                status === 'pending' && 'opacity-40'
              )}
            >
              <div
                className={clsx(
                  'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all',
                  isDone && 'bg-success/20',
                  isActive && 'bg-brand-primary/20 animate-pulse-glow',
                  status === 'pending' && 'bg-border-subtle'
                )}
              >
                {isDone ? (
                  <CheckCircle2 className="w-5 h-5 text-success" />
                ) : (
                  <Icon
                    className={clsx(
                      'w-4 h-4',
                      isActive ? 'text-brand-primary' : 'text-text-muted',
                      isActive && stage.key !== 'uploading' && stage.key !== 'analyzing' && stage.key !== 'packaging' && stage.key !== 'done' && 'animate-pulse'
                    )}
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p
                    className={clsx(
                      'text-sm font-medium',
                      isActive && 'text-brand-primary',
                      isDone && 'text-text-secondary',
                      status === 'pending' && 'text-text-muted'
                    )}
                  >
                    {stage.label}
                  </p>
                  {isActive && idx < STAGE_CONFIG.length - 1 && (
                    <span className="text-xs font-mono text-brand-primary">
                      {progress.stageProgress.toFixed(0)}%
                    </span>
                  )}
                  {isDone && <span className="text-xs text-success">完成</span>}
                </div>
                {isActive && idx < STAGE_CONFIG.length - 1 && (
                  <div className="mt-1.5 h-1 bg-border-subtle rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-gradient rounded-full transition-all duration-300"
                      style={{ width: `${progress.stageProgress}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {progress.completedResolutions.length > 0 && (
        <div className="pt-4 border-t border-border-subtle animate-fade-in">
          <p className="text-sm font-medium text-text-secondary mb-3">已完成分辨率</p>
          <div className="flex flex-wrap gap-2">
            {progress.completedResolutions.map((res) => (
              <span
                key={res}
                className="chip bg-success/15 text-success border border-success/30 text-xs"
              >
                ✓ {res}
              </span>
            ))}
          </div>
        </div>
      )}

      {isComplete && (
        <div className="pt-4 border-t border-border-subtle animate-fade-in">
          <div className="rounded-xl bg-success/10 border border-success/30 p-4">
            <p className="text-success font-medium mb-1">🎉 视频处理完成</p>
            <p className="text-sm text-text-muted">
              所有分辨率转码完成，视频已可播放。系统已生成 HLS 自适应流。
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
