export interface Challenge {
  id: string;
  title: string;
  description: string;
  templateId?: string; // specific template to use
  topic?: string; // general topic/prompt
  type: 'daily' | 'weekly';
  startDate: string; // ISO date
  endDate: string; // ISO date
  prize?: string; // e.g., "Featured on homepage"
  submissions: number;
}

export interface ChallengeSubmission {
  id: string;
  challengeId: string;
  memeId: string; // references memes table
  author: string;
  submittedAt: string;
  votes: number;
}

// Sample challenges
export const sampleChallenges: Challenge[] = [
  {
    id: 'daily-1',
    title: 'Monday Motivation',
    description: 'Create a meme about Monday morning struggles',
    type: 'daily',
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    prize: 'Featured on homepage',
    submissions: 23
  },
  {
    id: 'weekly-1',
    title: 'Tech Life',
    description: 'Make a meme about programming or tech life',
    templateId: 'drake', // suggest Drake template
    type: 'weekly',
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    prize: 'Winner gets featured in newsletter',
    submissions: 156
  },
  {
    id: 'daily-2',
    title: 'Foodie Friday',
    description: 'Create a meme about your favorite food or cooking fails',
    type: 'daily',
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    prize: 'Top 3 featured on social media',
    submissions: 89
  }
];

export const getActiveChallenges = (): Challenge[] => {
  const now = new Date();
  return sampleChallenges.filter(c => {
    const start = new Date(c.startDate);
    const end = new Date(c.endDate);
    return now >= start && now <= end;
  });
};

export const getChallengeById = (id: string): Challenge | undefined => {
  return sampleChallenges.find(c => c.id === id);
};
