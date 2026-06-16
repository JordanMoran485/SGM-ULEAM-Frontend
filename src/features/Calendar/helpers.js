export const STATUS_ORDER = { pending: 0, in_progress: 1, completed: 2, resolved: 2, cancelled: 3 };
export const DAY_NAMES   = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
export const DAY_HEADERS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export function firstRole(user) {
    if (Array.isArray(user?.roles) && user.roles[0]?.name) return user.roles[0].name;
    return user?.role || user?.cargo || null;
}

export function getStatusConfig(status) {
    if (status === 'completed' || status === 'resolved')
        return { stripe: '#22C55E', bg: '#DCFCE7', color: '#16A34A', label: 'Completada' };
    if (status === 'in_progress')
        return { stripe: '#4A6CF7', bg: '#E8EDFF', color: '#2D3FE0', label: 'En progreso' };
    return { stripe: '#F59E0B', bg: '#FEF3C7', color: '#D97706', label: 'Pendiente' };
}

export function getDateSource(item) { return item.startAt || item.dueDate || item.updatedAt || item.createdAt || null; }
export function hasScheduledDate(item) { return Boolean(item?.startAt || item?.dueDate); }

export function getDateKey(rawDate) {
    if (!rawDate) return 'Sin fecha';
    const parsed = new Date(rawDate);
    if (Number.isNaN(parsed.getTime())) return 'Sin fecha';
    return parsed.toISOString().slice(0, 10);
}
export function formatDateLabel(dateKey) {
    if (dateKey === 'Sin fecha') return dateKey;
    return new Intl.DateTimeFormat('es-EC', { weekday: 'short', day: 'numeric', month: 'short' })
        .format(new Date(`${dateKey}T12:00:00`));
}
export function formatDateLong(dateKey) {
    if (dateKey === 'Sin fecha') return 'Tareas sin fecha asignada';
    return new Intl.DateTimeFormat('es-EC', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
        .format(new Date(`${dateKey}T12:00:00`));
}
export function getTodayReference() { const t = new Date(); t.setHours(0, 0, 0, 0); return t; }
export function getDateRelation(dateKey, today = getTodayReference()) {
    if (dateKey === 'Sin fecha') return 'undated';
    const parsed = new Date(`${dateKey}T12:00:00`);
    if (Number.isNaN(parsed.getTime())) return 'undated';
    parsed.setHours(0, 0, 0, 0);
    if (parsed.getTime() < today.getTime()) return 'past';
    if (parsed.getTime() === today.getTime()) return 'today';
    return 'upcoming';
}
export function getSectionBadgeLabel(dateKey, today = getTodayReference()) {
    const r = getDateRelation(dateKey, today);
    if (r === 'today') return 'Hoy';
    if (r === 'upcoming') return 'Próxima';
    if (r === 'past') return 'Pasada';
    return 'Sin fecha';
}
export function getSectionBadgeColor(dateKey, today = getTodayReference()) {
    const r = getDateRelation(dateKey, today);
    if (r === 'today') return { bg: '#E8EDFF', color: '#2D3FE0' };
    if (r === 'upcoming') return { bg: '#DCFCE7', color: '#16A34A' };
    if (r === 'past') return { bg: '#FEF3C7', color: '#D97706' };
    return { bg: '#F1F3FF', color: '#8F95B2' };
}
export function compareSectionKeys(left, right, today = getTodayReference()) {
    const order = { today: 0, upcoming: 1, past: 2, undated: 3 };
    const diff = order[getDateRelation(left, today)] - order[getDateRelation(right, today)];
    if (diff !== 0) return diff;
    if (getDateRelation(left, today) === 'upcoming') return left.localeCompare(right);
    if (getDateRelation(left, today) === 'past') return right.localeCompare(left);
    return left.localeCompare(right);
}
export function isTaskForCurrentUser(item, user) {
    if (!user) return false;
    const fullName = [user.name, user.lastname].filter(Boolean).join(' ').trim().toUpperCase();
    const assigned = (item.assignedCleanerName || '').trim().toUpperCase();
    return String(item.userId || '') === String(user.id || '') || (fullName && assigned && fullName === assigned);
}
export function escapeHtml(v) {
    return String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// ─── Ecuador date utilities (UTC-5) ─────────────────────────────────────────
export function toEcuadorStr(d) {
    const ec = new Date(d.getTime() - 5 * 60 * 60 * 1000);
    return `${ec.getUTCFullYear()}-${String(ec.getUTCMonth() + 1).padStart(2, '0')}-${String(ec.getUTCDate()).padStart(2, '0')}`;
}
export function ecAddDays(dateStr, n) {
    const [y, m, d] = dateStr.split('-').map(Number);
    const u = new Date(Date.UTC(y, m - 1, d + n, 12));
    return `${u.getUTCFullYear()}-${String(u.getUTCMonth() + 1).padStart(2, '0')}-${String(u.getUTCDate()).padStart(2, '0')}`;
}
export function ecAddMonths(dateStr, n) {
    const [y, m, d] = dateStr.split('-').map(Number);
    const u = new Date(Date.UTC(y, m - 1 + n, d, 12));
    return `${u.getUTCFullYear()}-${String(u.getUTCMonth() + 1).padStart(2, '0')}-${String(u.getUTCDate()).padStart(2, '0')}`;
}
export function ecStartOfWeek(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dow = new Date(Date.UTC(y, m - 1, d, 12)).getUTCDay();
    return ecAddDays(dateStr, -((dow + 6) % 7));
}
export function buildEcWeekDays(anchorStr) {
    const mon = ecStartOfWeek(anchorStr);
    return Array.from({ length: 7 }, (_, i) => ecAddDays(mon, i));
}
export function buildEcMonthGrid(anchorStr) {
    const [y, m] = anchorStr.split('-').map(Number);
    const firstDay = `${y}-${String(m).padStart(2, '0')}-01`;
    const lastUTC  = new Date(Date.UTC(y, m, 0));
    const lastDay  = `${lastUTC.getUTCFullYear()}-${String(lastUTC.getUTCMonth() + 1).padStart(2, '0')}-${String(lastUTC.getUTCDate()).padStart(2, '0')}`;
    const start    = ecStartOfWeek(firstDay);
    const days = [];
    let cur = start;
    while (cur <= lastDay || days.length % 7 !== 0) {
        days.push(cur);
        cur = ecAddDays(cur, 1);
        if (days.length >= 42) break;
    }
    return { days, month: m };
}
export function ecDayName(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number);
    return DAY_NAMES[new Date(Date.UTC(y, m - 1, d, 12)).getUTCDay()];
}
export function ecDayNum(dateStr)   { return Number(dateStr.split('-')[2]); }
export function ecMonthNum(dateStr) { return Number(dateStr.split('-')[1]); }
export function ecMonthYearLabel(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Intl.DateTimeFormat('es-EC', { month: 'long', year: 'numeric' })
        .format(new Date(Date.UTC(y, m - 1, d, 12)))
        .replace(/^\w/, (c) => c.toUpperCase());
}

// ─── PDF export helpers ──────────────────────────────────────────────────────
function formatTimeLabel(h) { return `${String(h).padStart(2, '0')}:00 - ${String(h + 1).padStart(2, '0')}:00`; }
function sameDay(a, b) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }
function getTaskStart(item) {
    const raw = item.startAt || item.dueDate || item.createdAt;
    if (!raw) return null;
    const p = new Date(raw); if (isNaN(p)) return null;
    if (!item.startAt && item.dueDate) p.setHours(6, 0, 0, 0);
    return p;
}
function getTaskEnd(item) {
    const s = getTaskStart(item); if (!s) return null;
    if (item.endAt) { const p = new Date(item.endAt); if (!isNaN(p)) return p; }
    const e = new Date(s); e.setHours(s.getHours() + 1, s.getMinutes(), 0, 0); return e;
}
function taskBelongsToSlot(task, dayDate, hour) {
    const start = getTaskStart(task);
    if (!start || !sameDay(start, dayDate)) return false;
    if (task.allDay) return hour === 6;
    const end = getTaskEnd(task) || start;
    const ss = new Date(dayDate); ss.setHours(hour, 0, 0, 0);
    const se = new Date(dayDate); se.setHours(hour + 1, 0, 0, 0);
    return start < se && end > ss;
}

export function buildScheduleHtml(items, user, selectedDate) {
    const anchorStr = (selectedDate && selectedDate !== 'Sin fecha') ? selectedDate : toEcuadorStr(new Date());
    const monStr    = ecStartOfWeek(anchorStr);
    const weekDays  = Array.from({ length: 7 }, (_, i) => {
        const s = ecAddDays(monStr, i);
        const [y, m, d] = s.split('-').map(Number);
        return new Date(Date.UTC(y, m - 1, d, 12));
    });
    const hourSlots   = Array.from({ length: 14 }, (_, i) => 6 + i);
    const headerCells = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((d) => `<th>${escapeHtml(d)}</th>`).join('');
    const bodyRows = hourSlots.map((hour) => {
        const dayCells = weekDays.map((dayDate) => {
            const slotTasks = items.filter((t) => taskBelongsToSlot(t, dayDate, hour));
            const content = slotTasks.length
                ? slotTasks.map((t) => `<div class="task-card ${t.allDay ? 'all-day' : ''}"><div class="task-title">${escapeHtml(t.title || 'Tarea sin título')}</div></div>`).join('')
                : '<div class="empty-slot"></div>';
            return `<td>${content}</td>`;
        }).join('');
        return `<tr><th class="hour-cell">${escapeHtml(formatTimeLabel(hour))}</th>${dayCells}</tr>`;
    }).join('');

    return `<html><head><meta charset="utf-8"/><style>
        @page{size:A4 landscape;margin:8mm}
        body{font-family:Arial,sans-serif;color:#1A1F36;padding:0;margin:0}
        table{width:100%;border-collapse:collapse;table-layout:fixed}
        th{background:#E8EDFF;color:#2D3FE0;font-size:11px;text-transform:uppercase;letter-spacing:.4px;text-align:center}
        th,td{border:1px solid #E8EDFF;padding:3px;vertical-align:top;font-size:10px}
        .hour-cell{width:68px;background:#F1F3FF;font-weight:bold;text-align:left}
        td{height:44px;background:#fff}
        .task-card{background:#E8EDFF;border-left:3px solid #4A6CF7;border-radius:4px;padding:3px 4px;margin-bottom:2px}
        .task-card.all-day{background:#FEF3C7;border-left-color:#F59E0B}
        .task-title{font-size:9px;font-weight:bold;color:#1A1F36;line-height:1.15}
        .empty-slot{min-height:34px}
    </style></head><body>
        <table><thead><tr><th class="hour-cell">Hora</th>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table>
    </body></html>`;
}
