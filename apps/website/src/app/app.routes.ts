import { Route } from '@angular/router';
import { WebsiteBattlegroundsComponent } from '@firestone/website/battlegrounds';
import { WebsitePremiumComponent } from '@firestone/website/core';
import { AuthGuard } from './auth-guard.service';

export const appRoutes: Route[] = [
	{
		path: 'battlegrounds',
		component: WebsiteBattlegroundsComponent,
		canActivate: [AuthGuard],
	},
	{
		path: 'premium',
		component: WebsitePremiumComponent,
	},
	{
		path: 'become-premium',
		redirectTo: '/premium',
		pathMatch: 'full',
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
