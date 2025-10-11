import { useEffect, useState } from 'react';
import { Heart, Flame, Laugh, Sparkles, Download, Share2, Wand2, Wifi, WifiOff } from 'lucide-react';
import Card from './Card';
import Button from './Button';
import { supabase, isSupabaseConfigured, MemeRow } from '../utils/supabase';
import { supabaseHealthCheck } from '../utils/healthCheck';

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
  const [sortBy, setSortBy] = useState<'new' | 'mostReacted' | 'trending'>('new');
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({});
  const [commentsByMeme, setCommentsByMeme] = useState<Record<string, { id: string; author: string | null; content: string; created_at: string }[]>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [commentLoading, setCommentLoading] = useState<Record<string, boolean>>({});
  const [supabaseOnline, setSupabaseOnline] = useState<boolean | null>(null);

  // Load memes from local storage as fallback
  const loadLocalMemes = () => {
    try {
      console.log('Loading local memes...');
      const localMemes = localStorage.getItem('memegen_local_memes');
      console.log('Local memes from storage:', localMemes);
      if (localMemes) {
        const parsedMemes: Meme[] = JSON.parse(localMemes).map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        }));
        console.log('Parsed memes:', parsedMemes);
        setMemes(parsedMemes);
        setHasMore(false); // No pagination for local storage
      } else {
        console.log('No local memes found');
        setMemes([]);
        setHasMore(false);
      }
    } catch (error) {
      console.error('Failed to load local memes:', error);
      setMemes([]);
      setHasMore(false);
    }
  };

  useEffect(() => {
    console.log('CommunityFeed useEffect triggered, isSupabaseConfigured:', isSupabaseConfigured);
    if (!isSupabaseConfigured || !supabase) {
      console.log('Loading local memes as fallback');
      setSupabaseOnline(false);
      // Load from local storage as fallback
      loadLocalMemes();
      return;
    }
    console.log('Loading from Supabase');
    setSupabaseOnline(true);
    void fetchPage(0, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy]);

  // Check Supabase status periodically
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const checkStatus = async () => {
      const isOnline = await supabaseHealthCheck.manualCheck();
      setSupabaseOnline(isOnline);
    };

    // Check immediately
    checkStatus();
    
    // Then check every 30 seconds
    const interval = setInterval(checkStatus, 30000);
    
    return () => clearInterval(interval);
  }, [isSupabaseConfigured]);

  const fetchPage = async (pageIndex: number, replace = false) => {
    if (!supabase) return;
    setLoading(true);
    setError('');
    try {
      const from = pageIndex * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      let query = supabase
        .from('memes')
        .select('*');
      if (sortBy === 'new') {
        query = query.order('created_at', { ascending: false });
      } else if (sortBy === 'mostReacted') {
        query = query.order('reactions_count', { ascending: false }).order('created_at', { ascending: false });
      } else {
        // trending: fetch recent items (by created_at desc) and sort client-side by score
        query = query.order('created_at', { ascending: false });
      }
      const { data, error: dbError } = await query.range(from, to);
      if (dbError) throw dbError;
      let mapped: Meme[] = (data as MemeRow[]).map((row) => ({
        id: row.id,
        imageUrl: row.image_url,
        topText: row.top_text ?? '',
        bottomText: row.bottom_text ?? '',
        author: 'Anonymous',
        timestamp: new Date(row.created_at),
        reactions: { laugh: row.reactions_count ?? 0, fire: 0, heart: 0, wow: 0 }
      }));
      if (sortBy === 'trending') {
        const now = Date.now();
        const score = (m: Meme) => {
          const hours = Math.max(1, (now - m.timestamp.getTime()) / (1000 * 60 * 60));
          const total = Object.values(m.reactions).reduce((a, b) => a + b, 0);
          return total / Math.pow(hours + 2, 1.5);
        };
        mapped = mapped.sort((a, b) => score(b) - score(a));
      }
      setMemes((prev) => (replace ? mapped : [...prev, ...mapped]));
      setHasMore((data?.length ?? 0) === PAGE_SIZE);
      setPage(pageIndex);
    } catch (e: any) {
      console.error('Supabase fetch failed, falling back to local storage:', e);
      // If Supabase fails, fall back to local storage
      loadLocalMemes();
      setError('Connection to online community failed. Showing local memes instead.');
    } finally {
      setLoading(false);
    }
  };

  const handleReaction = async (memeId: string, reactionType: string) => {
    // Find meme index
    const idx = memes.findIndex((m) => m.id === memeId);
    if (idx === -1) return;

    const prevUserReactions = { ...userReactions };
    const previousType = prevUserReactions[memeId] || '';
    const nextType = previousType === reactionType ? '' : reactionType;

    // Prepare optimistic state updates
    const prevMemes = [...memes];
    const meme = { ...prevMemes[idx] };
    const reactionsObj = { ...meme.reactions } as Record<string, number>;

    // Calculate delta for total reactions
    let delta = 0;
    if (previousType === '' && nextType !== '') {
      delta = 1; // new reaction
      reactionsObj[nextType] = (reactionsObj[nextType] || 0) + 1;
    } else if (previousType !== '' && nextType === '') {
      delta = -1; // removed reaction
      reactionsObj[previousType] = Math.max(0, (reactionsObj[previousType] || 0) - 1);
    } else if (previousType !== nextType) {
      // switched reaction type, total unchanged
      reactionsObj[previousType] = Math.max(0, (reactionsObj[previousType] || 0) - 1);
      reactionsObj[nextType] = (reactionsObj[nextType] || 0) + 1;
    }

    // Optimistically update UI
    meme.reactions = reactionsObj as typeof meme.reactions;
    const newMemes = [...prevMemes];
    newMemes[idx] = meme;
    setMemes(newMemes);
    setUserReactions((prev) => ({ ...prev, [memeId]: nextType }));

    // Persist reactions
    if (delta !== 0) {
      if (isSupabaseConfigured && supabase) {
        // Save to Supabase
        try {
          const total = Object.values(reactionsObj).reduce((a, b) => a + b, 0);
          const { error: updError } = await supabase
            .from('memes')
            .update({ reactions_count: total })
            .eq('id', memeId);
          if (updError) throw updError;
        } catch (e) {
          // rollback on error
          setMemes(prevMemes);
          setUserReactions(prevUserReactions);
          console.error('Failed to update reaction:', e);
        }
      } else {
        // Save to local storage as fallback
        try {
          const updatedMemes = [...memes];
          const memeIndex = updatedMemes.findIndex(m => m.id === memeId);
          if (memeIndex !== -1) {
            updatedMemes[memeIndex] = meme;
            localStorage.setItem('memegen_local_memes', JSON.stringify(updatedMemes));
          }
        } catch (e) {
          // rollback on error
          setMemes(prevMemes);
          setUserReactions(prevUserReactions);
          console.error('Failed to save reaction locally:', e);
        }
      }
    }
  };

  const fetchComments = async (memeId: string) => {
    if (!isSupabaseConfigured || !supabase) return;
    setCommentLoading((prev) => ({ ...prev, [memeId]: true }));
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('meme_id', memeId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setCommentsByMeme((prev) => ({ ...prev, [memeId]: (data as any[]) as any }));
    } catch (e) {
      console.error('Failed to load comments', e);
    } finally {
      setCommentLoading((prev) => ({ ...prev, [memeId]: false }));
    }
  };

  const handleToggleComments = (memeId: string) => {
    setOpenComments((prev) => {
      const next = { ...prev, [memeId]: !prev[memeId] };
      if (next[memeId] && !commentsByMeme[memeId]) {
        void fetchComments(memeId);
      }
      return next;
    });
  };

  const handleAddComment = async (memeId: string) => {
    const content = (commentInputs[memeId] || '').trim();
    if (!content) return;
    const optimistic = {
      id: `temp-${Date.now()}`,
      meme_id: memeId,
      author: 'Guest',
      content,
      created_at: new Date().toISOString()
    } as any;
    const prevList = commentsByMeme[memeId] || [];
    setCommentsByMeme((prev) => ({ ...prev, [memeId]: [optimistic, ...prevList] }));
    setCommentInputs((prev) => ({ ...prev, [memeId]: '' }));

    if (!isSupabaseConfigured || !supabase) return;
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({ meme_id: memeId, content, author: 'Guest' })
        .select('*')
        .single();
      if (error) throw error;
      setCommentsByMeme((prev) => ({
      ...prev,
        [memeId]: [data as any, ...prevList]
      }));
    } catch (e) {
      // rollback
      setCommentsByMeme((prev) => ({ ...prev, [memeId]: prevList }));
      setCommentInputs((prev) => ({ ...prev, [memeId]: content }));
      console.error('Failed to add comment', e);
    }
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
        
        {/* Supabase Status Indicator */}
        {isSupabaseConfigured && (
          <div className="flex items-center justify-center gap-2 text-sm">
            {supabaseOnline === true ? (
              <div className="flex items-center gap-2 text-green-400">
                <Wifi className="w-4 h-4" />
                <span>Online Community Active</span>
              </div>
            ) : supabaseOnline === false ? (
              <div className="flex items-center gap-2 text-orange-400">
                <WifiOff className="w-4 h-4" />
                <span>Online Community Offline - Using Local Storage</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-gray-400">
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                <span>Checking Connection...</span>
              </div>
            )}
          </div>
        )}
        {(!isSupabaseConfigured || error.includes('Connection to online community failed')) && (
          <div className="bg-blue-600/20 border border-blue-600/30 rounded-lg p-4 max-w-md mx-auto">
            <p className="text-blue-300 text-sm">
              💾 <strong>Local Mode:</strong> {error.includes('Connection to online community failed') 
                ? 'Online community unavailable. Showing local memes.' 
                : 'Showing memes saved on your device. Create memes and save them to see them here!'
              }
            </p>
            <Button 
              onClick={loadLocalMemes}
              variant="outline"
              size="sm"
              className="mt-2"
            >
              🔄 Refresh
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {/* Debug info */}
        {(!isSupabaseConfigured || error.includes('Connection to online community failed')) && (
          <div className="bg-gray-800/50 rounded-lg p-3 text-xs text-gray-400">
            <strong>Debug Info:</strong> Memes: {memes.length}, Loading: {loading.toString()}, Error: {error || 'None'}
            {error.includes('Connection to online community failed') && (
              <div className="mt-1 text-orange-400">
                ⚠️ Supabase connection failed - using local storage fallback
              </div>
            )}
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <div />
          <div className="inline-flex bg-gray-800 rounded-full p-1">
            <button
              className={`px-3 py-1 text-sm rounded-full ${sortBy === 'new' ? 'bg-purple-600 text-white' : 'text-gray-300'}`}
              onClick={() => {
                if (sortBy !== 'new') {
                  setSortBy('new');
                }
              }}
            >
              Newest
            </button>
            <button
              className={`px-3 py-1 text-sm rounded-full ${sortBy === 'mostReacted' ? 'bg-purple-600 text-white' : 'text-gray-300'}`}
              onClick={() => {
                if (sortBy !== 'mostReacted') {
                  setSortBy('mostReacted');
                }
              }}
            >
              Most Reacted
            </button>
            <button
              className={`px-3 py-1 text-sm rounded-full ${sortBy === 'trending' ? 'bg-purple-600 text-white' : 'text-gray-300'}`}
              onClick={() => {
                if (sortBy !== 'trending') {
                  setSortBy('trending');
                }
              }}
            >
              Trending
            </button>
          </div>
        </div>
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
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2">
                <button className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors">
                  <Download className="w-4 h-4 text-gray-400" />
                </button>
                <button 
                  className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
                  onClick={() => {
                    const url = `${window.location.origin}${window.location.pathname}#meme/${meme.id}`;
                    if (navigator.share) {
                      navigator.share({
                        title: 'Check out this meme!',
                        text: 'Made with MemeGen',
                        url: url
                      }).catch(() => {
                        navigator.clipboard.writeText(url);
                        alert('Link copied to clipboard!');
                      });
                    } else {
                      navigator.clipboard.writeText(url);
                      alert('Link copied to clipboard!');
                    }
                  }}
                >
                  <Share2 className="w-4 h-4 text-gray-400" />
                </button>
                <button
                  className="p-2 rounded-full bg-purple-600/20 hover:bg-purple-600/30 transition-colors"
                  title="Remix with new caption"
                  onClick={() => {
                    // store remix payload locally and navigate to generator
                    try {
                      const payload = {
                        imageUrl: meme.imageUrl,
                        topText: meme.topText,
                        bottomText: meme.bottomText
                      };
                      localStorage.setItem('memegen_remix_payload', JSON.stringify(payload));
                    } catch {}
                    window.location.hash = 'generate';
                  }}
                >
                  <Wand2 className="w-4 h-4 text-purple-400" />
                </button>
              </div>
            </div>

            <div className="mt-4 border-t border-gray-800 pt-4">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => handleToggleComments(meme.id)}
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  {openComments[meme.id] ? 'Hide comments' : 'Show comments'}
                </button>
                <span className="text-xs text-gray-500">
                  {commentsByMeme[meme.id]?.length || 0} comments
                </span>
              </div>
              {openComments[meme.id] && (
                <div className="mt-3 space-y-3">
                  <div className="flex gap-2">
                    <input
                      className="flex-1 bg-gray-900 border border-gray-800 rounded-full px-4 py-2 text-sm outline-none focus:border-purple-600"
                      placeholder="Add a comment..."
                      value={commentInputs[meme.id] || ''}
                      onChange={(e) => setCommentInputs((prev) => ({ ...prev, [meme.id]: e.target.value }))}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleAddComment(meme.id); }}
                    />
                    <Button
                      onClick={() => handleAddComment(meme.id)}
                      variant="outline"
                      size="sm"
                    >
                      Post
                    </Button>
                  </div>
                  {commentLoading[meme.id] && (
                    <p className="text-xs text-gray-500">Loading comments…</p>
                  )}
                  <div className="space-y-2">
                    {(commentsByMeme[meme.id] || []).map((c) => (
                      <div key={c.id} className="flex items-start gap-2">
                        <div className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center text-[10px] text-gray-300">
                          {(c.author || 'G')[0]}
                        </div>
                        <div>
                          <p className="text-sm text-gray-200">{c.content}</p>
                          <p className="text-[10px] text-gray-500">{new Date(c.created_at).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                    {(!commentsByMeme[meme.id] || commentsByMeme[meme.id].length === 0) && !commentLoading[meme.id] && (
                      <p className="text-xs text-gray-500">No comments yet. Be the first!</p>
                    )}
              </div>
                </div>
              )}
            </div>
          </Card>
        ))}
        {loading && (
          <Card className="p-6 text-center text-gray-400">Loading…</Card>
        )}
        {error && (
          <Card className="p-6 text-center text-red-400">{error}</Card>
        )}
        {!loading && !error && memes.length === 0 && (
          <Card className="p-8 text-center">
            <div className="space-y-4">
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto">
                <Sparkles className="w-8 h-8 text-gray-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">No memes yet!</h3>
                <p className="text-gray-400 mb-4">
                  {!isSupabaseConfigured 
                    ? "Create your first meme and save it to see it here!"
                    : "Be the first to share a meme with the community!"
                  }
                </p>
                <div className="flex gap-3 justify-center">
                  <Button 
                    onClick={() => {
                      window.location.hash = 'generate';
                      window.location.reload();
                    }}
                    variant="primary"
                  >
                    Create Your First Meme
                  </Button>
                  {!isSupabaseConfigured && (
                    <Button 
                      onClick={() => {
                        // Add a test meme for debugging
                        const testMeme = {
                          id: `test_${Date.now()}`,
                          imageUrl: 'https://via.placeholder.com/400x400/6366f1/ffffff?text=Test+Meme',
                          topText: 'Test Top Text',
                          bottomText: 'Test Bottom Text',
                          author: 'Test User',
                          timestamp: new Date().toISOString(),
                          reactions: { laugh: 0, fire: 0, heart: 0, wow: 0 }
                        };
                        localStorage.setItem('memegen_local_memes', JSON.stringify([testMeme]));
                        loadLocalMemes(); // Reload the memes
                      }}
                      variant="outline"
                    >
                      Add Test Meme
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>
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
