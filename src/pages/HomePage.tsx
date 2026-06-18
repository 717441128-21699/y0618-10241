import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Flame, Sparkles, TrendingUp, Clock, Search as SearchIcon, X,
} from 'lucide-react';
import type { Video, VideoCategory } from '../../shared/types';
import { VIDEO_CATEGORIES } from '../../shared/types';
import { getVideos, getFeaturedVideos } from '../api/video.api';
import VideoCard from '../components/layout/VideoCard';
import { formatDuration } from '../utils/format';

export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = (searchParams.get('category') as VideoCategory) || undefined;
  const initialSearch = searchParams.get('search') || '';

  const [category, setCategory] = useState<VideoCategory | undefined>(initialCategory);
  const [search, setSearch] = useState(initialSearch);
  const [videos, setVideos] = useState<Video[]>([]);
  const [featured, setFeatured] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFeatured, setActiveFeatured] = useState(0);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [listData, featuredData] = await Promise.all([
          getVideos({ category, search: search || undefined }),
          getFeaturedVideos().catch(() => ({ featured: [], recommended: [] })),
        ]);
        setVideos(listData.videos);
        setFeatured(featuredData.featured);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [category, search]);

  useEffect(() => {
    if (featured.length < 2) return;
    const t = setInterval(() => {
      setActiveFeatured(i => (i + 1) % featured.length);
    }, 5000);
    return () => clearInterval(t);
  }, [featured.length]);

  const applyFilter = (cat?: VideoCategory) => {
    setCategory(cat);
    const params: Record<string, string> = {};
    if (cat) params.category = cat;
    if (search) params.search = search;
    setSearchParams(params);
  };

  const clearSearch = () => {
    setSearch('');
    const params: Record<string, string> = {};
    if (category) params.category = category;
    setSearchParams(params);
  };

  const currentFeatured = featured[activeFeatured];

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-6 space-y-10">
      {featured.length > 0 && currentFeatured && (
        <section className="relative overflow-hidden rounded-3xl border border-border-default animate-fade-in">
          <div className="aspect-[21/9] sm:aspect-[24/9] relative">
            <img
              src={currentFeatured.coverUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover transition-all duration-1000"
              style={{ opacity: 0.55 }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-bg-primary/50 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-bg-primary/90 via-bg-primary/30 to-transparent" />

            <div className="absolute inset-0 flex items-end sm:items-center">
              <div className="p-6 sm:p-10 lg:p-14 max-w-2xl animate-slide-up">
                <div className="flex items-center gap-2 mb-4">
                  <span className="chip chip-active">
                    <Sparkles size={12} /> 精选推荐
                  </span>
                  <span className="chip !bg-bg-tertiary/60 text-text-secondary border border-border-subtle">
                    {VIDEO_CATEGORIES.find(c => c.value === currentFeatured.category)?.label}
                  </span>
                </div>
                <h1 className="heading-display text-2xl sm:text-4xl lg:text-5xl text-white mb-3 leading-tight">
                  {currentFeatured.title}
                </h1>
                <p className="text-text-secondary text-sm sm:text-base line-clamp-2 mb-6 max-w-xl">
                  {currentFeatured.description}
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <Link to={`/video/${currentFeatured.id}`} className="btn-primary flex items-center gap-2">
                    <div className="w-0 h-0 border-t-[7px] border-t-transparent border-b-[7px] border-b-transparent border-l-[10px] border-l-white" />
                    立即播放
                  </Link>
                  <div className="flex items-center gap-4 text-sm text-text-muted">
                    <span className="flex items-center gap-1">
                      <Clock size={14} /> {formatDuration(currentFeatured.duration)}
                    </span>
                    <span>{currentFeatured.author.username}</span>
                  </div>
                </div>
              </div>
            </div>

            {featured.length > 1 && (
              <div className="absolute bottom-5 right-6 flex items-center gap-2">
                {featured.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveFeatured(i)}
                    className={`h-1.5 rounded-full transition-all ${
                      i === activeFeatured ? 'w-8 bg-brand-gradient' : 'w-3 bg-white/30 hover:bg-white/50'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      <section className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h2 className="heading-display text-2xl sm:text-3xl flex items-center gap-2">
              <span className="text-accent-pink"><TrendingUp size={24} /></span>
              发现精彩内容
            </h2>
            <p className="text-text-muted text-sm mt-1">
              浏览最新、最热的优质视频内容
            </p>
          </div>

          {search && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-gradient/10 border border-brand-500/20 text-sm text-brand-300 self-start">
              <SearchIcon size={14} />
              搜索: "{search}"
              <button onClick={clearSearch} className="hover:text-white transition-colors ml-1">
                <X size={14} />
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => applyFilter(undefined)}
            className={`chip ${category === undefined ? 'chip-active' : 'chip-inactive'}`}
          >
            <Flame size={13} /> 全部
          </button>
          {VIDEO_CATEGORIES.map(cat => (
            <button
              key={cat.value}
              onClick={() => applyFilter(cat.value)}
              className={`chip ${category === cat.value ? 'chip-active' : 'chip-inactive'}`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="aspect-video skeleton" />
                <div className="h-4 skeleton w-4/5" />
                <div className="h-3 skeleton w-2/5" />
              </div>
            ))}
          </div>
        ) : videos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
            {videos.map((v, i) => (
              <VideoCard key={v.id} video={v} index={i} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 space-y-3">
            <div className="inline-flex w-16 h-16 rounded-2xl bg-bg-tertiary/50 items-center justify-center mb-2">
              <SearchIcon size={28} className="text-text-muted" />
            </div>
            <p className="text-lg font-medium text-text-secondary">暂无匹配的视频</p>
            <p className="text-sm text-text-muted">尝试更换分类或清除搜索条件</p>
            <button
              onClick={() => { applyFilter(undefined); clearSearch(); }}
              className="btn-secondary !py-2 mt-4"
            >
              查看全部视频
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
