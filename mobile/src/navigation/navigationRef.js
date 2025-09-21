// src/navigation/navigationRef.js
import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

export function resetTo(name, params) {
    if (navigationRef.isReady()) {
        navigationRef.reset({
            index: 0,
            routes: [{ name, params }],
        });
    }
}
