// mobile/src/shared/components/AlarmWatcher.js

import React from 'react';
import { useAlarmPolling } from '../hooks/useAlarmPolling';

export default function AlarmWatcher() {
    useAlarmPolling(); // ✅ 앱 살아 있는 동안 알람 폴링
    return null;       // 화면에는 아무것도 안 그림
}
