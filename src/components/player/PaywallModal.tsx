import { useState } from 'react';
import {
  Crown, Lock, Clock, CreditCard, Shield, X,
  CheckCircle2, Loader2, Sparkles
} from 'lucide-react';
import clsx from 'clsx';
import { formatPrice, formatTokenExpiry } from '../../utils/format';
import { Video, PlayAuthToken } from '../../../shared/types';

interface PaywallModalProps {
  video: Video;
  previewTime: number;
  previewLimit: number;
  onPurchase: (method: 'alipay' | 'wechat' | 'card') => Promise<PlayAuthToken>;
  onClose: () => void;
}

export default function PaywallModal({
  video, previewTime, previewLimit, onPurchase, onClose
}: PaywallModalProps) {
  const [method, setMethod] = useState<'alipay' | 'wechat' | 'card'>('wechat');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<PlayAuthToken | null>(null);

  const remaining = Math.max(0, previewLimit - previewTime);
  const pct = Math.min(100, (previewTime / previewLimit) * 100);

  const handlePurchase = async () => {
    setLoading(true);
    try {
      const token = await onPurchase(method);
      setSuccess(token);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
        <div className="w-full max-w-md card-base p-8 text-center animate-slide-up">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-success/15 flex items-center justify-center mb-5 glow-sm">
            <CheckCircle2 className="w-10 h-10 text-success animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold font-display text-text-primary mb-2">
            购买成功！
          </h2>
          <p className="text-text-muted mb-6">
            感谢您的支持，现在可以观看完整视频了
          </p>
          <div className="glass-panel rounded-xl p-4 mb-6 text-left space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-secondary">视频</span>
              <span className="text-text-primary font-medium truncate ml-2 max-w-[60%]">{video.title}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-secondary">有效期至</span>
              <span className="text-brand-primary font-mono font-medium">{formatTokenExpiry(success.expiresAt)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-secondary">Token</span>
              <span className="text-text-primary font-mono text-xs bg-bg-overlay px-2 py-1 rounded truncate max-w-[55%]">
                {success.token.slice(0, 16)}...
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn-primary w-full h-12 font-semibold inline-flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            继续观看完整视频
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="relative w-full max-w-md card-base overflow-hidden animate-slide-up">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-xl hover:bg-border-subtle flex items-center justify-center text-text-muted hover:text-text-primary transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="bg-gradient-to-br from-accent-primary/25 via-brand-primary/15 to-transparent p-6 pb-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-accent-gradient flex items-center justify-center shadow-lg glow-sm">
              <Crown className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-display text-text-primary">解锁完整内容</h2>
              <p className="text-text-muted text-sm">本视频为付费内容，购买后可完整观看</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5 -mt-1">
          <div className="rounded-xl bg-bg-overlay/60 border border-warning/20 p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-warning">
                <Clock className="w-4 h-4" />
                预览进度
              </span>
              <span className="font-mono text-text-primary font-medium">
                {Math.floor(previewTime)}s / {previewLimit}s
              </span>
            </div>
            <div className="h-2 bg-black/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-warning-gradient rounded-full transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-xs text-text-muted flex items-center gap-1.5">
              <Lock className="w-3 h-3" />
              还可免费观看 <span className="text-warning font-bold">{Math.ceil(remaining)}</span> 秒，升级解锁全部内容
            </p>
          </div>

          <div className="rounded-2xl bg-brand-primary/8 border-2 border-brand-primary/40 p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-primary/15 rounded-full -translate-y-8 translate-x-8" />
            <div className="relative flex items-end justify-between mb-4">
              <div>
                <p className="text-xs text-brand-primary font-medium mb-1.5">限时折扣</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold font-display gradient-text">
                    ¥{formatPrice(video.price)}
                  </span>
                  <span className="text-sm text-text-muted line-through">
                    ¥{formatPrice(video.price * 1.5)}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="chip bg-accent-gradient text-white text-xs px-3 py-1 shadow-md">
                  省 {formatPrice(video.price * 0.5)}
                </div>
              </div>
            </div>
            <div className="space-y-1.5 text-sm">
              {[
                '完整高清视频 1080P / 720P / 360P',
                '支持离线缓存 ＆ 无限次回看',
                '专属播放鉴权 Token（24小时）',
                '发送弹幕 ＆ 参与互动讨论',
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-text-secondary">
                  <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-text-secondary px-1">选择支付方式</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { k: 'wechat', label: '微信支付', c: '#07C160', emoji: '💚' },
                { k: 'alipay', label: '支付宝', c: '#1677FF', emoji: '💙' },
                { k: 'card', label: '银行卡', c: '#FF6B00', emoji: '💳' },
              ].map((m) => (
                <button
                  key={m.k}
                  onClick={() => setMethod(m.k as any)}
                  className={clsx(
                    'py-3 px-2 rounded-xl border-2 transition-all flex flex-col items-center gap-1',
                    method === m.k
                      ? 'border-brand-primary bg-brand-primary/10 shadow-md'
                      : 'border-border-subtle bg-bg-overlay/50 hover:border-border hover:bg-bg-overlay'
                  )}
                >
                  <span className="text-xl">{m.emoji}</span>
                  <span className="text-xs font-medium text-text-primary">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handlePurchase}
            disabled={loading}
            className="w-full h-12 rounded-xl font-semibold text-base text-white transition-all disabled:opacity-60 relative overflow-hidden group"
            style={{
              background: 'linear-gradient(135deg, #F59E0B 0%, #EF4444 50%, #8B5CF6 100%)',
            }}
          >
            <span className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity animate-pulse-glow" />
            <span className="relative flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  支付处理中...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  立即支付 ¥{formatPrice(video.price)}
                </>
              )}
            </span>
          </button>

          <div className="flex items-center justify-center gap-3 pt-1 text-xs text-text-muted">
            <span className="flex items-center gap-1">
              <Shield className="w-3.5 h-3.5" />
              安全加密支付
            </span>
            <span>·</span>
            <span>24小时内有效</span>
            <span>·</span>
            <span>7天无理由</span>
          </div>
        </div>
      </div>
    </div>
  );
}
