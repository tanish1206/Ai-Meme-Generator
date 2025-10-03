export interface MemeTemplate {
  id: string;
  name: string;
  imageUrl: string;
  topText: { x: number; y: number; maxWidth: number };
  bottomText: { x: number; y: number; maxWidth: number };
}

export const memeTemplates: MemeTemplate[] = [
  {
    id: 'drake',
    name: 'Drake Hotline Bling',
    imageUrl: 'https://i.imgflip.com/30b1gx.jpg',
    topText: { x: 350, y: 100, maxWidth: 300 },
    bottomText: { x: 350, y: 400, maxWidth: 300 }
  },
  {
    id: 'distracted',
    name: 'Distracted Boyfriend',
    imageUrl: 'https://i.imgflip.com/1ur9b0.jpg',
    topText: { x: 250, y: 50, maxWidth: 400 },
    bottomText: { x: 250, y: 450, maxWidth: 400 }
  },
  {
    id: 'expanding-brain',
    name: 'Expanding Brain',
    imageUrl: 'https://i.imgflip.com/1jwhww.jpg',
    topText: { x: 300, y: 50, maxWidth: 300 },
    bottomText: { x: 300, y: 550, maxWidth: 300 }
  },
  {
    id: 'two-buttons',
    name: 'Two Buttons',
    imageUrl: 'https://i.imgflip.com/1g8my4.jpg',
    topText: { x: 250, y: 50, maxWidth: 300 },
    bottomText: { x: 250, y: 450, maxWidth: 300 }
  },
  {
    id: 'change-my-mind',
    name: 'Change My Mind',
    imageUrl: 'https://i.imgflip.com/24y43o.jpg',
    topText: { x: 250, y: 350, maxWidth: 400 },
    bottomText: { x: 250, y: 450, maxWidth: 400 }
  },
  {
    id: 'success-kid',
    name: 'Success Kid',
    imageUrl: 'https://i.imgflip.com/1bhk.jpg',
    topText: { x: 250, y: 30, maxWidth: 400 },
    bottomText: { x: 250, y: 450, maxWidth: 400 }
  },
  {
    id: 'one-does-not-simply',
    name: 'One Does Not Simply',
    imageUrl: 'https://i.imgflip.com/1bij.jpg',
    topText: { x: 250, y: 50, maxWidth: 400 },
    bottomText: { x: 250, y: 400, maxWidth: 400 }
  },
  {
    id: 'batman-slap',
    name: 'Batman Slapping Robin',
    imageUrl: 'https://i.imgflip.com/9vct.jpg',
    topText: { x: 200, y: 50, maxWidth: 300 },
    bottomText: { x: 500, y: 50, maxWidth: 300 }
  },
  {
    id: 'is-this',
    name: 'Is This A Pigeon',
    imageUrl: 'https://i.imgflip.com/1o00in.jpg',
    topText: { x: 250, y: 50, maxWidth: 400 },
    bottomText: { x: 250, y: 450, maxWidth: 400 }
  },
  {
    id: 'doge',
    name: 'Doge',
    imageUrl: 'https://i.imgflip.com/4t0m5.jpg',
    topText: { x: 100, y: 50, maxWidth: 300 },
    bottomText: { x: 400, y: 400, maxWidth: 300 }
  }
];

export const getRandomTemplate = (): MemeTemplate => {
  return memeTemplates[Math.floor(Math.random() * memeTemplates.length)];
};
