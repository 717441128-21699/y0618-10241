import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Film, Search, Upload, User, LogOut, Menu, X, PlayCircle, Sparkles,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

const NAV_LINKS = [
  { to: '/', label: '首页', icon: PlayCircle },
];

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/?search=${encodeURIComponent(search.trim())}`);
    } else {
      navigate('/');
    }
    setMenuOpen(false);
  };

  const onUploadClick = () => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/upload');
    } else {
      navigate('/upload');
    }
    setMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-2xl bg-bg-primary/70 border-b border-border-subtle">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
        <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-brand-gradient flex items-center justify-center shadow-glow-sm group-hover:shadow-glow-md transition-shadow">
              <Film size={20} className="text-white" />
            </div>
            <Sparkles size={12} className="absolute -top-1 -right-1 text-accent-pink animate-float" />
          </div>
          <span className="font-display text-xl font-bold gradient-text hidden sm:block">
            CloudStream
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 ml-2">
          {NAV_LINKS.map(l => (
            <Link
              key={l.to}
              to={l.to}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                location.pathname === l.to
                  ? 'bg-brand-gradient/15 text-brand-300'
                  : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <l.icon size={16} />
                {l.label}
              </span>
            </Link>
          ))}
        </nav>

        <form onSubmit={onSearch} className="flex-1 max-w-lg ml-auto hidden sm:block">
          <div className="relative group">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-brand-400 transition-colors" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索视频、创作者..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-bg-tertiary/40 border border-border-default
                         text-sm text-text-primary placeholder:text-text-muted
                         focus:outline-none focus:border-brand-500 focus:bg-bg-tertiary/60 focus:shadow-glow-sm
                         transition-all"
            />
          </div>
        </form>

        <div className="flex items-center gap-2 ml-auto sm:ml-0">
          <button
            onClick={onUploadClick}
            className="btn-primary !py-2 !px-4 text-sm flex items-center gap-1.5"
          >
            <Upload size={16} />
            <span className="hidden sm:inline">上传视频</span>
          </button>

          {isAuthenticated ? (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(o => !o)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-white/5 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-brand-gradient flex items-center justify-center text-white font-semibold text-sm shadow-glow-sm">
                  {user?.avatar ? (
                    <img src={user.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <User size={16} />
                  )}
                </div>
                <span className="hidden md:block text-sm font-medium text-text-secondary max-w-[100px] truncate">
                  {user?.username}
                </span>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 glass-panel p-2 animate-fade-in z-50">
                  <div className="px-3 py-2 border-b border-border-subtle mb-1">
                    <p className="text-sm font-semibold text-text-primary truncate">{user?.username}</p>
                    <p className="text-xs text-text-muted truncate">{user?.email}</p>
                  </div>
                  <button
                    onClick={() => { logout(); setUserMenuOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left rounded-lg text-text-secondary hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut size={16} /> 退出登录
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="btn-secondary !py-2 !px-4 text-sm"
            >
              登录
            </Link>
          )}

          <button
            className="md:hidden p-2 rounded-xl hover:bg-white/5"
            onClick={() => setMenuOpen(o => !o)}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-border-subtle px-4 py-4 space-y-3 animate-fade-in">
          <form onSubmit={onSearch}>
            <div className="relative">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索视频..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-bg-tertiary/40 border border-border-default text-sm focus:outline-none focus:border-brand-500"
              />
            </div>
          </form>
          {NAV_LINKS.map(l => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setMenuOpen(false)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm ${
                location.pathname === l.to
                  ? 'bg-brand-gradient/15 text-brand-300'
                  : 'text-text-secondary'
              }`}
            >
              <l.icon size={18} /> {l.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
