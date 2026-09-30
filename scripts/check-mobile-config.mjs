import fs from 'node:fs';

const app = JSON.parse(fs.readFileSync(new URL('../app.json', import.meta.url), 'utf8'));
const expo = app.expo ?? {};
const errors = [];

function requireValue(condition, message) {
  if (!condition) errors.push(message);
}

const iosBundle = expo.ios?.bundleIdentifier;
const androidPackage = expo.android?.package;
const permissions = expo.android?.permissions ?? [];
const plugins = expo.plugins ?? [];

requireValue(expo.scheme === 'voxa', 'expo.scheme must remain "voxa" for auth deep links.');
requireValue(Boolean(expo.version), 'expo.version is required.');
requireValue(Boolean(expo.ios?.buildNumber), 'expo.ios.buildNumber is required.');
requireValue(Number.isInteger(expo.android?.versionCode), 'expo.android.versionCode must be an integer.');
requireValue(Boolean(iosBundle), 'iOS bundleIdentifier is required.');
requireValue(Boolean(androidPackage), 'Android package is required.');
requireValue(
  iosBundle === androidPackage,
  'iOS bundleIdentifier and Android package should match for this project.',
);
requireValue(
  Boolean(expo.ios?.infoPlist?.NSMicrophoneUsageDescription),
  'NSMicrophoneUsageDescription is required for voice practice.',
);
requireValue(
  permissions.includes('android.permission.RECORD_AUDIO'),
  'Android RECORD_AUDIO permission is required.',
);
requireValue(
  permissions.includes('android.permission.MODIFY_AUDIO_SETTINGS'),
  'Android MODIFY_AUDIO_SETTINGS permission is required.',
);
requireValue(
  new Set(permissions).size === permissions.length,
  'Android permissions contain duplicates.',
);

for (const requiredPlugin of [
  'expo-router',
  'expo-secure-store',
  'expo-audio',
  '@edkimmel/expo-audio-stream/app.plugin.js',
  'expo-asset',
]) {
  requireValue(
    plugins.some((plugin) =>
      Array.isArray(plugin) ? plugin[0] === requiredPlugin : plugin === requiredPlugin,
    ),
    `Missing required Expo plugin: ${requiredPlugin}`,
  );
}

requireValue(
  expo.runtimeVersion?.policy === 'appVersion',
  'runtimeVersion policy should remain appVersion for release consistency.',
);
requireValue(
  typeof expo.updates?.url === 'string' && expo.updates.url.startsWith('https://u.expo.dev/'),
  'Expo Updates URL is missing or invalid.',
);

if (errors.length > 0) {
  console.error('Mobile config sanity check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(
  `Mobile config OK: ${expo.name} ${expo.version} · iOS ${expo.ios.buildNumber} · Android ${expo.android.versionCode}`,
);
