import { useState } from 'react';
import Threads from './components/Threads';
import Navigation from './components/Navigation';
import HomePage from './components/HomePage';
import MemeGenerator from './components/MemeGenerator';
import CommunityFeed from './components/CommunityFeed';
import ProfilePage from './components/ProfilePage';

function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'generate' | 'community' | 'profile'>('home');

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomePage onNavigate={setActiveTab} />;
      case 'generate':
        return <MemeGenerator />;
      case 'community':
        return <CommunityFeed />;
      case 'profile':
        return <ProfilePage />;
      default:
        return <HomePage onNavigate={setActiveTab} />;
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
        <Navigation activeTab={activeTab} onTabChange={setActiveTab} />

        <main className="pb-24 md:pb-8">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default App;
