export const LOCATION_TYPES = [
    { key: 'bathroom',  label: 'Baño',       icon: 'toilet' },
    { key: 'classroom', label: 'Aula',        icon: 'school-outline' },
    { key: 'hallway',   label: 'Pasillo',     icon: 'door-open' },
    { key: 'exterior',  label: 'Exteriores',  icon: 'tree-outline' },
    { key: 'stairs',    label: 'Escaleras',   icon: 'stairs' },
];

export function normalizePickedAsset(asset) {
    if (!asset?.uri) return null;
    return {
        uri:      asset.uri,
        fileName: asset.fileName || asset.uri.split('/').pop() || 'incident-photo.jpg',
        mimeType: asset.mimeType || 'image/jpeg',
    };
}

export function buildLocationString(locationType, locationText) {
    const label = LOCATION_TYPES.find((lt) => lt.key === locationType)?.label;
    return [label, locationText.trim() || null].filter(Boolean).join(' - ');
}
