import { User, Image, Trophy, Calendar } from 'lucide-react';
import Card from './Card';
import Button from './Button';
import { getEngagement } from '../utils/engagement';

const ProfilePage = () => {
  const engagement = getEngagement();
  const stats = [
    { label: 'Memes Created', value: String(engagement.totalCreated), icon: Image },
    { label: 'Current Streak', value: `${engagement.currentStreakDays} days`, icon: Trophy },
    { label: 'Member Since', value: 'Oct 2025', icon: Calendar }
  ];

  const myMemes = [
    {
      id: '1',
      imageUrl: 'https://i.imgflip.com/30b1gx.jpg',
      reactions: 234
    },
    {
      id: '2',
      imageUrl: 'https://i.imgflip.com/1ur9b0.jpg',
      reactions: 189
    },
    {
      id: '3',
      imageUrl: 'https://i.imgflip.com/1jwhww.jpg',
      reactions: 456
    },
    {
      id: '4',
      imageUrl: 'https://i.imgflip.com/1g8my4.jpg',
      reactions: 321
    }
  ];

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 space-y-8">
      <Card className="p-8">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="w-24 h-24 bg-gradient-to-br from-purple-600 to-pink-500 rounded-full flex items-center justify-center text-4xl font-bold">
            <User className="w-12 h-12 text-white" />
          </div>

          <div className="flex-1 text-center md:text-left space-y-2">
            <h1 className="text-3xl font-bold">MemeCreator Pro</h1>
            <p className="text-gray-400">@memecreator_pro</p>
            <p className="text-gray-500 text-sm">
              Professional meme artist. Making the internet laugh since 2025.
            </p>
          </div>

          <Button variant="outline">
            Edit Profile
          </Button>
        </div>
      </Card>

      <div className="grid md:grid-cols-3 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} glass className="p-6 text-center space-y-3">
              <div className="w-12 h-12 mx-auto bg-gradient-to-br from-purple-600 to-pink-500 rounded-xl flex items-center justify-center">
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gradient">{stat.value}</p>
                <p className="text-sm text-gray-400">{stat.label}</p>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">My Memes</h2>
          <Button variant="outline" size="sm">
            View All
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {myMemes.map((meme) => (
            <Card key={meme.id} hover className="p-0 overflow-hidden">
              <div className="relative aspect-square">
                <img
                  src={meme.imageUrl}
                  alt="My meme"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                  <p className="text-sm font-medium text-white">
                    {meme.reactions} reactions
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-3">Badges</h3>
        {engagement.badges.length === 0 ? (
          <p className="text-gray-500 text-sm">No badges yet. Keep creating memes to unlock badges like "Made memes 5 days in a row!" and "Certified Dank Lord 🌌".</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {engagement.badges.map((b, i) => (
              <span key={i} className="px-3 py-1 rounded-full bg-purple-600/20 text-purple-300 text-sm border border-purple-600/30">{b}</span>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-8 text-center space-y-4 bg-gradient-to-br from-purple-900/30 via-pink-900/20 to-green-900/30 border-2 border-purple-500/20">
        <Trophy className="w-12 h-12 mx-auto text-yellow-400" />
        <h3 className="text-2xl font-bold">Meme Master Status</h3>
        <p className="text-gray-400">
          Keep creating amazing memes to unlock more achievements and climb the leaderboard!
        </p>
        <Button variant="secondary">
          View Achievements
        </Button>
      </Card>
    </div>
  );
};

export default ProfilePage;
