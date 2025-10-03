import { Wand2, Users, Zap, TrendingUp } from 'lucide-react';
import Button from './Button';
import Card from './Card';

interface HomePageProps {
  onNavigate: (tab: 'generate' | 'community') => void;
}

const HomePage = ({ onNavigate }: HomePageProps) => {
  const features = [
    {
      icon: Wand2,
      title: 'Easy Generation',
      description: 'Create hilarious memes in seconds with our simple interface'
    },
    {
      icon: Users,
      title: 'Community',
      description: 'Share your creations and laugh with thousands of meme lovers'
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'No waiting. Generate and download your memes instantly'
    },
    {
      icon: TrendingUp,
      title: 'Trending Templates',
      description: 'Access the hottest meme templates from across the internet'
    }
  ];

  return (
    <div className="w-full">
      <div className="max-w-6xl mx-auto px-4 py-16 space-y-20">
        <div className="text-center space-y-8">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-600 via-pink-500 to-green-500 rounded-2xl flex items-center justify-center animate-float shadow-2xl shadow-purple-500/30">
              <Wand2 className="w-12 h-12 text-white" />
            </div>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold leading-tight">
            <span className="text-gradient">Create Memes</span>
            <br />
            <span className="text-white">That Actually Funny</span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto">
            Your genius ideas deserve the perfect meme template.
            Pick, customize, share, and watch the laughs roll in.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button
              onClick={() => onNavigate('generate')}
              variant="secondary"
              size="lg"
              className="w-full sm:w-auto"
            >
              <Wand2 className="w-5 h-5 mr-2" />
              Start Creating
            </Button>
            <Button
              onClick={() => onNavigate('community')}
              variant="outline"
              size="lg"
              className="w-full sm:w-auto"
            >
              <Users className="w-5 h-5 mr-2" />
              Explore Community
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={index}
                hover
                glass
                className="text-center space-y-4 p-6"
              >
                <div className="w-14 h-14 mx-auto bg-gradient-to-br from-purple-600 to-pink-500 rounded-xl flex items-center justify-center">
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold">{feature.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </Card>
            );
          })}
        </div>

        <div className="relative">
          <Card className="p-8 md:p-12 text-center space-y-6 bg-gradient-to-br from-purple-900/30 via-pink-900/20 to-green-900/30 border-2 border-purple-500/20">
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-500 rounded-full">
              <span className="text-sm font-bold text-white">PRO TIP</span>
            </div>

            <h2 className="text-3xl md:text-4xl font-bold">
              Press <kbd className="px-3 py-1 bg-gray-800 rounded-lg border border-gray-700 text-purple-400">Spacebar</kbd> for Random Templates
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Can't decide which template to use? Hit that spacebar and let fate decide your meme destiny.
            </p>
          </Card>
        </div>

        <div className="text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold">
            Ready to <span className="text-gradient">Meme Your Dreams?</span>
          </h2>
          <p className="text-gray-400 text-lg">
            Join thousands of creators making the internet funnier, one meme at a time.
          </p>
          <Button
            onClick={() => onNavigate('generate')}
            variant="accent"
            size="lg"
            className="px-12"
          >
            Let's Go
          </Button>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
