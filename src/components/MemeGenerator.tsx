import { useState, useEffect } from 'react';
import { Shuffle, Download, Share2, Sparkles } from 'lucide-react';
import { memeTemplates, getRandomTemplate, MemeTemplate } from '../data/memeTemplates';
import { generateMeme, generateMemeBlob } from '../utils/memeGenerator';
import { supabase, isSupabaseConfigured } from '../utils/supabase';
import Button from './Button';
import Card from './Card';
import Input from './Input';

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
  const [isGenerating, setIsGenerating] = useState(false);

  const handleRandomTemplate = () => {
    const randomTemplate = getRandomTemplate();
    setSelectedTemplate(randomTemplate);
    setGeneratedMeme('');
  };

  const handleGenerate = async () => {
    if (!topText && !bottomText) return;

    setIsGenerating(true);
    try {
      const memeUrl = await generateMeme(selectedTemplate, topText, bottomText);
      setGeneratedMeme(memeUrl);
      if (onMemeGenerated) {
        onMemeGenerated(memeUrl);
      }
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
    if (!generatedMeme || !isSupabaseConfigured || !supabase) return;
    setIsSaving(true);
    setErrorMsg('');
    try {
      const blob = await generateMemeBlob(selectedTemplate, topText, bottomText);
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
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message ?? 'Failed to save meme');
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

            <div className="grid grid-cols-2 gap-3 mb-4 max-h-96 overflow-y-auto pr-2">
              {memeTemplates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => {
                    setSelectedTemplate(template);
                    setGeneratedMeme('');
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
              {errorMsg && (
                <p className="text-red-400 text-sm">{errorMsg}</p>
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="sticky top-24">
            <h3 className="text-xl font-semibold mb-4">Preview</h3>
            <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-square flex items-center justify-center">
              {generatedMeme ? (
                <img
                  src={generatedMeme}
                  alt="Generated meme"
                  className="w-full h-full object-contain"
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
            </div>

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
                  onClick={handleSave}
                  variant="primary"
                  className="flex-1"
                  disabled={isSaving || !isSupabaseConfigured}
                  title={isSupabaseConfigured ? '' : 'Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env and restart'}
                >
                  {isSaving ? 'Saving…' : 'Save to Community'}
                </Button>
              </div>
            )}
            {!isSupabaseConfigured && generatedMeme && (
              <p className="text-xs text-gray-400 mt-2">
                To enable saving, create an .env with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then restart the dev server.
              </p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MemeGenerator;
