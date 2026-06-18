import type { TranscodeProgress } from '../../../shared/types.js';
import { updateVideoStatus } from '../repositories/video.repo.js';
import { broadcastMessage } from '../websocket.js';

interface TranscodeTask {
  videoId: number;
  startTime: number;
  currentStage: TranscodeProgress['stage'];
  stageProgress: number;
  overallProgress: number;
  completedResolutions: string[];
  duration: number;
}

const STAGES: { name: TranscodeProgress['stage']; weight: number; message: string }[] = [
  { name: 'analyzing', weight: 0.05, message: '分析视频元数据...' },
  { name: 'transcoding_360p', weight: 0.25, message: '转码 360P 分辨率...' },
  { name: 'transcoding_720p', weight: 0.30, message: '转码 720P 分辨率...' },
  { name: 'transcoding_1080p', weight: 0.30, message: '转码 1080P 分辨率...' },
  { name: 'packaging', weight: 0.10, message: '生成 HLS 播放列表...' },
];

const taskQueue: TranscodeTask[] = [];
const processingTasks = new Map<number, TranscodeTask>();
const MAX_PARALLEL = 2;

let tickTimer: NodeJS.Timeout | null = null;

function startTicker() {
  if (tickTimer) return;
  tickTimer = setInterval(() => {
    while (processingTasks.size < MAX_PARALLEL && taskQueue.length > 0) {
      const task = taskQueue.shift()!;
      processingTasks.set(task.videoId, task);
    }
    for (const task of processingTasks.values()) {
      advanceTask(task);
    }
  }, 500);
}

function getElapsedWeight(task: TranscodeTask): number {
  const totalStageDuration = 12000 + task.duration * 20;
  const elapsed = Date.now() - task.startTime;
  return Math.min(1, elapsed / totalStageDuration);
}

function advanceTask(task: TranscodeTask) {
  if (task.currentStage === 'done') return;

  const weight = getElapsedWeight(task);
  let cumulative = 0;
  let currentStageIndex = -1;

  for (let i = 0; i < STAGES.length; i++) {
    const stage = STAGES[i];
    if (weight < cumulative + stage.weight) {
      currentStageIndex = i;
      const localProgress = (weight - cumulative) / stage.weight;
      task.currentStage = stage.name;
      task.stageProgress = Math.round(Math.min(100, localProgress * 100));
      task.overallProgress = Math.round(weight * 100);
      break;
    }
    cumulative += stage.weight;

    if (stage.name.startsWith('transcoding_')) {
      const res = stage.name.replace('transcoding_', '');
      if (!task.completedResolutions.includes(res)) {
        task.completedResolutions.push(res);
      }
    }
  }

  if (currentStageIndex === -1) {
    task.currentStage = 'done';
    task.stageProgress = 100;
    task.overallProgress = 100;
    task.completedResolutions = ['360p', '720p', '1080p'];
    finalizeTask(task);
  }

  const progress: TranscodeProgress = {
    videoId: task.videoId,
    stage: task.currentStage,
    stageProgress: task.stageProgress,
    overallProgress: task.overallProgress,
    completedResolutions: [...task.completedResolutions],
    message: task.currentStage === 'done' ? '转码完成！' : STAGES.find(s => s.name === task.currentStage)?.message || '',
  };

  broadcastMessage({
    type: 'transcode_progress',
    payload: progress,
  });
}

function finalizeTask(task: TranscodeTask) {
  const hls = {
    '360p': `/api/stream/${task.videoId}/360p.m3u8`,
    '720p': `/api/stream/${task.videoId}/720p.m3u8`,
    '1080p': `/api/stream/${task.videoId}/1080p.m3u8`,
  };
  updateVideoStatus(task.videoId, 'ready', hls);
  processingTasks.delete(task.videoId);
}

export function submitTranscode(videoId: number, duration: number): void {
  const task: TranscodeTask = {
    videoId,
    startTime: Date.now(),
    currentStage: 'uploading',
    stageProgress: 100,
    overallProgress: 0,
    completedResolutions: [],
    duration,
  };
  taskQueue.push(task);
  startTicker();

  setTimeout(() => {
    broadcastMessage({
      type: 'transcode_progress',
      payload: {
        videoId,
        stage: 'analyzing',
        stageProgress: 0,
        overallProgress: 2,
        completedResolutions: [],
        message: '分析视频元数据...',
      },
    });
  }, 300);
}

export function getTaskProgress(videoId: number): TranscodeProgress | null {
  const task = processingTasks.get(videoId);
  if (!task) return null;
  return {
    videoId: task.videoId,
    stage: task.currentStage,
    stageProgress: task.stageProgress,
    overallProgress: task.overallProgress,
    completedResolutions: [...task.completedResolutions],
    message: task.currentStage === 'done' ? '转码完成！' : STAGES.find(s => s.name === task.currentStage)?.message || '',
  };
}
