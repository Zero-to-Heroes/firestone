import { Routes } from '@angular/router';
import { AuthCallbackComponent, LoginComponent, routes as sharedRoutes, WebShellComponent } from '@firestone/shared/web-shell';

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
	// Main app with shell (header/nav)
	{
		path: '',
		component: WebShellComponent,
		children: [
			{ path: '', redirectTo: 'battlegrounds/heroes', pathMatch: 'full' },
			{ path: 'login', component: LoginComponent },
			{ path: 'auth-callback', component: AuthCallbackComponent },
			...transformRoutesForChildren(sharedRoutes),
			// Wildcard route - must be last
			{ path: '**', redirectTo: 'battlegrounds/heroes', pathMatch: 'full' },
		],
	},
];
