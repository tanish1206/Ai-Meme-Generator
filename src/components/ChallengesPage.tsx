import { useState } from 'react';
import { Trophy, Clock, Users, Star, Calendar } from 'lucide-react';
import Card from './Card';
import Button from './Button';
import { getActiveChallenges, Challenge } from '../data/challenges';

const ChallengesPage = () => {
  const [challenges] = useState<Challenge[]>(getActiveChallenges());

  const getTimeRemaining = (endDate: string) => {
    const now = new Date();
    const end = new Date(endDate);
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return 'Ended';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h left`;
    }
    return `${hours}h ${minutes}m left`;
  };

  const handleJoinChallenge = (challenge: Challenge) => {
    // Store challenge context and navigate to generator
    try {
      localStorage.setItem('memegen_challenge_context', JSON.stringify({
        challengeId: challenge.id,
        title: challenge.title,
        description: challenge.description,
        templateId: challenge.templateId
      }));
    } catch {}
    window.location.hash = 'generate';
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 space-y-8">
      <div className="text-center space-y-4">
        <h2 className="text-4xl md:text-5xl font-bold text-gradient">
          Meme Challenges
        </h2>
        <p className="text-gray-400 text-lg">
          Daily and weekly challenges to test your meme skills
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {challenges.map((challenge) => (
          <Card key={challenge.id} hover className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                <span className="text-sm font-medium text-yellow-500">
                  {challenge.type === 'daily' ? 'Daily' : 'Weekly'}
                </span>
              </div>
              <div className="flex items-center gap-1 text-sm text-gray-400">
                <Clock className="w-4 h-4" />
                {getTimeRemaining(challenge.endDate)}
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-2">{challenge.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                {challenge.description}
              </p>
            </div>

            {challenge.prize && (
              <div className="bg-purple-900/30 border border-purple-500/30 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Star className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-medium text-purple-300">Prize</span>
                </div>
                <p className="text-sm text-purple-200">{challenge.prize}</p>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-sm text-gray-400">
                <Users className="w-4 h-4" />
                {challenge.submissions} submissions
              </div>
              <Button
                onClick={() => handleJoinChallenge(challenge)}
                variant="secondary"
                size="sm"
              >
                Join Challenge
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {challenges.length === 0 && (
        <Card className="p-8 text-center">
          <Trophy className="w-12 h-12 mx-auto text-gray-500 mb-4" />
          <h3 className="text-xl font-bold mb-2">No Active Challenges</h3>
          <p className="text-gray-400">
            Check back later for new daily and weekly challenges!
          </p>
        </Card>
      )}

      <Card className="p-6 bg-gradient-to-br from-purple-900/30 via-pink-900/20 to-green-900/30 border-2 border-purple-500/20">
        <div className="text-center space-y-4">
          <Trophy className="w-12 h-12 mx-auto text-yellow-400" />
          <h3 className="text-2xl font-bold">Leaderboard</h3>
          <p className="text-gray-400">
            Top meme creators from this week's challenges
          </p>
          <div className="space-y-2">
            {[
              { rank: 1, name: 'MemeMaster99', points: 245, badge: '🥇' },
              { rank: 2, name: 'DankLord', points: 198, badge: '🥈' },
              { rank: 3, name: 'FunnyBones', points: 156, badge: '🥉' },
              { rank: 4, name: 'LaughFactory', points: 134, badge: '4' },
              { rank: 5, name: 'JokeGenius', points: 98, badge: '5' }
            ].map((entry) => (
              <div key={entry.rank} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{entry.badge}</span>
                  <span className="font-medium">{entry.name}</span>
                </div>
                <span className="text-purple-400 font-bold">{entry.points} pts</span>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ChallengesPage;
