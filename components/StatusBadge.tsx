
import React from 'react';
import { Status, Priority } from '../types';

export const StatusBadge: React.FC<{ status: Status }> = ({ status }) => {
  const styles: Record<Status, string> = {
    [Status.OPEN]: 'bg-blue-50 text-blue-600 border-blue-100',
    [Status.QUEUED]: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    [Status.IN_PROGRESS]: 'bg-amber-50 text-amber-600 border-amber-100',
    [Status.AWAITING_MATERIAL]: 'bg-orange-50 text-orange-600 border-orange-100',
    [Status.BLOCKED]: 'bg-rose-50 text-rose-600 border-rose-100',
    [Status.FINALIZED]: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-sm ${styles[status]}`}>
      {status}
    </span>
  );
};

export const PriorityBadge: React.FC<{ priority: Priority }> = ({ priority }) => {
  const styles: Record<Priority, string> = {
    [Priority.HIGH]: 'bg-red-500 text-white shadow-red-200',
    [Priority.MEDIUM]: 'bg-amber-400 text-white shadow-amber-100',
    [Priority.LOW]: 'bg-emerald-400 text-white shadow-emerald-100',
  };

  return (
    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase shadow-sm ${styles[priority]}`}>
      {priority}
    </span>
  );
};
