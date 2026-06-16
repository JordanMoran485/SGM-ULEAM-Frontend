export const FILTERS = [
    { key: 'all',         label: 'Todas' },
    { key: 'pending',     label: 'Pendientes' },
    { key: 'in_progress', label: 'En progreso' },
    { key: 'completed',   label: 'Completadas' },
];

export function getStatusConfig(status) {
    if (status === 'completed')   return { stripe: '#22C55E', bg: '#DCFCE7', color: '#16A34A', label: 'Completada' };
    if (status === 'in_progress') return { stripe: '#4A6CF7', bg: '#E8EDFF', color: '#2D3FE0', label: 'En progreso' };
    return { stripe: '#F59E0B', bg: '#FEF3C7', color: '#D97706', label: 'Pendiente' };
}

export function firstRole(user) {
    if (Array.isArray(user?.roles) && user.roles[0]?.name) return user.roles[0].name;
    return user?.role || user?.cargo || null;
}

export function isTaskForCurrentUser(item, user) {
    if (!user) return false;
    const fullName     = [user.name, user.lastname].filter(Boolean).join(' ').trim().toUpperCase();
    const assignedName = (item.assignedCleanerName || '').trim().toUpperCase();
    return (
        String(item.userId || '') === String(user.id || '') ||
        (fullName && assignedName && fullName === assignedName)
    );
}

export function formatTaskDate(item) {
    const raw = item?.startAt || item?.dueDate || item?.createdAt;
    if (!raw) return 'Sin fecha';
    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) return 'Sin fecha';
    const diff = (Date.now() - parsed.getTime()) / 1000;
    if (diff < 60)    return 'Ahora';
    if (diff < 3600)  return `hace ${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `hace ${Math.floor(diff / 3600)}h`;
    return new Intl.DateTimeFormat('es-EC', { day: 'numeric', month: 'short' }).format(parsed);
}
