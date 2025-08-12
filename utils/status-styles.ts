export const getStatusStyles = (status: string) => {
  const statusLower = status?.toLowerCase() || '';
  
  switch (statusLower) {
    case 'new':
    case 'fresh':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'contacted':
    case 'in progress':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'qualified':
    case 'interested':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'quoted':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'closed':
    case 'won':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'lost':
    case 'rejected':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'follow up':
    case 'callback':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export const getCustomStatusStyles = (colorHex?: string) => {
  if (!colorHex) return getStatusStyles('');
  
  return `bg-[${colorHex}20] text-[${colorHex}] border-[${colorHex}40]`;
};

export const statusBadgeStyles = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border';
