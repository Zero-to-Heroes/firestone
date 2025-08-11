import { Routes } from '@angular/router';
import {
	ArenaCardsComponent,
	ArenaClassesComponent,
	AuthCallbackComponent,
	BattlegroundsCardsComponent,
	BattlegroundsCompositionsComponent,
	BattlegroundsHeroesComponent,
	ConstructedComponent,
	LoginComponent,
	WebShellComponent,
} from '@firestone/shared/web-shell';

export const routes: Routes = [
	// Main app with shell (header/nav)
	{
		path: '',
		component: WebShellComponent,
		children: [
			{ path: '', redirectTo: 'battlegrounds', pathMatch: 'full' },
			{ path: 'login', component: LoginComponent },
			{ path: 'auth-callback', component: AuthCallbackComponent },
			{ path: 'battlegrounds', redirectTo: 'battlegrounds/heroes', pathMatch: 'full' },
			{ path: 'battlegrounds/heroes', component: BattlegroundsHeroesComponent },
			{ path: 'battlegrounds/comps', component: BattlegroundsCompositionsComponent },
			{ path: 'battlegrounds/comps/:compSlug', component: BattlegroundsCompositionsComponent },
			{ path: 'battlegrounds/cards', component: BattlegroundsCardsComponent },
			{ path: 'arena', redirectTo: 'arena/classes', pathMatch: 'full' },
			{ path: 'arena/classes', component: ArenaClassesComponent },
			{ path: 'arena/cards', component: ArenaCardsComponent },
			{ path: 'constructed', component: ConstructedComponent },
			// Wildcard route - must be last
			{ path: '**', redirectTo: 'battlegrounds', pathMatch: 'full' },
		],
	},
];
