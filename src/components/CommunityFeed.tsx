import { useEffect, useState } from 'react';
import { Heart, Flame, Laugh, Sparkles, Download, Share2, Wand2, Wifi, WifiOff, Grid3X3, List } from 'lucide-react';
import Card from './Card';
import Button from './Button';
import Masonry from './Masonry';
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
  const [viewMode, setViewMode] = useState<'grid' | 'masonry'>('masonry');

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
    <div className="w-full max-w-6xl mx-auto px-4 py-8 space-y-8">
      <div className="text-center space-y-6">
        <div className="relative">
          <h2 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent animate-pulse">
            Community Hub
          </h2>
          <div className="absolute -top-2 -right-2 w-4 h-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-bounce"></div>
        </div>
        <p className="text-gray-300 text-xl font-medium max-w-2xl mx-auto leading-relaxed">
          Discover the funniest memes created by our amazing community of creators
        </p>
        
        {/* Supabase Status Indicator */}
        {isSupabaseConfigured && (
          <div className="flex items-center justify-center">
            {supabaseOnline === true ? (
              <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-full backdrop-blur-sm">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <Wifi className="w-4 h-4 text-green-400" />
                <span className="text-green-300 font-medium">Live Community</span>
              </div>
            ) : supabaseOnline === false ? (
              <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-500/30 rounded-full backdrop-blur-sm">
                <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                <WifiOff className="w-4 h-4 text-orange-400" />
                <span className="text-orange-300 font-medium">Offline Mode</span>
              </div>
            ) : (
              <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-gray-500/20 to-slate-500/20 border border-gray-500/30 rounded-full backdrop-blur-sm">
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-gray-300 font-medium">Connecting...</span>
              </div>
            )}
          </div>
        )}
        {(!isSupabaseConfigured || error.includes('Connection to online community failed')) && (
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-2xl p-6 max-w-lg mx-auto backdrop-blur-sm">
            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto">
                <span className="text-white text-xl">💾</span>
              </div>
              <p className="text-blue-200 text-sm font-medium">
                <strong>Local Mode:</strong> {error.includes('Connection to online community failed') 
                  ? 'Online community unavailable. Showing local memes.' 
                  : 'Showing memes saved on your device. Create memes and save them to see them here!'
                }
              </p>
              <Button 
                onClick={loadLocalMemes}
                variant="outline"
                size="sm"
                className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-blue-400/30 hover:from-blue-500/30 hover:to-purple-500/30"
              >
                🔄 Refresh Local Memes
              </Button>
            </div>
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
          {/* View Mode Toggle */}
          <div className="inline-flex bg-gradient-to-r from-gray-800/50 to-gray-700/50 backdrop-blur-sm border border-gray-600/30 rounded-2xl p-1 shadow-lg">
            <button
              className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-300 flex items-center gap-2 ${
                viewMode === 'masonry' 
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30' 
                  : 'text-gray-300 hover:text-white hover:bg-gray-600/30'
              }`}
              onClick={() => setViewMode('masonry')}
            >
              <Grid3X3 className="w-4 h-4" />
              Masonry
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-300 flex items-center gap-2 ${
                viewMode === 'grid' 
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30' 
                  : 'text-gray-300 hover:text-white hover:bg-gray-600/30'
              }`}
              onClick={() => setViewMode('grid')}
            >
              <List className="w-4 h-4" />
              List
            </button>
          </div>

          {/* Sort Options */}
          <div className="inline-flex bg-gradient-to-r from-gray-800/50 to-gray-700/50 backdrop-blur-sm border border-gray-600/30 rounded-2xl p-1 shadow-lg">
            <button
              className={`px-6 py-3 text-sm font-medium rounded-xl transition-all duration-300 ${
                sortBy === 'new' 
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30' 
                  : 'text-gray-300 hover:text-white hover:bg-gray-600/30'
              }`}
              onClick={() => {
                if (sortBy !== 'new') {
                  setSortBy('new');
                }
              }}
            >
              ✨ Newest
            </button>
            <button
              className={`px-6 py-3 text-sm font-medium rounded-xl transition-all duration-300 ${
                sortBy === 'mostReacted' 
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30' 
                  : 'text-gray-300 hover:text-white hover:bg-gray-600/30'
              }`}
              onClick={() => {
                if (sortBy !== 'mostReacted') {
                  setSortBy('mostReacted');
                }
              }}
            >
              🔥 Most Reacted
            </button>
            <button
              className={`px-6 py-3 text-sm font-medium rounded-xl transition-all duration-300 ${
                sortBy === 'trending' 
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30' 
                  : 'text-gray-300 hover:text-white hover:bg-gray-600/30'
              }`}
              onClick={() => {
                if (sortBy !== 'trending') {
                  setSortBy('trending');
                }
              }}
            >
              📈 Trending
            </button>
          </div>
        </div>
        {viewMode === 'masonry' ? (
          <Masonry
            items={memes.map(meme => ({
              id: meme.id,
              img: meme.imageUrl,
              height: 400 + Math.random() * 200, // Random heights for masonry effect
              topText: meme.topText,
              bottomText: meme.bottomText,
              author: meme.author,
              timestamp: meme.timestamp,
              reactions: meme.reactions
            }))}
            ease="power3.out"
            duration={0.6}
            stagger={0.05}
            animateFrom="bottom"
            scaleOnHover={true}
            hoverScale={0.95}
            blurToFocus={true}
            colorShiftOnHover={false}
            onItemClick={(item) => {
              // Navigate to meme detail page
              window.location.hash = `meme/${item.id}`;
            }}
          />
        ) : (
          memes.map((meme) => (
          <Card key={meme.id} hover className="overflow-hidden bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/30 shadow-xl hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-500">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-lg">
                      {meme.author[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-gray-900"></div>
                </div>
                <div>
                  <p className="font-bold text-lg text-white">{meme.author}</p>
                  <p className="text-sm text-gray-400 flex items-center gap-1">
                    <span>🕒</span>
                    {getTimeAgo(meme.timestamp)}
                  </p>
                </div>
              </div>
            </div>

            <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl overflow-hidden mb-6 shadow-2xl border border-gray-700/30">
              <img
                src={meme.imageUrl}
                alt="Community meme"
                className="w-full h-auto transition-transform duration-300 hover:scale-105"
              />
              <div className="absolute top-0 left-0 right-0 p-6 text-center">
                <p className="text-white text-3xl font-black drop-shadow-2xl" style={{
                  textShadow: '3px 3px 6px rgba(0,0,0,0.9), 0 0 20px rgba(0,0,0,0.5)',
                  WebkitTextStroke: '2px black'
                }}>
                  {meme.topText}
                </p>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-6 text-center">
                <p className="text-white text-3xl font-black drop-shadow-2xl" style={{
                  textShadow: '3px 3px 6px rgba(0,0,0,0.9), 0 0 20px rgba(0,0,0,0.5)',
                  WebkitTextStroke: '2px black'
                }}>
                  {meme.bottomText}
                </p>
              </div>
              <div className="absolute top-4 right-4">
                <div className="bg-black/50 backdrop-blur-sm rounded-full px-3 py-1">
                  <span className="text-white text-xs font-medium">🔥 Viral</span>
                </div>
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
                      className={`flex items-center gap-2 px-4 py-3 rounded-2xl transition-all duration-300 transform hover:scale-105 ${
                        isActive
                          ? `bg-gradient-to-r ${color} text-white shadow-lg shadow-purple-500/30 scale-105`
                          : 'bg-gradient-to-r from-gray-700/50 to-gray-600/50 hover:from-gray-600/50 hover:to-gray-500/50 text-gray-300 hover:text-white backdrop-blur-sm border border-gray-600/30'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-sm font-bold">{count}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-3">
                <button className="p-3 rounded-2xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 border border-blue-500/30 hover:border-blue-400/50 transition-all duration-300 transform hover:scale-105 backdrop-blur-sm">
                  <Download className="w-5 h-5 text-blue-400" />
                </button>
                <button 
                  className="p-3 rounded-2xl bg-gradient-to-r from-green-500/20 to-emerald-500/20 hover:from-green-500/30 hover:to-emerald-500/30 border border-green-500/30 hover:border-green-400/50 transition-all duration-300 transform hover:scale-105 backdrop-blur-sm"
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
                  <Share2 className="w-5 h-5 text-green-400" />
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
          ))
        )}
        {loading && (
          <Card className="p-6 text-center text-gray-400">Loading…</Card>
        )}
        {error && (
          <Card className="p-6 text-center text-red-400">{error}</Card>
        )}
        {!loading && !error && memes.length === 0 && (
          <Card className="p-12 text-center bg-gradient-to-br from-gray-800/30 to-gray-900/30 backdrop-blur-sm border border-gray-700/30">
            <div className="space-y-8">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 rounded-full flex items-center justify-center mx-auto shadow-2xl">
                  <Sparkles className="w-12 h-12 text-white animate-pulse" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✨</span>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  No memes yet!
                </h3>
                <p className="text-gray-300 text-lg max-w-md mx-auto leading-relaxed">
                  {!isSupabaseConfigured 
                    ? "🎨 Create your first meme and save it to see it here!"
                    : "🚀 Be the first to share a meme with the community!"
                  }
                </p>
                <div className="flex gap-4 justify-center flex-wrap">
                  <Button 
                    onClick={() => {
                      window.location.hash = 'generate';
                      window.location.reload();
                    }}
                    variant="primary"
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg shadow-purple-500/30 transform hover:scale-105 transition-all duration-300"
                  >
                    🎨 Create Your First Meme
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
                      className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-blue-400/30 hover:from-blue-500/30 hover:to-purple-500/30 backdrop-blur-sm"
                    >
                      🧪 Add Test Meme
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
