import { useState, useEffect } from 'react';
import { Shuffle, Download, Share2, Sparkles } from 'lucide-react';
import { memeTemplates, getRandomTemplate, MemeTemplate } from '../data/memeTemplates';
import { generateMeme, generateMemeBlob, generateMemeFromSource, generateMemeBlobFromSource, TextStyleOptions, TextPositionOptions } from '../utils/memeGenerator';
import { supabase, isSupabaseConfigured } from '../utils/supabase';
import Button from './Button';
import Card from './Card';
import Input from './Input';
import { recordMemeCreated } from '../utils/engagement';
import { generateStoryFromSource } from '../utils/memeGenerator';
import AISuggestions from './AISuggestions';
import { AISuggestion } from '../utils/aiSuggestions';

interface MemeGeneratorProps {
  onMemeGenerated?: (memeUrl: string) => void;
}

const MemeGenerator = ({ onMemeGenerated }: MemeGeneratorProps) => {
  const [selectedTemplate, setSelectedTemplate] = useState<MemeTemplate>(memeTemplates[0]);
  const [topText, setTopText] = useState('');
  const [bottomText, setBottomText] = useState('');
  const [generatedMeme, setGeneratedMeme] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [style, setStyle] = useState<TextStyleOptions>({ fontScale: 1, strokeWidth: 3, fillColor: 'white', strokeColor: 'black', align: 'center', shadow: false });
  const [positions, setPositions] = useState<TextPositionOptions | undefined>(undefined);
  const [dragging, setDragging] = useState<{ target: 'top' | 'bottom' | null; startX: number; startY: number } | null>(null);
  const [uploadPreviewUrl, setUploadPreviewUrl] = useState<string>('');
  const [templateQuery, setTemplateQuery] = useState('');
  const [currentSuggestions, setCurrentSuggestions] = useState<AISuggestion[]>([]);

  useEffect(() => {
    const payloadRaw = localStorage.getItem('memegen_remix_payload');
    if (payloadRaw) {
      try {
        const payload = JSON.parse(payloadRaw) as { imageUrl?: string; topText?: string; bottomText?: string };
        if (payload.topText) setTopText(payload.topText);
        if (payload.bottomText) setBottomText(payload.bottomText);
        if (payload.imageUrl) {
          // Prefill preview with the source image; we won't have a File, but it's fine for generating
          setGeneratedMeme('');
          setUploadFile(null);
          setUploadPreviewUrl(payload.imageUrl);
        }
      } catch {}
      localStorage.removeItem('memegen_remix_payload');
    }

    // Check for challenge context
    const challengeRaw = localStorage.getItem('memegen_challenge_context');
    if (challengeRaw) {
      try {
        const challenge = JSON.parse(challengeRaw) as { 
          challengeId: string; 
          title: string; 
          description: string; 
          templateId?: string 
        };
        // Pre-select suggested template if provided
        if (challenge.templateId) {
          const template = memeTemplates.find(t => t.id === challenge.templateId);
          if (template) {
            setSelectedTemplate(template);
          }
        }
        // Show challenge context in UI
        console.log('Challenge context:', challenge);
      } catch {}
      // Don't remove challenge context yet - keep it for submission
    }
  }, []);

  const handleRandomTemplate = () => {
    const randomTemplate = getRandomTemplate();
    setSelectedTemplate(randomTemplate);
    setGeneratedMeme('');
    if (uploadPreviewUrl) URL.revokeObjectURL(uploadPreviewUrl);
    setUploadPreviewUrl('');
    setUploadFile(null);
  };

  const handleGenerate = async () => {
    if (!topText && !bottomText) return;

    setIsGenerating(true);
    try {
      const memeUrl = uploadFile
        ? await generateMemeFromSource(uploadFile, topText, bottomText, style, positions)
        : await generateMeme(selectedTemplate, topText, bottomText, style, positions);
      setGeneratedMeme(memeUrl);
      if (onMemeGenerated) {
        onMemeGenerated(memeUrl);
      }
      // record engagement locally
      recordMemeCreated();
    } catch (error) {
      console.error('Error generating meme:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedMeme) return;
    const link = document.createElement('a');
    link.download = `meme-${Date.now()}.png`;
    link.href = generatedMeme;
    link.click();
  };

  const handleShare = async () => {
    if (!generatedMeme) return;

    try {
      const blob = await (await fetch(generatedMeme)).blob();
      const file = new File([blob], 'meme.png', { type: 'image/png' });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Check out this meme!',
          text: 'Made with MemeGen'
        });
      } else {
        await navigator.clipboard.writeText(generatedMeme);
        alert('Meme URL copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleSave = async () => {
    if (!generatedMeme) return;
    setIsSaving(true);
    setErrorMsg('');
    
    try {
      if (isSupabaseConfigured && supabase) {
        try {
          // Save to Supabase
          const blob = uploadFile
            ? await generateMemeBlobFromSource(uploadFile, topText, bottomText, style, positions)
            : await generateMemeBlob(selectedTemplate, topText, bottomText, style, positions);
          const fileName = `memes/${Date.now()}-${selectedTemplate.id}.png`;
          const { data: storageData, error: storageError } = await supabase
            .storage
            .from('Public')
            .upload(fileName, blob, { contentType: 'image/png', upsert: false });
          if (storageError) throw storageError;

          const { data: urlData } = supabase
            .storage
            .from('Public')
            .getPublicUrl(storageData.path);

          const { error: insertError } = await supabase
            .from('memes')
            .insert({
              image_url: urlData.publicUrl,
              top_text: topText,
              bottom_text: bottomText
            });
          if (insertError) throw insertError;
          
          alert('Saved to community!');
        } catch (supabaseError) {
          console.error('Supabase save failed, falling back to local storage:', supabaseError);
          // Fall back to local storage if Supabase fails
          throw new Error('SUPABASE_FALLBACK');
        }
      } else {
        // Save to local storage as fallback
        const newMeme = {
          id: `local_${Date.now()}`,
          imageUrl: generatedMeme,
          topText: topText,
          bottomText: bottomText,
          author: 'You',
          timestamp: new Date().toISOString(),
          reactions: { laugh: 0, fire: 0, heart: 0, wow: 0 }
        };
        
        const existingMemes = localStorage.getItem('memegen_local_memes');
        const memes = existingMemes ? JSON.parse(existingMemes) : [];
        memes.unshift(newMeme); // Add to beginning
        localStorage.setItem('memegen_local_memes', JSON.stringify(memes));
        
        console.log('Saved meme to local storage:', newMeme);
        console.log('All local memes:', memes);
        alert('Saved to local community! (Note: This is stored locally on your device)');
      }
      
      // Check if this is a challenge submission
      const challengeRaw = localStorage.getItem('memegen_challenge_context');
      if (challengeRaw) {
        try {
          const challenge = JSON.parse(challengeRaw);
          console.log('Challenge submission for:', challenge.title);
          alert(`Saved to community and submitted to "${challenge.title}" challenge!`);
          localStorage.removeItem('memegen_challenge_context');
        } catch {}
      }
    } catch (e: any) {
      console.error(e);
      if (e.message === 'SUPABASE_FALLBACK') {
        // Fall back to local storage
        try {
          const newMeme = {
            id: `local_${Date.now()}`,
            imageUrl: generatedMeme,
            topText: topText,
            bottomText: bottomText,
            author: 'You',
            timestamp: new Date().toISOString(),
            reactions: { laugh: 0, fire: 0, heart: 0, wow: 0 }
          };
          
          const existingMemes = localStorage.getItem('memegen_local_memes');
          const memes = existingMemes ? JSON.parse(existingMemes) : [];
          memes.unshift(newMeme); // Add to beginning
          localStorage.setItem('memegen_local_memes', JSON.stringify(memes));
          
          console.log('Saved meme to local storage (fallback):', newMeme);
          alert('Online community unavailable. Saved locally instead!');
        } catch (localError) {
          console.error('Local storage save also failed:', localError);
          setErrorMsg('Failed to save meme both online and locally');
        }
      } else {
        setErrorMsg(e.message ?? 'Failed to save meme');
      }
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault();
        handleRandomTemplate();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 space-y-8">
      <div className="text-center space-y-4">
        <h2 className="text-4xl md:text-5xl font-bold text-gradient">
          Create Your Meme
        </h2>
        <p className="text-gray-400 text-lg">
          Pick a template, add your genius text, and let the magic happen
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <Card>
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              Choose Template
            </h3>

            <Input
              placeholder="Search templates..."
              value={templateQuery}
              onChange={(e) => setTemplateQuery(e.target.value)}
              className="mb-3"
            />
            <div className="grid grid-cols-2 gap-3 mb-4 max-h-96 overflow-y-auto pr-2">
              {memeTemplates
                .filter((t) => t.name.toLowerCase().includes(templateQuery.toLowerCase()))
                .map((template) => (
                <button
                  key={template.id}
                  onClick={() => {
                    setSelectedTemplate(template);
                    setGeneratedMeme('');
                    if (uploadPreviewUrl) URL.revokeObjectURL(uploadPreviewUrl);
                    setUploadPreviewUrl('');
                    setUploadFile(null);
                  }}
                  className={`relative rounded-lg overflow-hidden transition-all duration-300 ${
                    selectedTemplate.id === template.id
                      ? 'ring-4 ring-purple-500 scale-105'
                      : 'hover:scale-105 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={template.imageUrl}
                    alt={template.name}
                    className="w-full h-32 object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                    <p className="text-xs font-medium text-white truncate">
                      {template.name}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            <Button
              onClick={handleRandomTemplate}
              variant="outline"
              className="w-full"
            >
              <Shuffle className="w-4 h-4 mr-2" />
              Random Template (Spacebar)
            </Button>
          </Card>

          <Card>
            <h3 className="text-xl font-semibold mb-4">Add Text</h3>
            <div className="space-y-4">
              <Input
                placeholder="Type your genius top text..."
                value={topText}
                onChange={(e) => setTopText(e.target.value)}
                maxLength={100}
              />
              <Input
                placeholder="Type your genius bottom text..."
                value={bottomText}
                onChange={(e) => setBottomText(e.target.value)}
                maxLength={100}
              />
              <div>
                <label className="text-sm text-gray-400">Or upload your own image</label>
                <input
                  type="file"
                  accept="image/*"
                  className="mt-2 block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-500"
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    setGeneratedMeme('');
                    if (uploadPreviewUrl) URL.revokeObjectURL(uploadPreviewUrl);
                    setUploadPreviewUrl('');
                    setUploadFile(f);
                    if (f) {
                      const url = URL.createObjectURL(f);
                      setUploadPreviewUrl(url);
                    }
                  }}
                />
                {uploadFile && (
                  <p className="text-xs text-gray-400 mt-1">Selected: {uploadFile.name}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="text-sm text-gray-400">Font size</label>
                  <input
                    type="range"
                    min={0.5}
                    max={2}
                    step={0.1}
                    value={style.fontScale ?? 1}
                    onChange={(e) => setStyle((s) => ({ ...s, fontScale: parseFloat(e.target.value) }))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400">Stroke width</label>
                  <input
                    type="range"
                    min={0}
                    max={10}
                    step={1}
                    value={style.strokeWidth ?? 3}
                    onChange={(e) => setStyle((s) => ({ ...s, strokeWidth: parseInt(e.target.value) }))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400">Fill color</label>
                  <input
                    type="color"
                    value={style.fillColor ?? '#ffffff'}
                    onChange={(e) => setStyle((s) => ({ ...s, fillColor: e.target.value }))}
                    className="w-full h-10 bg-transparent"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400">Stroke color</label>
                  <input
                    type="color"
                    value={style.strokeColor ?? '#000000'}
                    onChange={(e) => setStyle((s) => ({ ...s, strokeColor: e.target.value }))}
                    className="w-full h-10 bg-transparent"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400">Align</label>
                  <select
                    value={style.align ?? 'center'}
                    onChange={(e) => setStyle((s) => ({ ...s, align: e.target.value as any }))}
                    className="w-full bg-gray-900 border border-gray-800 rounded-md px-3 py-2 text-sm"
                  >
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <label className="inline-flex items-center gap-2 text-sm text-gray-400">
                    <input
                      type="checkbox"
                      checked={Boolean(style.shadow)}
                      onChange={(e) => setStyle((s) => ({ ...s, shadow: e.target.checked }))}
                    />
                    Shadow
                  </label>
                </div>
              </div>
              <Button
                onClick={handleGenerate}
                variant="secondary"
                size="lg"
                className="w-full"
                disabled={isGenerating || (!topText && !bottomText)}
              >
                {isGenerating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Generate Meme
                  </>
                )}
              </Button>
              <AISuggestions
                templateId={selectedTemplate.id}
                templateName={selectedTemplate.name}
                currentTopText={topText}
                currentBottomText={bottomText}
                imageUrl={uploadPreviewUrl || selectedTemplate.imageUrl}
                onApplySuggestion={(top, bottom) => {
                  setTopText(top);
                  setBottomText(bottom);
                }}
                onSuggestionsChange={setCurrentSuggestions}
              />
              {errorMsg && (
                <p className="text-red-400 text-sm">{errorMsg}</p>
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="sticky top-24">
            <h3 className="text-xl font-semibold mb-4">Preview</h3>
            <div
              className="relative bg-gray-900 rounded-lg overflow-hidden aspect-square flex items-center justify-center select-none"
              onMouseUp={() => setDragging(null)}
              onMouseLeave={() => setDragging(null)}
            >
              {generatedMeme ? (
                <img
                  src={generatedMeme}
                  alt="Generated meme"
                  className="w-full h-full object-contain"
                />
              ) : uploadPreviewUrl ? (
                <img
                  src={uploadPreviewUrl}
                  alt="Upload preview"
                  className="w-full h-full object-contain opacity-80"
                />
              ) : (
                <div className="text-center space-y-4 p-8">
                  <img
                    src={selectedTemplate.imageUrl}
                    alt={selectedTemplate.name}
                    className="w-full h-full object-contain opacity-50"
                  />
                  <p className="text-gray-500 text-sm absolute bottom-4 left-0 right-0">
                    Your meme will appear here
                  </p>
                </div>
              )}
              {!generatedMeme && (
                <>
                  {/* draggable handles overlay for top/bottom text */}
                  <div
                    className="absolute"
                    style={{
                      left: `${(positions?.top?.xPct ?? (selectedTemplate.topText.x / 700)) * 100}%`,
                      top: `${(positions?.top?.yPct ?? (selectedTemplate.topText.y / 700)) * 100}%`,
                      transform: 'translate(-50%, 0)'
                    }}
                    onMouseDown={(e) => setDragging({ target: 'top', startX: e.clientX, startY: e.clientY })}
                  >
                    <span className="px-2 py-1 rounded bg-purple-600/70 text-xs">Top</span>
                  </div>
                  <div
                    className="absolute"
                    style={{
                      left: `${(positions?.bottom?.xPct ?? (selectedTemplate.bottomText.x / 700)) * 100}%`,
                      top: `${(positions?.bottom?.yPct ?? (selectedTemplate.bottomText.y / 700)) * 100}%`,
                      transform: 'translate(-50%, 0)'
                    }}
                    onMouseDown={(e) => setDragging({ target: 'bottom', startX: e.clientX, startY: e.clientY })}
                  >
                    <span className="px-2 py-1 rounded bg-purple-600/70 text-xs">Bottom</span>
                  </div>
                </>
              )}
              {!generatedMeme && dragging && (
                <div
                  className="absolute inset-0"
                  onMouseMove={(e) => {
                    // calculate relative position within container
                    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                    const xPct = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
                    const yPct = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));
                    setPositions((prev) => {
                      const next = { ...(prev || {}) } as any;
                      if (dragging.target === 'top') {
                        next.top = { xPct, yPct, maxWidthPct: prev?.top?.maxWidthPct ?? 0.8 };
                      } else if (dragging.target === 'bottom') {
                        next.bottom = { xPct, yPct, maxWidthPct: prev?.bottom?.maxWidthPct ?? 0.8 };
                      }
                      return next;
                    });
                  }}
                />
              )}
            </div>

            {/* AI Suggestions in Preview Tab */}
            {currentSuggestions.length > 0 && (
              <div className="mt-4 space-y-2">
                <h4 className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  AI Suggestions
                  {import.meta.env.VITE_GEMINI_API_KEY && (
                    <span className="text-xs bg-green-600/20 text-green-400 px-2 py-1 rounded-full">
                      Powered by Gemini
                    </span>
                  )}
                </h4>
                <div className="space-y-2">
                  {currentSuggestions.map((suggestion, index) => (
                    <div key={index} className="bg-gray-800/50 rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">
                          Suggestion {index + 1} • {Math.round(suggestion.confidence * 100)}% confidence
                        </span>
                        <Button
                          onClick={() => {
                            setTopText(suggestion.topText);
                            setBottomText(suggestion.bottomText);
                          }}
                          variant="secondary"
                          size="sm"
                        >
                          Apply
                        </Button>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-white">
                          "{suggestion.topText}"
                        </div>
                        <div className="text-sm font-medium text-white">
                          "{suggestion.bottomText}"
                        </div>
                      </div>
                      
                      {suggestion.reasoning && (
                        <div className="text-xs text-gray-400 italic">
                          {suggestion.reasoning}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {generatedMeme && (
              <div className="flex gap-3 mt-4">
                <Button
                  onClick={handleDownload}
                  variant="outline"
                  className="flex-1"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button
                  onClick={handleShare}
                  variant="accent"
                  className="flex-1"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
                <Button
                  onClick={async () => {
                    try {
                      const source = uploadFile || (selectedTemplate.imageUrl as any);
                      const blob = await generateStoryFromSource(source, topText, bottomText, style);
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = `meme-story-${Date.now()}.png`;
                      link.click();
                      URL.revokeObjectURL(url);
                    } catch (e) {
                      console.error('Failed to export story', e);
                    }
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Story 1080x1920
                </Button>
                <Button
                  onClick={handleSave}
                  variant="primary"
                  className="flex-1"
                  disabled={isSaving}
                  title={isSupabaseConfigured ? 'Save to online community' : 'Save to local community (stored on your device)'}
                >
                  {isSaving ? 'Saving…' : (isSupabaseConfigured ? 'Save to Community' : 'Save Locally')}
                </Button>
              </div>
            )}
            {!isSupabaseConfigured && generatedMeme && (
              <p className="text-xs text-gray-400 mt-2">
                💾 Memes are saved locally on your device. To share with the online community, configure Supabase environment variables.
              </p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MemeGenerator;
