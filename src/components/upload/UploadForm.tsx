import { useState } from 'react';
import { VIDEO_CATEGORIES, VideoCategory } from '../../../shared/types';
import { Sparkles } from 'lucide-react';

interface UploadFormData {
  title: string;
  description: string;
  category: VideoCategory;
  isPaid: boolean;
  price: number;
}

interface UploadFormProps {
  onSubmit: (data: UploadFormData) => void;
  disabled: boolean;
  loading: boolean;
}

export default function UploadForm({ onSubmit, disabled, loading }: UploadFormProps) {
  const [form, setForm] = useState<UploadFormData>({
    title: '',
    description: '',
    category: 'tech',
    isPaid: false,
    price: 9.9,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="card-base p-6 space-y-5">
      <div className="flex items-center gap-3 mb-1">
        <div className="w-8 h-8 rounded-lg bg-accent-gradient flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <h3 className="text-lg font-bold text-text-primary font-display">视频信息</h3>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">
          视频标题 <span className="text-error">*</span>
        </label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="给你的视频起一个吸引人的标题..."
          disabled={disabled}
          className="input-base w-full"
          maxLength={100}
        />
        <p className="text-xs text-text-muted mt-1 text-right">{form.title.length}/100</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">
          视频简介
        </label>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="详细描述视频内容，帮助观众更好地了解..."
          disabled={disabled}
          rows={4}
          className="input-base w-full resize-none"
          maxLength={500}
        />
        <p className="text-xs text-text-muted mt-1 text-right">{form.description.length}/500</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">
          分类
        </label>
        <div className="flex flex-wrap gap-2">
          {VIDEO_CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => setForm({ ...form, category: cat.value })}
              disabled={disabled}
              className={`chip px-4 py-2 transition-all ${
                form.category === cat.value
                  ? 'bg-brand-gradient text-white shadow-md'
                  : 'bg-bg-card text-text-secondary hover:text-text-primary hover:bg-border-subtle'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div className="pt-3 border-t border-border-subtle">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="font-medium text-text-primary">付费观看</p>
            <p className="text-xs text-text-muted">开启后用户需要购买才能观看完整视频</p>
          </div>
          <button
            type="button"
            onClick={() => setForm({ ...form, isPaid: !form.isPaid })}
            disabled={disabled}
            className={`relative w-14 h-8 rounded-full transition-all duration-300 ${
              form.isPaid ? 'bg-brand-primary' : 'bg-border-subtle'
            }`}
          >
            <span
              className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300 ${
                form.isPaid ? 'left-7' : 'left-1'
              }`}
            />
          </button>
        </div>

        {form.isPaid && (
          <div className="animate-fade-in">
            <label className="block text-sm font-medium text-text-secondary mb-2">
              定价（元）
            </label>
            <div className="flex flex-wrap gap-2">
              {[1.99, 4.99, 9.9, 19.9, 29.9, 49.9].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setForm({ ...form, price: p })}
                  disabled={disabled}
                  className={`chip px-4 py-2 transition-all ${
                    Math.abs(form.price - p) < 0.01
                      ? 'bg-accent-gradient text-white shadow-md'
                      : 'bg-bg-card text-text-secondary hover:text-text-primary'
                  }`}
                >
                  ¥{p.toFixed(p < 10 && p % 1 !== 0 ? 2 : 1)}
                </button>
              ))}
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">¥</span>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="999"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
                  disabled={disabled}
                  className="input-base w-28 pl-7 py-2"
                />
              </div>
            </div>
            <p className="text-xs text-text-muted mt-2">💡 付费视频支持60秒免费预览</p>
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={disabled || !form.title.trim() || loading}
        className="btn-primary w-full h-12 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            上传中...
          </span>
        ) : (
          '开始上传并转码'
        )}
      </button>
    </form>
  );
}
