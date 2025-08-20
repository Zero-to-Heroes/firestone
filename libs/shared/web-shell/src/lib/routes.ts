import { Routes } from '@angular/router';
import { ArenaCardsComponent } from './components/arena/cards/arena-cards.component';
import { ArenaClassesComponent } from './components/arena/classes/arena-classes.component';
import { BattlegroundsCardsComponent } from './components/battlegrounds/cards/battlegrounds-cards.component';
import { BattlegroundsCompositionsComponent } from './components/battlegrounds/compositions/battlegrounds-compositions.component';
import { BattlegroundsHeroesComponent } from './components/battlegrounds/heroes/battlegrounds-heroes.component';
import { ConstructedComponent } from './components/constructed/constructed.component';

export const routes: Routes = [
	{ path: '', redirectTo: '/battlegrounds', pathMatch: 'full' },
	{ path: 'battlegrounds', redirectTo: '/battlegrounds/heroes', pathMatch: 'full' },
	{ path: 'battlegrounds/heroes', component: BattlegroundsHeroesComponent },
	{ path: 'battlegrounds/comps', component: BattlegroundsCompositionsComponent },
	{ path: 'battlegrounds/comps/:compSlug', component: BattlegroundsCompositionsComponent },
	{ path: 'battlegrounds/cards', component: BattlegroundsCardsComponent },
	{ path: 'arena', redirectTo: '/arena/classes', pathMatch: 'full' },
	{ path: 'arena/classes', component: ArenaClassesComponent },
	{ path: 'arena/cards', component: ArenaCardsComponent },
	{ path: 'constructed', component: ConstructedComponent },
	// Wildcard route - must be last
	{ path: '**', redirectTo: '/battlegrounds', pathMatch: 'full' },
];
