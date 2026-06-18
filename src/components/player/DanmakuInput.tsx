import { useState } from 'react';
import {
  MessageSquare, Send, Settings, X, Eye, EyeOff,
  Palette, Type, Layers, Sliders
} from 'lucide-react';
import clsx from 'clsx';
import { usePlayerStore } from '../../store/usePlayerStore';
import { useAuthStore } from '../../store/useAuthStore';
import { formatDuration } from '../../utils/format';

interface DanmakuInputProps {
  currentTime: number;
  onSend: (content: string, color: string, fontSize: 'small' | 'medium' | 'large') => void;
  disabled?: boolean;
}

const PRESET_COLORS = [
  '#FFFFFF', '#FF0000', '#FF6600', '#FFCC00',
  '#00FF00', '#00FFFF', '#0000FF', '#CC00FF',
  '#FF69B4', '#8B4513', '#808080', '#000000',
];

const PRESET_MESSAGES = [
  '哈哈哈笑死', '666666', '太精彩了！', '前方高能',
  '学到了', '好棒👍', 'AWSL', '泪目了',
  '再来一遍', 'up主加油', '名场面', '弹幕护体',
];

export default function DanmakuInput({ currentTime, onSend, disabled }: DanmakuInputProps) {
  const [content, setContent] = useState('');
  const [showPanel, setShowPanel] = useState(false);
  const [tempColor, setTempColor] = useState('#FFFFFF');
  const [tempSize, setTempSize] = useState<'small' | 'medium' | 'large'>('medium');

  const { user, isAuthenticated } = useAuthStore();
  const {
    danmakuEnabled, toggleDanmaku, danmakuOpacity, danmakuFontSize, danmakuDensity,
    setDanmakuOpacity, setDanmakuFontSize, setDanmakuDensity,
  } = usePlayerStore();

  const handleSend = () => {
    if (!content.trim() || disabled) return;
    onSend(content.trim(), tempColor, tempSize);
    setContent('');
  };

  const handlePresetClick = (msg: string) => {
    if (disabled) return;
    onSend(msg, tempColor, tempSize);
  };

  return (
    <div className="bg-bg-card border-t border-border-subtle">
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={toggleDanmaku}
              className={clsx(
                'w-9 h-9 rounded-lg flex items-center justify-center transition-all',
                danmakuEnabled
                  ? 'bg-brand-primary/15 text-brand-primary hover:bg-brand-primary/25'
                  : 'bg-bg-overlay text-text-muted hover:text-text-secondary'
              )}
              title={danmakuEnabled ? '关闭弹幕' : '开启弹幕'}
            >
              {danmakuEnabled ? <Eye className="w-4.5 h-4.5" /> : <EyeOff className="w-4.5 h-4.5" />}
            </button>
            <button
              onClick={() => setShowPanel(!showPanel)}
              className={clsx(
                'w-9 h-9 rounded-lg flex items-center justify-center transition-all',
                showPanel
                  ? 'bg-accent-primary/15 text-accent-primary hover:bg-accent-primary/25'
                  : 'bg-bg-overlay text-text-muted hover:text-text-secondary'
              )}
              title="弹幕设置"
            >
              <Settings className="w-4.5 h-4.5" />
            </button>
          </div>

          <div className="relative flex-1">
            <MessageSquare className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-text-muted shrink-0" />
            <input
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, 60))}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={
                !isAuthenticated
                  ? '登录后可发送弹幕'
                  : disabled
                  ? '请先购买后发送弹幕'
                  : `在 ${formatDuration(currentTime)} 发送友善的弹幕...`
              }
              className="input-base pl-10 pr-12 h-10 text-sm"
              maxLength={60}
              disabled={!isAuthenticated || disabled}
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-text-muted pointer-events-none font-mono">
              {content.length}/60
            </span>
          </div>

          <div className="w-8 h-8 rounded-lg shrink-0 overflow-hidden border border-border-subtle" style={{ backgroundColor: tempColor }} />

          <button
            onClick={handleSend}
            disabled={!content.trim() || !isAuthenticated || disabled}
            className="btn-primary h-10 px-4 text-sm shrink-0 inline-flex items-center gap-1.5 disabled:opacity-40"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">发送</span>
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5 pl-11">
          {PRESET_MESSAGES.map((msg) => (
            <button
              key={msg}
              onClick={() => handlePresetClick(msg)}
              disabled={!isAuthenticated || disabled}
              className="chip bg-bg-overlay text-text-secondary text-xs hover:text-text-primary hover:bg-border-subtle disabled:opacity-40"
            >
              {msg}
            </button>
          ))}
        </div>
      </div>

      {showPanel && (
        <div className="px-4 pb-4 animate-fade-in">
          <div className="glass-panel p-4 space-y-5 rounded-xl border border-border-subtle">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-accent-primary" />
                <h4 className="font-semibold text-text-primary text-sm">弹幕设置</h4>
              </div>
              <button
                onClick={() => setShowPanel(false)}
                className="w-7 h-7 rounded-md hover:bg-border-subtle flex items-center justify-center text-text-muted hover:text-text-primary transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-text-secondary">
                  <Palette className="w-4 h-4" />
                  发送颜色
                </label>
                <span className="text-xs text-text-muted font-mono">{tempColor}</span>
              </div>
              <div className="grid grid-cols-12 gap-1.5">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setTempColor(c)}
                    className={clsx(
                      'aspect-square rounded-md border-2 transition-all hover:scale-110',
                      tempColor === c ? 'border-brand-primary scale-110 shadow-md' : 'border-transparent'
                    )}
                    style={{ backgroundColor: c }}
                    title={c}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-text-secondary">
                  <Type className="w-4 h-4" />
                  发送字号
                </label>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(['small', 'medium', 'large'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setTempSize(s)}
                    className={clsx(
                      'py-2 rounded-lg border text-sm transition-all',
                      tempSize === s
                        ? 'border-brand-primary bg-brand-primary/10 text-brand-primary font-medium'
                        : 'border-border-subtle text-text-secondary hover:border-border hover:text-text-primary'
                    )}
                  >
                    {s === 'small' ? '小' : s === 'medium' ? '中' : '大'}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-text-secondary">
                  <OpacityIcon />
                  显示不透明度
                </label>
                <span className="text-xs text-text-muted font-mono">{danmakuOpacity}%</span>
              </div>
              <input
                type="range"
                min={20}
                max={100}
                step={5}
                value={danmakuOpacity}
                onChange={(e) => setDanmakuOpacity(parseInt(e.target.value))}
                className="range-slider w-full"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-text-secondary">
                  <Type className="w-4 h-4" />
                  显示字号
                </label>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(['small', 'medium', 'large'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setDanmakuFontSize(s)}
                    className={clsx(
                      'py-2 rounded-lg border text-sm transition-all',
                      danmakuFontSize === s
                        ? 'border-accent-primary bg-accent-primary/10 text-accent-primary font-medium'
                        : 'border-border-subtle text-text-secondary hover:border-border hover:text-text-primary'
                    )}
                  >
                    {s === 'small' ? '小' : s === 'medium' ? '中' : '大'}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-text-secondary">
                  <Layers className="w-4 h-4" />
                  弹幕密度
                </label>
                <span className="text-xs text-text-muted font-mono">{danmakuDensity}%</span>
              </div>
              <input
                type="range"
                min={30}
                max={100}
                step={5}
                value={danmakuDensity}
                onChange={(e) => setDanmakuDensity(parseInt(e.target.value))}
                className="range-slider w-full"
              />
              <div className="flex justify-between text-xs text-text-muted">
                <span>稀疏</span>
                <span>适中</span>
                <span>密集</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function OpacityIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3c0 0-7 7-7 12a7 7 0 0014 0c0-5-7-12-7-12z" opacity="0.4" />
      <path d="M12 3c0 0-7 7-7 12a7 7 0 007 7" strokeLinecap="round" />
    </svg>
  );
}
