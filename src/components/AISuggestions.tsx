import { useState, useEffect } from 'react';
import { Sparkles, Loader2, RefreshCw, Copy, Check } from 'lucide-react';
import Card from './Card';
import Button from './Button';
import { getAISuggestion, AISuggestion, TemplateContext } from '../utils/aiSuggestions';

interface AISuggestionsProps {
  templateId: string;
  templateName: string;
  currentTopText?: string;
  currentBottomText?: string;
  imageUrl?: string; // For image analysis
  onApplySuggestion: (topText: string, bottomText: string) => void;
  onSuggestionsChange?: (suggestions: AISuggestion[]) => void;
}

const AISuggestions = ({ 
  templateId, 
  templateName, 
  currentTopText, 
  currentBottomText, 
  imageUrl,
  onApplySuggestion,
  onSuggestionsChange 
}: AISuggestionsProps) => {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Notify parent component when suggestions change
  useEffect(() => {
    if (onSuggestionsChange) {
      onSuggestionsChange(suggestions);
    }
  }, [suggestions, onSuggestionsChange]);

  const generateSuggestions = async () => {
    setLoading(true);
    // Clear previous suggestions immediately when generating new ones
    setSuggestions([]);
    try {
      const context: TemplateContext = {
        templateId,
        templateName,
        currentTopText,
        currentBottomText,
        imageUrl
      };

      // Generate 3 unique suggestions
      const newSuggestions: AISuggestion[] = [];
      const usedSuggestions = new Set<string>();
      
      // Get Gemini API key from environment
      const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;
      
      // Debug: Log API key status (first 10 chars only for security)
      console.log('Gemini API Key available:', geminiApiKey ? `${geminiApiKey.substring(0, 10)}...` : 'Not found');
      
      for (let i = 0; i < 3; i++) {
        const suggestion = await getAISuggestion(context, geminiApiKey);
        if (suggestion) {
          const suggestionKey = `${suggestion.topText}|${suggestion.bottomText}`;
          if (!usedSuggestions.has(suggestionKey)) {
            newSuggestions.push(suggestion);
            usedSuggestions.add(suggestionKey);
          } else {
            // If duplicate, try one more time
            const retrySuggestion = await getAISuggestion(context, geminiApiKey);
            if (retrySuggestion) {
              const retryKey = `${retrySuggestion.topText}|${retrySuggestion.bottomText}`;
              if (!usedSuggestions.has(retryKey)) {
                newSuggestions.push(retrySuggestion);
                usedSuggestions.add(retryKey);
              }
            }
          }
        }
      }

      setSuggestions(newSuggestions);
      
      // Log success with API key status
      if (newSuggestions.length > 0) {
        console.log(`Successfully generated ${newSuggestions.length} suggestions using ${geminiApiKey ? 'Gemini API' : 'fallback methods'}`);
      }
    } catch (error) {
      console.error('Failed to generate suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-500" />
          AI Suggestions
          {import.meta.env.VITE_GEMINI_API_KEY && (
            <span className="text-xs bg-green-600/20 text-green-400 px-2 py-1 rounded-full">
              Powered by Gemini
            </span>
          )}
        </h4>
        <Button
          onClick={generateSuggestions}
          variant="outline"
          size="sm"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Get Suggestions
            </>
          )}
        </Button>
      </div>

      {suggestions.length > 0 && (
        <div className="space-y-3">
          {suggestions.map((suggestion, index) => (
            <div key={index} className="bg-gray-800/50 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  Suggestion {index + 1} • {Math.round(suggestion.confidence * 100)}% confidence
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => copyToClipboard(`${suggestion.topText} | ${suggestion.bottomText}`, index)}
                    className="p-1 rounded hover:bg-gray-700 transition-colors"
                    title="Copy to clipboard"
                  >
                    {copiedIndex === index ? (
                      <Check className="w-3 h-3 text-green-400" />
                    ) : (
                      <Copy className="w-3 h-3 text-gray-400" />
                    )}
                  </button>
                  <Button
                    onClick={() => onApplySuggestion(suggestion.topText, suggestion.bottomText)}
                    variant="secondary"
                    size="sm"
                  >
                    Apply
                  </Button>
                </div>
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
      )}

      {suggestions.length === 0 && !loading && (
        <div className="text-center py-4">
          <p className="text-gray-400 text-sm mb-3">
            Get AI-powered suggestions tailored to this template
          </p>
          <Button onClick={generateSuggestions} variant="outline" size="sm">
            <Sparkles className="w-4 h-4 mr-2" />
            Generate Suggestions
          </Button>
        </div>
      )}

      {loading && (
        <div className="text-center py-4">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-500" />
          <p className="text-sm text-gray-400">
            AI is thinking of funny suggestions...
          </p>
        </div>
      )}
    </Card>
  );
};

export default AISuggestions;
