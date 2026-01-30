import { Route } from '@angular/router';
import { ElectronOverlayComponent } from './overlay/electron-overlay.component';
import { ElectronSettingsComponent } from './overlay/electron-settings.component';

export const appRoutes: Route[] = [
	{
		path: '',
		redirectTo: '/overlay',
		pathMatch: 'full',
	},
	{
		path: 'overlay',
		component: ElectronOverlayComponent,
	},
	{
		path: 'settings',
		component: ElectronSettingsComponent,
	},
];
