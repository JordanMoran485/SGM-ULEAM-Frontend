export const FILTERS = [
    { key: 'all',       label: 'Todas' },
    { key: 'pending',   label: 'Pendiente' },
    { key: 'revisada',  label: 'Revisada' },
    { key: 'rechazada', label: 'Rechazada' },
];

export const SPACE_TYPES = new Set(['Baño', 'Aula', 'Pasillo', 'Exteriores', 'Escaleras']);

export const SPACE_TYPE_ICONS = {
    'Baño':       'toilet',
    'Aula':       'school-outline',
    'Pasillo':    'door-open',
    'Exteriores': 'tree-outline',
    'Escaleras':  'stairs',
};

export function getEffectiveStatus(status, approvalStatus) {
    if (approvalStatus === 'Rechazada') return 'rechazada';
    if (status === 'completed')         return 'completed';
    if (status === 'in_progress')       return 'in_progress';
    if (approvalStatus === 'Aceptada')  return 'revisada';
    return 'pending';
}

export function getStatusConfig(effectiveStatus) {
    switch (effectiveStatus) {
        case 'rechazada':   return { stripe: '#F43F5E', badgeBg: '#FFE4E8', badgeText: '#F43F5E', iconBg: '#FFE4E8', iconColor: '#F43F5E', label: 'Rechazada' };
        case 'completed':   return { stripe: '#22C55E', badgeBg: '#DCFCE7', badgeText: '#16A34A', iconBg: '#DCFCE7', iconColor: '#22C55E', label: 'Completada' };
        case 'in_progress': return { stripe: '#4A6CF7', badgeBg: '#E8EDFF', badgeText: '#2D3FE0', iconBg: '#E8EDFF', iconColor: '#4A6CF7', label: 'En progreso' };
        case 'revisada':    return { stripe: '#06B6D4', badgeBg: '#E8F8FB', badgeText: '#06B6D4', iconBg: '#E8F8FB', iconColor: '#06B6D4', label: 'Revisada' };
        default:            return { stripe: '#F59E0B', badgeBg: '#FEF3C7', badgeText: '#D97706', iconBg: '#FEF3C7', iconColor: '#F59E0B', label: 'Pendiente' };
    }
}

export function parseLocation(location) {
    if (!location) return { spaceType: null, address: null };
    const sep = location.indexOf(' - ');
    if (sep !== -1) {
        const candidate = location.slice(0, sep);
        if (SPACE_TYPES.has(candidate)) {
            return { spaceType: candidate, address: location.slice(sep + 3) || null };
        }
    }
    return { spaceType: null, address: location };
}

export function formatRelative(value) {
    if (!value) return '';
    const diff = (Date.now() - new Date(value).getTime()) / 1000;
    if (diff < 60)    return 'Ahora';
    if (diff < 3600)  return `hace ${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `hace ${Math.floor(diff / 3600)}h`;
    return new Intl.DateTimeFormat('es-EC', { day: 'numeric', month: 'short' }).format(new Date(value));
}
