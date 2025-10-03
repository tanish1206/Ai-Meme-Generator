import { useState, useEffect } from 'react';
import Threads from './components/Threads';
import Navigation from './components/Navigation';
import HomePage from './components/HomePage';
import MemeGenerator from './components/MemeGenerator';
import CommunityFeed from './components/CommunityFeed';
import ProfilePage from './components/ProfilePage';

function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'generate' | 'community' | 'profile'>('home');

  useEffect(() => {
    const applyHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash === 'generate' || hash === 'community' || hash === 'profile' || hash === 'home') {
        setActiveTab(hash as any);
      }
    };
    applyHash();
    window.addEventListener('hashchange', applyHash);
    return () => window.removeEventListener('hashchange', applyHash);
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
