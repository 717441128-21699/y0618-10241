import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  User, Mail, Lock, Eye, EyeOff, ArrowRight,
  Sparkles, LogIn, UserPlus, AlertCircle, CheckCircle2
} from 'lucide-react';
import clsx from 'clsx';
import { useAuthStore } from '../store/useAuthStore';
import { PlayCircle, Film, MessageSquare, Crown } from 'lucide-react';

type Mode = 'login' | 'register';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation() as any;
  const redirectTo = location.state?.from || '/';

  const { login, register, isAuthenticated, initAuth } = useAuthStore();
  const [mode, setMode] = useState<Mode>('login');
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, navigate, redirectTo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.username, form.password);
        setSuccess('登录成功，正在跳转...');
        setTimeout(() => navigate(redirectTo, { replace: true }), 600);
      } else {
        if (!form.email.includes('@')) {
          throw new Error('请输入有效的邮箱地址');
        }
        if (form.password.length < 6) {
          throw new Error('密码至少需要 6 位字符');
        }
        await register(form.username, form.email, form.password);
        setSuccess('注册成功，已自动登录！');
        setTimeout(() => navigate(redirectTo, { replace: true }), 800);
      }
    } catch (err: any) {
      setError(err.message || err.response?.data?.error || '操作失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = () => {
    setForm({ username: 'demo_user', email: 'demo@example.com', password: 'demo123' });
    setMode('login');
  };

  return (
    <div className="min-h-[calc(100vh-120px)] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-5 gap-8 items-center">
        <div className="lg:col-span-2 space-y-6 order-2 lg:order-1 animate-slide-up">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 chip bg-brand-primary/10 border-brand-primary/30 text-brand-primary">
              <Sparkles className="w-3.5 h-3.5" />
              <span className="font-medium">{mode === 'login' ? '欢迎回来' : '加入我们'}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold font-display text-text-primary leading-tight">
              {mode === 'login' ? (
                <>登录 CloudStream<br /><span className="gradient-text">开启精彩之旅</span></>
              ) : (
                <>创建账号<br /><span className="gradient-text">成为创作者</span></>
              )}
            </h1>
            <p className="text-text-muted">
              {mode === 'login'
                ? '登录后即可上传视频、发送弹幕、购买付费内容并同步您的观看进度。'
                : '立即注册，开启您的内容创作之旅，上传、分享、互动一站式搞定。'
              }
            </p>
          </div>

          <div className="glass-panel rounded-2xl p-5 space-y-4 border border-border-subtle">
            <h3 className="font-semibold text-text-primary text-sm flex items-center gap-2">
              <Film className="w-4 h-4 text-brand-primary" />
              平台亮点
            </h3>
            {[
              { icon: PlayCircle, text: 'HLS 自适应清晰度，流畅不卡顿' },
              { icon: MessageSquare, text: '实时弹幕互动，观看更有趣' },
              { icon: Crown, text: '付费内容变现，创作者激励' },
              { icon: '⏱', text: '多端同步进度，断点无缝续播' },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-lg bg-bg-overlay flex items-center justify-center shrink-0 text-brand-primary">
                  {typeof f.icon === 'string' ? (
                    <span>{f.icon}</span>
                  ) : (
                    <f.icon className="w-4 h-4" />
                  )}
                </div>
                <span className="text-text-secondary">{f.text}</span>
              </div>
            ))}
          </div>

          {mode === 'login' && (
            <button
              onClick={fillDemo}
              className="w-full h-11 rounded-xl border-2 border-dashed border-brand-primary/40 text-brand-primary hover:bg-brand-primary/10 transition-all text-sm font-medium inline-flex items-center justify-center gap-2"
            >
              🎯 使用演示账号一键登录（demo_user / demo123）
            </button>
          )}
        </div>

        <div className="lg:col-span-3 order-1 lg:order-2">
          <div className="card-base p-7 sm:p-8 relative overflow-hidden animate-fade-in">
            <div className="absolute -top-20 -right-20 w-60 h-60 bg-brand-primary/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-accent-primary/10 rounded-full blur-3xl" />

            <div className="relative">
              <div className="flex rounded-xl bg-bg-overlay p-1 mb-7">
                {([
                  { k: 'login', label: '登录', Icon: LogIn },
                  { k: 'register', label: '注册', Icon: UserPlus },
                ] as const).map(({ k, label, Icon }) => (
                  <button
                    key={k}
                    onClick={() => { setMode(k); setError(null); setSuccess(null); }}
                    className={clsx(
                      'flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2',
                      mode === k
                        ? 'bg-brand-gradient text-white shadow-md'
                        : 'text-text-secondary hover:text-text-primary'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>

              {error && (
                <div className="mb-5 rounded-xl border border-error/30 bg-error/10 p-3.5 flex items-start gap-3 animate-fade-in">
                  <AlertCircle className="w-5 h-5 text-error shrink-0 mt-0.5" />
                  <p className="text-sm text-error">{error}</p>
                </div>
              )}
              {success && (
                <div className="mb-5 rounded-xl border border-success/30 bg-success/10 p-3.5 flex items-start gap-3 animate-fade-in">
                  <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
                  <p className="text-sm text-success">{success}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">用户名</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-text-muted" />
                    <input
                      type="text"
                      value={form.username}
                      onChange={(e) => setForm({ ...form, username: e.target.value })}
                      placeholder="请输入用户名"
                      className="input-base w-full h-12 pl-11"
                      required
                      autoComplete="username"
                    />
                  </div>
                </div>

                {mode === 'register' && (
                  <div className="animate-fade-in">
                    <label className="block text-sm font-medium text-text-secondary mb-1.5">邮箱</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-text-muted" />
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="请输入邮箱地址"
                        className="input-base w-full h-12 pl-11"
                        required
                        autoComplete="email"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">密码</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-text-muted" />
                    <input
                      type={showPwd ? 'text' : 'password'}
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      placeholder={mode === 'login' ? '请输入密码' : '至少 6 位字符'}
                      className="input-base w-full h-12 pl-11 pr-11"
                      required
                      minLength={mode === 'register' ? 6 : undefined}
                      autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd(!showPwd)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg hover:bg-border-subtle flex items-center justify-center text-text-muted hover:text-text-primary transition-colors"
                    >
                      {showPwd ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm pt-1">
                  <label className="flex items-center gap-2 text-text-secondary cursor-pointer select-none">
                    <input type="checkbox" className="w-4 h-4 rounded border-border text-brand-primary focus:ring-brand-primary/30" defaultChecked />
                    7天内自动登录
                  </label>
                  {mode === 'login' && (
                    <a href="#" className="text-brand-primary hover:text-brand-primary/80 font-medium">
                      忘记密码？
                    </a>
                  )}
                </div>

                {mode === 'register' && (
                  <label className="flex items-start gap-2 text-xs text-text-muted cursor-pointer select-none">
                    <input type="checkbox" className="w-4 h-4 mt-0.5 rounded border-border text-brand-primary focus:ring-brand-primary/30" required />
                    <span>
                      我已阅读并同意
                      <a href="#" className="text-brand-primary mx-1 hover:underline">《用户协议》</a>
                      和
                      <a href="#" className="text-brand-primary mx-1 hover:underline">《隐私政策》</a>
                    </span>
                  </label>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full h-12 text-base font-semibold disabled:opacity-60 inline-flex items-center justify-center gap-2 mt-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      处理中...
                    </>
                  ) : (
                    <>
                      {mode === 'login' ? '立即登录' : '创建账号'}
                      <ArrowRight className="w-4.5 h-4.5" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 pt-5 border-t border-border-subtle">
                <div className="flex items-center gap-3 text-xs text-text-muted mb-4">
                  <div className="flex-1 h-px bg-border-subtle" />
                  <span>或使用第三方账号</span>
                  <div className="flex-1 h-px bg-border-subtle" />
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { name: 'GitHub', emoji: '🐙', c: '#24292E' },
                    { name: '微信', emoji: '💚', c: '#07C160' },
                    { name: 'Google', emoji: '🔵', c: '#4285F4' },
                  ].map((p) => (
                    <button
                      key={p.name}
                      type="button"
                      className="h-11 rounded-xl border border-border-subtle bg-bg-overlay/50 hover:bg-bg-overlay hover:border-border transition-all flex items-center justify-center gap-1.5 text-sm text-text-secondary hover:text-text-primary"
                    >
                      <span>{p.emoji}</span>
                      <span className="hidden sm:inline">{p.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <p className="mt-6 text-center text-sm text-text-secondary">
                {mode === 'login' ? (
                  <>还没有账号？
                    <button
                      onClick={() => { setMode('register'); setError(null); }}
                      className="text-brand-primary font-semibold hover:underline ml-1"
                    >
                      立即注册
                    </button>
                  </>
                ) : (
                  <>已有账号？
                    <button
                      onClick={() => { setMode('login'); setError(null); }}
                      className="text-brand-primary font-semibold hover:underline ml-1"
                    >
                      立即登录
                    </button>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
