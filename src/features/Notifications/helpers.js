export function formatRelativeDate(value) {
    if (!value) return 'Ahora';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '—';
    const diff = (Date.now() - parsed.getTime()) / 1000;
    if (diff < 60)    return 'Ahora';
    if (diff < 3600)  return `hace ${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `hace ${Math.floor(diff / 3600)}h`;
    return new Intl.DateTimeFormat('es-EC', { day: 'numeric', month: 'short' }).format(parsed);
}

export function parseWeekLabel(weekLabel) {
    if (!weekLabel) return null;
    const part = String(weekLabel).split('–')[0].trim();
    const [d, m, y] = part.split('/');
    if (!d || !m || !y) return null;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

export function getNotificationType(notification) {
    if (notification.notificationType === 'incident_rejected')
        return { label: 'Rechazada',    bg: '#FFE4E8', text: '#F43F5E', stripe: '#F43F5E' };
    if (notification.notificationType === 'incident_accepted')
        return { label: 'Aprobada',     bg: '#DCFCE7', text: '#22C55E', stripe: '#22C55E' };
    if (notification.notificationType === 'task_unlinked')
        return { label: 'Desvinculada', bg: '#FFE4E8', text: '#F43F5E', stripe: '#F43F5E' };
    if (notification.notificationType === 'week_summary')
        return { label: 'Semana',       bg: '#E8EDFF', text: '#2D3FE0', stripe: '#4A6CF7' };
    if (notification.notificationType === 'task_assigned' || notification.taskId)
        return { label: 'Tarea',        bg: '#E8EDFF', text: '#2D3FE0', stripe: '#4A6CF7' };
    if (notification.incidentId)
        return { label: 'Incidencia',   bg: '#E8F8FB', text: '#06B6D4', stripe: '#4A6CF7' };
    return     { label: 'Sistema',      bg: '#F1F3FF', text: '#8F95B2', stripe: '#4A6CF7' };
}
