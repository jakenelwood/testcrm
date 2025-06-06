import React from 'react';
import { Icons } from './icons';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: keyof typeof Icons;
}

export function EmptyState({ title, description, icon = 'fileText' }: EmptyStateProps) {
  const Icon = Icons[icon];

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
        <Icon className="h-10 w-10 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
