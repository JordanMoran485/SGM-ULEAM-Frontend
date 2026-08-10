import { useRef, useState } from 'react';
import { Animated } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useAppContext } from '../../context/AppContext';
import { useToast } from '../../components/Toast';
import { getApiErrorMessage, getFieldErrors, isUnauthorized } from '../../services/api';
import { createIncident, validateImage } from '../../services/incidents';
import { normalizePickedAsset, buildLocationString } from './helpers';

// Mapea los nombres de campo del backend a los del formulario.
const FIELD_TO_FORM = {
    title: 'title',
    description: 'description',
    location: 'location',
    image: 'photo',
    foto: 'photo',
    image2: 'photo',
};

export function useReportIncident() {
    const router = useRouter();
    const { token, refreshIncidents, logout } = useAppContext();
    const toast = useToast();

    const [title, setTitle] = useState('');
    const [location, setLocation] = useState('');
    const [description, setDescription] = useState('');
    const [photos, setPhotos] = useState([null, null]);
    const [fullscreenIndex, setFullscreenIndex] = useState(null);
    const [loading, setLoading] = useState(false);
    const [loadingPhoto, setLoadingPhoto] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [errors, setErrors] = useState({});
    const [focused, setFocused] = useState('');
    const [locationType, setLocationType] = useState(null);
    const progressAnim = useRef(new Animated.Value(0)).current;

    const clearError = (field) => setErrors((current) => ({ ...current, [field]: undefined }));

    const setPhoto = (index, asset) => {
        setPhotos((prev) => {
            const next = [...prev];
            next[index] = asset;
            return next;
        });
    };

    // Rechaza formato/tamano en el momento de elegir la foto, no despues de
    // haber subido varios MB para recibir un 422.
    const acceptPickedAsset = (index, rawAsset) => {
        const asset = normalizePickedAsset(rawAsset);
        const problem = validateImage(asset);

        if (problem) {
            toast.warning('Foto no válida', problem);

            if (index === 0) {
                setErrors((current) => ({ ...current, photo: problem }));
            }

            return;
        }

        setPhoto(index, asset);
        if (index === 0) clearError('photo');
    };

    const validate = () => {
        const next = {};

        if (!title.trim()) next.title = 'El asunto es obligatorio.';
        if (!location.trim() && !locationType) next.location = 'La ubicacion es obligatoria.';
        if (!description.trim()) next.description = 'La descripcion es obligatoria.';
        if (!photos[0]) next.photo = 'Debes adjuntar al menos una foto.';

        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const handlePickFromLibrary = async (index) => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
            toast.warning('Permiso requerido', 'Debes permitir el acceso a tus fotos.');
            return;
        }

        setLoadingPhoto(index);
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                quality: 0.75,
            });

            if (!result.canceled && result.assets?.[0]) {
                acceptPickedAsset(index, result.assets[0]);
            }
        } finally {
            setLoadingPhoto(null);
        }
    };

    const handleTakePhoto = async (index) => {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
            toast.warning('Permiso requerido', 'Debes permitir el acceso a la camara.');
            return;
        }

        setLoadingPhoto(index);
        try {
            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ['images'],
                quality: 0.75,
            });

            if (!result.canceled && result.assets?.[0]) {
                acceptPickedAsset(index, result.assets[0]);
            }
        } finally {
            setLoadingPhoto(null);
        }
    };

    const handleSubmit = async () => {
        if (!validate()) return;

        setLoading(true);
        setUploadProgress(0);
        progressAnim.setValue(0);

        try {
            await createIncident(
                token,
                {
                    title: title.trim(),
                    location: buildLocationString(locationType, location),
                    description: description.trim(),
                    image: photos[0],
                    image2: photos[1] ?? null,
                },
                (pct) => {
                    setUploadProgress(pct);
                    Animated.timing(progressAnim, {
                        toValue: pct,
                        duration: 150,
                        useNativeDriver: false,
                    }).start();
                },
            );

            await refreshIncidents();
            toast.success('Incidencia reportada', 'La incidencia fue enviada correctamente.');
            router.replace('/(tabs)/Incidents');
        } catch (error) {
            // Sesión muerta: avisar y llevar al login, no dejar al usuario
            // reintentando el envío en bucle contra un token revocado.
            if (isUnauthorized(error)) {
                toast.error('Sesión expirada', 'Vuelve a iniciar sesión.');
                logout();
                router.replace('/login');
                return;
            }

            // 422: marcar en rojo el campo concreto que rechazó el servidor.
            const fieldErrors = getFieldErrors(error);

            if (fieldErrors) {
                const mapped = {};

                Object.entries(fieldErrors).forEach(([field, message]) => {
                    const formField = FIELD_TO_FORM[field];
                    if (formField && !mapped[formField]) {
                        mapped[formField] = message;
                    }
                });

                setErrors((current) => ({ ...current, ...mapped }));
                toast.error('Revisa el formulario', Object.values(fieldErrors)[0]);
                return;
            }

            toast.error('No se pudo reportar', getApiErrorMessage(error));
        } finally {
            setLoading(false);
            setUploadProgress(0);
        }
    };

    return {
        title,
        setTitle,
        location,
        setLocation,
        description,
        setDescription,
        photos,
        fullscreenIndex,
        setFullscreenIndex,
        loading,
        loadingPhoto,
        uploadProgress,
        progressAnim,
        errors,
        focused,
        setFocused,
        locationType,
        setLocationType,
        clearError,
        handleTakePhoto,
        handlePickFromLibrary,
        handleSubmit,
    };
}
