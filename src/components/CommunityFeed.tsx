import { useEffect, useState } from 'react';
import { Heart, Flame, Laugh, Sparkles, Download, Share2 } from 'lucide-react';
import Card from './Card';
import Button from './Button';
import { supabase, isSupabaseConfigured, MemeRow } from '../utils/supabase';

interface Meme {
  id: string;
  imageUrl: string;
  topText: string;
  bottomText: string;
  author: string;
  timestamp: Date;
  reactions: {
    laugh: number;
    fire: number;
    heart: number;
    wow: number;
  };
}

const PAGE_SIZE = 6;

const CommunityFeed = () => {
  const [memes, setMemes] = useState<Meme[]>([]);
  const [userReactions, setUserReactions] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;
    // initial load
    void fetchPage(0, true);
  }, []);

  const fetchPage = async (pageIndex: number, replace = false) => {
    if (!supabase) return;
    setLoading(true);
    setError('');
    try {
      const from = pageIndex * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const { data, error: dbError } = await supabase
        .from('memes')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, to);
      if (dbError) throw dbError;
      const mapped: Meme[] = (data as MemeRow[]).map((row) => ({
        id: row.id,
        imageUrl: row.image_url,
        topText: row.top_text ?? '',
        bottomText: row.bottom_text ?? '',
        author: 'Anonymous',
        timestamp: new Date(row.created_at),
        reactions: { laugh: row.reactions_count ?? 0, fire: 0, heart: 0, wow: 0 }
      }));
      setMemes((prev) => (replace ? mapped : [...prev, ...mapped]));
      setHasMore((data?.length ?? 0) === PAGE_SIZE);
      setPage(pageIndex);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load feed');
    } finally {
      setLoading(false);
    }
  };

  const handleReaction = (memeId: string, reactionType: string) => {
    setUserReactions((prev) => ({
      ...prev,
      [memeId]: prev[memeId] === reactionType ? '' : reactionType
    }));
  };

  const getTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const reactions = [
    { type: 'laugh', icon: Laugh, color: 'text-yellow-400' },
    { type: 'fire', icon: Flame, color: 'text-orange-500' },
    { type: 'heart', icon: Heart, color: 'text-pink-500' },
    { type: 'wow', icon: Sparkles, color: 'text-purple-400' }
  ];

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div className="text-center space-y-4">
        <h2 className="text-4xl md:text-5xl font-bold text-gradient">
          Community Memes
        </h2>
        <p className="text-gray-400 text-lg">
          The funniest memes from our creative community
        </p>
      </div>

      <div className="space-y-6">
        {memes.map((meme) => (
          <Card key={meme.id} hover className="overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    {meme.author[0]}
                  </span>
                </div>
                <div>
                  <p className="font-semibold">{meme.author}</p>
                  <p className="text-sm text-gray-400">{getTimeAgo(meme.timestamp)}</p>
                </div>
              </div>
            </div>

            <div className="relative bg-gray-900 rounded-lg overflow-hidden mb-4">
              <img
                src={meme.imageUrl}
                alt="Community meme"
                className="w-full h-auto"
              />
              <div className="absolute top-0 left-0 right-0 p-4 text-center">
                <p className="text-white text-2xl font-bold" style={{
                  textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                  WebkitTextStroke: '2px black'
                }}>
                  {meme.topText}
                </p>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-4 text-center">
                <p className="text-white text-2xl font-bold" style={{
                  textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                  WebkitTextStroke: '2px black'
                }}>
                  {meme.bottomText}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {reactions.map(({ type, icon: Icon, color }) => {
                  const count = meme.reactions[type as keyof typeof meme.reactions];
                  const isActive = userReactions[meme.id] === type;

                  return (
                    <button
                      key={type}
                      onClick={() => handleReaction(meme.id, type)}
                      className={`flex items-center gap-1 px-3 py-2 rounded-full transition-all duration-300 ${
                        isActive
                          ? 'bg-purple-600/20 scale-110'
                          : 'bg-gray-800 hover:bg-gray-700'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? color : 'text-gray-400'}`} />
                      <span className={`text-sm font-medium ${isActive ? 'text-white' : 'text-gray-400'}`}>
                        {count + (isActive ? 1 : 0)}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2">
                <button className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors">
                  <Download className="w-4 h-4 text-gray-400" />
                </button>
                <button className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors">
                  <Share2 className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>
          </Card>
        ))}
        {loading && (
          <Card className="p-6 text-center text-gray-400">Loading…</Card>
        )}
        {error && (
          <Card className="p-6 text-center text-red-400">{error}</Card>
        )}
      </div>

      {isSupabaseConfigured && (
        <div className="text-center py-8">
          {!hasMore ? (
            <p className="text-gray-500">That's all for now!</p>
          ) : (
            <Button
              variant="outline"
              disabled={loading}
              onClick={() => fetchPage(page + 1)}
            >
              {loading ? 'Loading…' : 'Load More Memes'}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default CommunityFeed;
