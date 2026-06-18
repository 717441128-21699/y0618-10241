import { Link } from 'react-router-dom';
import { Eye, ThumbsUp, Clock, Crown } from 'lucide-react';
import type { Video } from '../../../shared/types';
import { formatDuration, formatCompactNumber, formatPrice } from '../../utils/format';
import { VIDEO_CATEGORIES } from '../../../shared/types';

interface Props {
  video: Video;
  index?: number;
  showDetails?: boolean;
}

export default function VideoCard({ video, index = 0, showDetails = true }: Props) {
  const categoryLabel = VIDEO_CATEGORIES.find(c => c.value === video.category)?.label || '';

  return (
    <Link
      to={`/video/${video.id}`}
      className="group block animate-slide-up"
      style={{ animationDelay: `${Math.min(index, 20) * 40}ms` }}
    >
      <div className="relative aspect-video rounded-2xl overflow-hidden bg-bg-tertiary border border-border-subtle
                      group-hover:border-border-strong transition-all duration-300
                      group-hover:shadow-card-hover group-hover:-translate-y-1">
        <img
          src={video.coverUrl}
          alt={video.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            (e.target as HTMLImageElement).style.visibility = 'hidden';
          }}
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-14 h-14 rounded-full bg-brand-gradient/90 backdrop-blur flex items-center justify-center shadow-glow-md transform scale-90 group-hover:scale-100 transition-transform">
            <div className="w-0 h-0 border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent border-l-[16px] border-l-white ml-1" />
          </div>
        </div>

        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
          {video.isPaid && (
            <span className="chip !py-0.5 !text-[11px] bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-glow-sm">
              <Crown size={11} />
              {formatPrice(video.price)}
            </span>
          )}
          {categoryLabel && (
            <span className="chip !py-0.5 !text-[11px] bg-black/50 backdrop-blur text-white/90 border border-white/10">
              {categoryLabel}
            </span>
          )}
        </div>

        <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5">
          <span className="chip !py-0.5 !text-[11px] bg-black/60 backdrop-blur text-white">
            <Clock size={11} />
            {formatDuration(video.duration)}
          </span>
        </div>
      </div>

      {showDetails && (
        <div className="mt-3 px-0.5 space-y-1.5">
          <h3 className="font-medium text-sm text-text-primary line-clamp-2 group-hover:text-brand-300 transition-colors leading-snug">
            {video.title}
          </h3>
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span className="truncate max-w-[55%]">{video.author.username}</span>
            <div className="flex items-center gap-3 shrink-0">
              <span className="flex items-center gap-1">
                <Eye size={12} /> {formatCompactNumber(video.viewCount)}
              </span>
              <span className="flex items-center gap-1">
                <ThumbsUp size={12} /> {formatCompactNumber(video.likeCount)}
              </span>
            </div>
          </div>
        </div>
      )}
    </Link>
  );
}
