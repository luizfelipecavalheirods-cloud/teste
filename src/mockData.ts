import { Campaign, User } from './types';

export const MOCK_USER: User = {
  id: 'u1',
  name: 'Jackson',
  email: 'jackson@exemplo.com',
  points: 450,
  level: 5,
  achievements: [
    { id: 'a1', title: 'Primeiro Scan', description: 'Escaneou seu primeiro produto!', icon: 'Scan', unlockedAt: '2024-03-01' },
    { id: 'a2', title: 'Mestre dos Quizzes', description: 'Completou 5 quizzes com 100% de precisão', icon: 'Award' }
  ],
  vouchers: []
};

export const MOCK_CAMPAIGNS: Campaign[] = [
  {
    id: 'c1',
    brandName: 'Powerade',
    title: 'Desafio de Hidratação Powerade',
    description: 'Escaneie qualquer garrafa Powerade e complete missões para ganhar uma garrafa inteligente reutilizável!',
    productBarcode: '123456789',
    status: 'active',
    reward: { type: 'product', value: 'Garrafa Inteligente', description: 'Garrafa Inteligente Powerade Edição Limitada' },
    missions: [
      { id: 'm1', type: 'scan', title: 'Scan Inicial', description: 'Escaneie sua garrafa para começar', points: 50, completed: false },
      { id: 'm2', type: 'quiz', title: 'Conhecimento Powerade', description: 'Passe no quiz de hidratação e performance', points: 100, completed: false, quizId: 'q1' },
      { id: 'm3', type: 'geo', title: 'Visite a Fonte', description: 'Visite nossa estação de hidratação pop-up', points: 200, completed: false, location: { lat: -21.2110, lng: -50.4350, radius: 100 } }
    ]
  },
  {
    id: 'c2',
    brandName: 'Red Bull',
    title: 'Performance Máxima Red Bull',
    description: 'Abasteça seu treino. Escaneie latas de Red Bull e caminhe para ganhar descontos exclusivos.',
    productBarcode: '987654321',
    status: 'active',
    reward: { type: 'coupon', value: '50% de DESCONTO', description: 'Metade do preço no seu próximo pack de Red Bull' },
    missions: [
      { id: 'm4', type: 'walk', title: 'Caminhada de Poder', description: 'Caminhe 1km com Red Bull', points: 150, completed: false, targetDistance: 1000 },
      { id: 'm5', type: 'photo', title: 'Momento Esportivo', description: 'Tire uma foto de você praticando o seu esporte favorito', points: 200, completed: false }
    ]
  }
];

export const MOCK_QUIZZES = {
  q1: {
    id: 'q1',
    campaignId: 'c1',
    questions: [
      { id: 'q1_1', text: 'Quantas vezes uma garrafa Powerade pode ser reciclada?', options: ['1 vez', '5 vezes', 'Infinitamente', 'De jeito nenhum'], correctAnswer: 2 },
      { id: 'q1_2', text: 'Qual é o principal benefício dos eletrólitos no Powerade?', options: ['Apenas sabor', 'Reposição de minerais', 'Dar sono', 'Nenhuma das anteriores'], correctAnswer: 1 }
    ]
  }
};
