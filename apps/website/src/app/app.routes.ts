import { Route } from '@angular/router';
import { WebsiteBattlegroundsComponent } from '@firestone/website/battlegrounds';
import { WebsiteAuthComponent, WebsitePremiumComponent } from '@firestone/website/core';
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
		pathMatch: 'prefix',
	},
	{
		path: 'owAuth',
		component: WebsiteAuthComponent,
		pathMatch: 'prefix',
	},
	{
		path: '',
		redirectTo: '/battlegrounds',
		pathMatch: 'prefix',
	},
	{
		path: '**',
		redirectTo: '/battlegrounds',
		pathMatch: 'prefix',
	},
];
