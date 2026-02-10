
import React from 'react';
import { User, Ticket, Priority, Status, Category } from './types';

export const MOCK_USERS: User[] = [
  { id: '1', name: 'João Silva', role: 'WORKER' },
  { id: '2', name: 'Carlos Santos', role: 'WORKER' },
  { id: '3', name: 'Maria Souza', role: 'SUPERVISOR' },
  { id: '4', name: 'Admin Geral', role: 'ADMIN' },
];

export const INITIAL_TICKETS: Ticket[] = [
  {
    id: 'CH-102',
    title: 'Refletores da quadra de basquete queimados',
    category: Category.ELECTRICAL,
    location: 'Área Esportiva - Quadra Central',
    priority: Priority.HIGH,
    description: 'Três refletores do lado esquerdo da quadra de basquete não estão acendendo. Moradores reclamaram da escuridão durante os jogos noturnos.',
    photoOpen: 'https://images.unsplash.com/photo-1544919982-b61976f0ba43?auto=format&fit=crop&q=80&w=800',
    requester: 'Vigilante Noturno',
    createdAt: new Date(Date.now() - 3600000 * 3), // 3 hours ago
    slaLimit: new Date(Date.now() + 3600000 * 1),
    status: Status.OPEN,
    materials: [],
    history: [
      { timestamp: new Date(Date.now() - 3600000 * 3), action: 'Abertura do Chamado', user: 'Vigilante Noturno' }
    ]
  },
  {
    id: 'CH-105',
    title: 'Grama alta no parquinho infantil',
    category: Category.GARDENING,
    location: 'Praça das Palmeiras - Alameda 4',
    priority: Priority.MEDIUM,
    description: 'A grama na área do playground infantil está muito alta, dificultando a circulação das crianças e gerando risco de insetos. Necessário roçagem urgente.',
    photoOpen: 'https://images.unsplash.com/photo-1596435308126-09689e47228a?auto=format&fit=crop&q=80&w=800',
    requester: 'Moradora Ana (Casa 42)',
    createdAt: new Date(Date.now() - 3600000 * 24), // 24 hours ago
    slaLimit: new Date(Date.now() + 3600000 * 48),
    status: Status.QUEUED,
    assignedTo: 'João Silva',
    materials: [],
    history: [
      { timestamp: new Date(Date.now() - 3600000 * 24), action: 'Abertura do Chamado', user: 'Moradora Ana (Casa 42)' },
      { timestamp: new Date(Date.now() - 3600000 * 22), action: 'Aprovado por Supervisor', user: 'Maria Souza' }
    ]
  },
  {
    id: 'CH-108',
    title: 'Reparo em guia de calçada',
    category: Category.CIVIL,
    location: 'Alameda dos Ipês - em frente à Casa 115',
    priority: Priority.LOW,
    description: 'Guia de calçada danificada após manobra de caminhão de entrega. Necessário reconstruir pequeno trecho.',
    photoOpen: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=800',
    requester: 'Fiscal de Alameda',
    createdAt: new Date(Date.now() - 3600000 * 48),
    slaLimit: new Date(Date.now() + 3600000 * 72),
    status: Status.FINALIZED,
    assignedTo: 'Carlos Santos',
    finishedAt: new Date(Date.now() - 3600000 * 2),
    technicalNote: 'Reparo concluído com massa de cimento rápida. Pintura da guia realizada.',
    materials: ['Cimento', 'Areia', 'Tinta Branca'],
    history: [
      { timestamp: new Date(Date.now() - 3600000 * 48), action: 'Abertura do Chamado', user: 'Fiscal de Alameda' },
      { timestamp: new Date(Date.now() - 3600000 * 2), action: 'Finalizado com Sucesso', user: 'Carlos Santos' }
    ]
  }
];
