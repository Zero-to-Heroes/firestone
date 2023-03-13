import { Route } from '@angular/router';
import { WebsiteBattlegroundsComponent } from '@firestone/website/battlegrounds';

export const appRoutes: Route[] = [
	{
		path: 'battlegrounds',
		component: WebsiteBattlegroundsComponent,
	},
	{
		path: '',
		redirectTo: '/battlegrounds',
		pathMatch: 'full',
	},
	{
		path: '**',
		redirectTo: '/battlegrounds',
		pathMatch: 'full',
	},
];
