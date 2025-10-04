import { useState, useEffect } from 'react';
import { Heart, Flame, Laugh, Sparkles, Download, Share2, ArrowLeft, Copy, Check } from 'lucide-react';
import Card from './Card';
import Button from './Button';
import { supabase, isSupabaseConfigured, MemeRow } from '../utils/supabase';

interface MemePageProps {
  memeId: string;
  onBack: () => void;
}

const MemePage = ({ memeId, onBack }: MemePageProps) => {
  const [meme, setMeme] = useState<MemeRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [userReactions, setUserReactions] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setError('Database not configured');
      setLoading(false);
      return;
    }

    const fetchMeme = async () => {
      try {
        const { data, error: dbError } = await supabase
          .from('memes')
          .select('*')
          .eq('id', memeId)
          .single();
        
        if (dbError) throw dbError;
        setMeme(data as MemeRow);
      } catch (e: any) {
        setError(e.message ?? 'Failed to load meme');
      } finally {
        setLoading(false);
      }
    };

    fetchMeme();
  }, [memeId]);

  const handleReaction = async (reactionType: string) => {
    if (!meme) return;
    
    const prevUserReactions = { ...userReactions };
    const previousType = prevUserReactions[memeId] || '';
    const nextType = previousType === reactionType ? '' : reactionType;

    // Optimistic update
    setUserReactions((prev) => ({ ...prev, [memeId]: nextType }));

    if (isSupabaseConfigured && supabase) {
      try {
        const total = (meme.reactions_count || 0) + (nextType ? 1 : -1);
        await supabase
          .from('memes')
          .update({ reactions_count: Math.max(0, total) })
          .eq('id', memeId);
        
        setMeme(prev => prev ? { ...prev, reactions_count: Math.max(0, total) } : null);
      } catch (e) {
        // rollback
        setUserReactions(prevUserReactions);
        console.error('Failed to update reaction:', e);
      }
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Check out this meme!',
          text: 'Made with MemeGen',
          url: url
        });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleDownload = () => {
    if (!meme) return;
    const link = document.createElement('a');
    link.download = `meme-${memeId}.png`;
    link.href = meme.image_url;
    link.click();
  };

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-8">
        <Card className="p-8 text-center">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading meme...</p>
        </Card>
      </div>
    );
  }

  if (error || !meme) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-8">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Meme Not Found</h2>
          <p className="text-gray-400 mb-6">{error || 'This meme might have been deleted.'}</p>
          <Button onClick={onBack} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Community
          </Button>
        </Card>
      </div>
    );
  }

  const reactions = [
    { type: 'laugh', icon: Laugh, color: 'text-yellow-400' },
    { type: 'fire', icon: Flame, color: 'text-orange-500' },
    { type: 'heart', icon: Heart, color: 'text-pink-500' },
    { type: 'wow', icon: Sparkles, color: 'text-purple-400' }
  ];

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-4">
        <Button onClick={onBack} variant="outline" size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">Meme</h1>
      </div>

      <Card className="overflow-hidden">
        <div className="relative bg-gray-900 rounded-lg overflow-hidden">
          <img
            src={meme.image_url}
            alt="Meme"
            className="w-full h-auto"
          />
          {meme.top_text && (
            <div className="absolute top-0 left-0 right-0 p-4 text-center">
              <p className="text-white text-2xl font-bold" style={{
                textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                WebkitTextStroke: '2px black'
              }}>
                {meme.top_text}
              </p>
            </div>
          )}
          {meme.bottom_text && (
            <div className="absolute bottom-0 left-0 right-0 p-4 text-center">
              <p className="text-white text-2xl font-bold" style={{
                textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                WebkitTextStroke: '2px black'
              }}>
                {meme.bottom_text}
              </p>
            </div>
          )}
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {reactions.map(({ type, icon: Icon, color }) => {
                const isActive = userReactions[memeId] === type;
                return (
                  <button
                    key={type}
                    onClick={() => handleReaction(type)}
                    className={`flex items-center gap-1 px-3 py-2 rounded-full transition-all duration-300 ${
                      isActive
                        ? 'bg-purple-600/20 scale-110'
                        : 'bg-gray-800 hover:bg-gray-700'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? color : 'text-gray-400'}`} />
                    <span className={`text-sm font-medium ${isActive ? 'text-white' : 'text-gray-400'}`}>
                      {meme.reactions_count || 0}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              <Button onClick={handleDownload} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button onClick={handleShare} variant="accent" size="sm">
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="text-sm text-gray-400">
            <p>Created {new Date(meme.created_at).toLocaleDateString()}</p>
            <p>ID: {memeId}</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default MemePage;
