import { Wand2, Users, Zap, TrendingUp, Sparkles, Heart, Star } from 'lucide-react';
import Button from './Button';
import Card from './Card';
import ScrollReveal from './ScrollReveal';

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
      <div className="max-w-6xl mx-auto px-4 py-16 space-y-32">
        {/* Hero Section */}
        <div className="text-center space-y-12">
          <div className="flex justify-center mb-8">
            <div className="w-24 h-24 bg-gradient-to-br from-purple-600 via-pink-500 to-green-500 rounded-3xl flex items-center justify-center animate-float shadow-2xl shadow-purple-500/30 relative">
              <Wand2 className="w-14 h-14 text-white" />
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-white animate-pulse" />
              </div>
            </div>
          </div>

          <ScrollReveal
            element="h1"
            baseOpacity={0}
            enableBlur={false}
            baseRotation={2}
            blurStrength={3}
            stagger={0.08}
            containerClassName="gradient-text"
            textClassName="text-5xl md:text-7xl font-bold leading-tight"
          >
            Create Memes That Actually Funny
          </ScrollReveal>

          <ScrollReveal
            element="p"
            baseOpacity={0.3}
            enableBlur={false}
            baseRotation={1}
            blurStrength={2}
            stagger={0.04}
            containerClassName="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto"
          >
            Your genius ideas deserve the perfect meme template. Pick, customize, share, and watch the laughs roll in.
          </ScrollReveal>

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

        {/* Features Section */}
        <div className="space-y-16">
          <ScrollReveal
            element="h2"
            baseOpacity={0}
            enableBlur={false}
            baseRotation={2}
            blurStrength={2}
            stagger={0.06}
            containerClassName="text-center"
            textClassName="text-4xl md:text-5xl font-bold gradient-text"
          >
            Why Choose MemeGen?
          </ScrollReveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={index}
                  hover
                  glass
                  className="text-center space-y-6 p-8 transform hover:scale-105 transition-all duration-500"
                >
                  <div className="w-16 h-16 mx-auto bg-gradient-to-br from-purple-600 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <ScrollReveal
                    element="h3"
                    baseOpacity={0.4}
                    enableBlur={false}
                    baseRotation={1}
                    blurStrength={1}
                    stagger={0.04}
                    containerClassName="text-xl font-bold text-white"
                  >
                    {feature.title}
                  </ScrollReveal>
                  <ScrollReveal
                    element="p"
                    baseOpacity={0.3}
                    enableBlur={false}
                    baseRotation={0.5}
                    blurStrength={1}
                    stagger={0.02}
                    containerClassName="text-gray-400 text-sm leading-relaxed"
                  >
                    {feature.description}
                  </ScrollReveal>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Pro Tip Section */}
        <div className="relative">
          <Card className="p-8 md:p-12 text-center space-y-8 bg-gradient-to-br from-purple-900/30 via-pink-900/20 to-green-900/30 border-2 border-purple-500/20 backdrop-blur-sm">
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-500 rounded-full shadow-lg">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <Star className="w-4 h-4" />
                PRO TIP
                <Star className="w-4 h-4" />
              </span>
            </div>

            <ScrollReveal
              element="h2"
              baseOpacity={0}
              enableBlur={false}
              baseRotation={2}
              blurStrength={2}
              stagger={0.05}
              containerClassName="text-3xl md:text-4xl font-bold text-white"
            >
              Press Spacebar for Random Templates
            </ScrollReveal>
            
            <ScrollReveal
              element="p"
              baseOpacity={0.3}
              enableBlur={false}
              baseRotation={1}
              blurStrength={1}
              stagger={0.03}
              containerClassName="text-gray-400 text-lg max-w-2xl mx-auto"
            >
              Can't decide which template to use? Hit that spacebar and let fate decide your meme destiny.
            </ScrollReveal>
          </Card>
        </div>

        {/* Call to Action Section */}
        <div className="text-center space-y-8">
          <ScrollReveal
            element="h2"
            baseOpacity={0}
            enableBlur={false}
            baseRotation={2}
            blurStrength={2}
            stagger={0.06}
            containerClassName="text-3xl md:text-4xl font-bold gradient-text"
          >
            Ready to Meme Your Dreams?
          </ScrollReveal>
          
          <ScrollReveal
            element="p"
            baseOpacity={0.3}
            enableBlur={false}
            baseRotation={1}
            blurStrength={1}
            stagger={0.04}
            containerClassName="text-gray-400 text-lg max-w-xl mx-auto"
          >
            Join thousands of creators making the internet funnier, one meme at a time.
          </ScrollReveal>
          
          <div className="flex items-center justify-center gap-4 pt-4">
            <Button
              onClick={() => onNavigate('generate')}
              variant="accent"
              size="lg"
              className="px-12 transform hover:scale-105 transition-all duration-300"
            >
              <Heart className="w-5 h-5 mr-2" />
              Let's Go
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
