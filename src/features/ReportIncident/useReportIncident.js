import { useRef, useState } from 'react';
import { Animated } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useAppContext } from '../../context/AppContext';
import { useToast } from '../../components/Toast';
import { getApiErrorMessage } from '../../services/api';
import { createIncident } from '../../services/incidents';
import { normalizePickedAsset, buildLocationString } from './helpers';

export function useReportIncident() {
    const router = useRouter();
    const { token, refreshIncidents } = useAppContext();
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
                setPhoto(index, normalizePickedAsset(result.assets[0]));
                if (index === 0) clearError('photo');
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
                setPhoto(index, normalizePickedAsset(result.assets[0]));
                if (index === 0) clearError('photo');
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
