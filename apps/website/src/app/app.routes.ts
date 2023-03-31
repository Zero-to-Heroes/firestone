import { Route } from '@angular/router';
import { WebsiteBattlegroundsComponent } from '@firestone/website/battlegrounds';
import { WebsitePremiumComponent } from '@firestone/website/core';
import { WebsiteDuelsComponent } from '@firestone/website/duels';
import { AuthGuard } from './auth-guard.service';
import { PremiumRedirectGuard } from './premium-redirect.service';

export const appRoutes: Route[] = [
	{
		path: 'battlegrounds',
		component: WebsiteBattlegroundsComponent,
		canActivate: [AuthGuard],
	},
	{
		path: 'duels',
		component: WebsiteDuelsComponent,
		canActivate: [AuthGuard],
	},
	{
		path: 'premium',
		component: WebsitePremiumComponent,
		canActivate: [PremiumRedirectGuard],
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
