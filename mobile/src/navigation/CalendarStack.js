// 예: mobile/src/navigation/CalendarStack.js

import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CalendarScreen from '../screens/calendar/CalendarScreen';
import ScheduleAddScreen from '../screens/calendar/ScheduleAddScreen';
import ScheduleEditScreen from '../screens/calendar/ScheduleEditScreen';

const Stack = createNativeStackNavigator();


export default function CalendarStack() {
    return (
        <Stack.Navigator
            screenOptions={{
                headerBackTitleVisible: false, // 🔹 모든 화면에서 "< 제목"의 "제목" 숨김
                headerBackTitle: '',           // 🔹 혹시 모를 잔재까지 제거
            }}
        >
            <Stack.Screen
                name="CalendarMain"
                component={CalendarScreen}
                options={{    headerShown: false,
                    title: '',  }} // 우리는 캘린더 내부에서 커스텀 헤더 쓰니까
            />

            <Stack.Screen
                name="ScheduleAdd"
                component={ScheduleAddScreen}
                options={{
                    title: '일정 추가',
                    headerBackTitleVisible: false,
                    headerBackTitle: '',
                }}
            />

            <Stack.Screen
                name="ScheduleEdit"
                component={ScheduleEditScreen}
                options={{
                    title: '일정 수정',
                    headerBackTitleVisible: false,
                    headerBackTitle: '',
                }}
            />
        </Stack.Navigator>
    );
}