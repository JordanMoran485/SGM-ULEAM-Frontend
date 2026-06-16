import { Dimensions } from 'react-native';

export const CARD_W   = Dimensions.get('window').width - 40;
export const CHART_H  = 108;
export const DOT_R    = 5;
export const DOT_D    = DOT_R * 2;
export const USABLE_W = CARD_W - 32;

export const SPACE_TYPES = new Set(['Baño', 'Aula', 'Pasillo', 'Exteriores', 'Escaleras']);

export const SPACE_ICONS = {
    'Baño':       'toilet',
    'Aula':       'school-outline',
    'Pasillo':    'walk',
    'Exteriores': 'tree-outline',
    'Escaleras':  'stairs',
};

export function getInitials(name) {
    if (!name) return 'U';
    return name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('');
}

export function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos días';
    if (h < 18) return 'Buenas tardes';
    return 'Buenas noches';
}

export function formatRelative(value) {
    if (!value) return '';
    const diff = (Date.now() - new Date(value).getTime()) / 1000;
    if (diff < 60) return 'Ahora';
    if (diff < 3600) return `hace ${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `hace ${Math.floor(diff / 3600)}h`;
    return new Intl.DateTimeFormat('es-EC', { day: 'numeric', month: 'short' }).format(new Date(value));
}

export function getSpaceIcon(spaceType) {
    return SPACE_ICONS[spaceType] || 'alert-circle-outline';
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

export function getStatusConfig(status) {
    if (status === 'completed')   return { stripe: '#22C55E', iconBg: '#DCFCE7', iconColor: '#22C55E' };
    if (status === 'in_progress') return { stripe: '#4A6CF7', iconBg: '#E8EDFF', iconColor: '#4A6CF7' };
    return { stripe: '#F59E0B', iconBg: '#FEF3C7', iconColor: '#F59E0B' };
}
