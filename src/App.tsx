import { useState, useEffect } from 'react';
import Threads from './components/Threads';
import Navigation from './components/Navigation';
import HomePage from './components/HomePage';
import MemeGenerator from './components/MemeGenerator';
import CommunityFeed from './components/CommunityFeed';
import ProfilePage from './components/ProfilePage';
import ChallengesPage from './components/ChallengesPage';
import MemePage from './components/MemePage';
import { supabaseHealthCheck } from './utils/healthCheck';

function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'generate' | 'community' | 'profile' | 'challenges' | 'meme'>('home');
  const [memeId, setMemeId] = useState<string>('');

  useEffect(() => {
    const applyHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash === 'generate' || hash === 'community' || hash === 'profile' || hash === 'home' || hash === 'challenges') {
        setActiveTab(hash as any);
        setMemeId('');
      } else if (hash.startsWith('meme/')) {
        const id = hash.replace('meme/', '');
        setActiveTab('meme');
        setMemeId(id);
      }
    };
    applyHash();
    window.addEventListener('hashchange', applyHash);
    return () => window.removeEventListener('hashchange', applyHash);
  }, []);

  // Start Supabase health checks when app loads
  useEffect(() => {
    supabaseHealthCheck.start();
    
    // Cleanup on unmount
    return () => {
      supabaseHealthCheck.stop();
    };
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomePage onNavigate={(tab) => { setActiveTab(tab); window.location.hash = tab; }} />;
      case 'generate':
        return <MemeGenerator />;
      case 'community':
        return <CommunityFeed />;
      case 'profile':
        return <ProfilePage />;
      case 'challenges':
        return <ChallengesPage />;
      case 'meme':
        return <MemePage memeId={memeId} onBack={() => { setActiveTab('community'); window.location.hash = 'community'; }} />;
      default:
        return <HomePage onNavigate={(tab) => { setActiveTab(tab); window.location.hash = tab; }} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white relative overflow-hidden">
      <div className="fixed inset-0 z-0 opacity-30">
        <Threads
          color={[0.486, 0.227, 0.929]}
          amplitude={1.2}
          distance={0.3}
          enableMouseInteraction={true}
        />
      </div>

      <div className="relative z-10">
        <Navigation activeTab={activeTab} onTabChange={(tab) => { setActiveTab(tab); window.location.hash = tab; }} />

        <main className="pb-24 md:pb-8">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default App;
