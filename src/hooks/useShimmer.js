import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

export function useShimmer(duration = 750) {
    const shimmer = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        const anim = Animated.loop(
            Animated.sequence([
                Animated.timing(shimmer, { toValue: 1, duration, useNativeDriver: true }),
                Animated.timing(shimmer, { toValue: 0, duration, useNativeDriver: true }),
            ])
        );
        anim.start();
        return () => anim.stop();
    }, [shimmer, duration]);
    return shimmer;
}
