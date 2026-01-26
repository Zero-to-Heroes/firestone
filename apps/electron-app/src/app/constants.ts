export const rendererAppPort = 4200;
export const rendererAppName = 'apps/electron-frontend'; // options.name.split('-')[0] + '-web'
export const electronAppName = 'electron-app';
// Note: electron-updater reads the update server URL from electron-builder.yml publish configuration
// This constant is kept for reference but is not used by the auto-updater
export const updateServerUrl = 'https://deployment-server-url.com'; // Not used - configure publish in electron-builder.yml instead
