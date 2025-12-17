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
                headerBackTitleVisible: false,
                headerBackTitle: '',
            }}
        >
            <Stack.Screen
                name="CalendarMain"
                component={CalendarScreen}
                options={{    headerShown: false,
                    title: '',  }}
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