
import { Priority } from './types';

export const calculateSLA = (priority: Priority, startDate: Date): Date => {
  const limit = new Date(startDate);
  switch (priority) {
    case Priority.HIGH:
      limit.setHours(limit.getHours() + 4);
      break;
    case Priority.MEDIUM:
      limit.setHours(limit.getHours() + 24);
      break;
    case Priority.LOW:
      limit.setHours(limit.getHours() + 72);
      break;
  }
  return limit;
};

export const getSLAAura = (limit: Date, status: string) => {
  if (status === 'FINALIZADO') return 'text-gray-500';
  const now = new Date();
  const diff = limit.getTime() - now.getTime();
  const diffHours = diff / (1000 * 60 * 60);

  if (diff < 0) return 'text-red-600 font-bold';
  if (diffHours < 2) return 'text-amber-500 font-medium';
  return 'text-emerald-600';
};

export const formatTimeDiff = (start: Date, end: Date = new Date()) => {
  const diff = Math.abs(end.getTime() - start.getTime());
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
};
