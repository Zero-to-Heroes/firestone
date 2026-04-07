import { Routes } from '@angular/router';
import { AuthCallbackComponent, LoginComponent, routes as sharedRoutes, WebShellComponent } from '@firestone/shared/web-shell';
import { InGameReplayRedirectComponent } from './in-game-replay-redirect/in-game-replay-redirect.component';

// Transform shared routes for use as children (convert absolute redirects to relative)
const transformRoutesForChildren = (routes: Routes): Routes => {
	return routes
		.filter((route) => route.path !== '' && route.path !== '**') // Exclude root redirect and wildcard (handled separately)
		.map((route) => {
			if (route.redirectTo && typeof route.redirectTo === 'string' && route.redirectTo.startsWith('/')) {
				// Convert absolute redirect to relative for children context
				return {
					...route,
					redirectTo: route.redirectTo.substring(1),
				};
			}
			return route;
		});
};

export const routes: Routes = [
	// Shareable in-game replay link - redirects to firestoneapp:// protocol
	{ path: 'in-game-replay/:reviewId', component: InGameReplayRedirectComponent },
	// Main app with shell (header/nav)
	{
		path: '',
		component: WebShellComponent,
		children: [
			{ path: '', redirectTo: 'battlegrounds/heroes', pathMatch: 'full' },
			{ path: 'login', component: LoginComponent },
			{ path: 'auth-callback', component: AuthCallbackComponent },
			{
				path: 'premium',
				loadComponent: () =>
					import('./premium/premium-page.component').then((m) => m.PremiumPageComponent),
			},
			...transformRoutesForChildren(sharedRoutes),
			// Wildcard route - must be last
			{ path: '**', redirectTo: 'battlegrounds/heroes', pathMatch: 'full' },
		],
	},
];
