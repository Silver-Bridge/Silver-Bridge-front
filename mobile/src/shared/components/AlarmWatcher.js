// mobile/src/shared/components/AlarmWatcher.js

import React from 'react';
import { useAlarmPolling } from '../hooks/useAlarmPolling';

export default function AlarmWatcher() {
    useAlarmPolling();
    return null;
}
