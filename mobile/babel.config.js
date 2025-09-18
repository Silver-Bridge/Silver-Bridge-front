// babel.config.js (Expo)
module.exports = function (api) {
    api.cache(true);
    return {
        presets: [
            ["babel-preset-expo", { jsxImportSource: "nativewind" }],
            "nativewind/babel",                 // ← preset 으로 추가
        ],
        plugins: [
            ['module:react-native-dotenv', {
                moduleName: '@env',
                path: '.env',
                safe: false,
                allowUndefined: true,
            }],
            "react-native-worklets/plugin",     // ← Reanimated 4: 항상 마지막
        ],
    };
};
