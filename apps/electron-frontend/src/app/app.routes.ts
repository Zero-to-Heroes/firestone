import { Route } from '@angular/router';

export const appRoutes: Route[] = [
	{
		path: '',
		redirectTo: '/overlay',
		pathMatch: 'full',
	},
	{
		path: 'overlay',
		loadComponent: () => import('./overlay/electron-overlay.component').then(m => m.ElectronOverlayComponent),
	},
];
