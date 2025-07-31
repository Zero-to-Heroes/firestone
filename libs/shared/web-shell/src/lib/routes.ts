import { Routes } from '@angular/router';
import { ArenaComponent } from './components/arena/arena.component';
import { BattlegroundsCardsComponent } from './components/battlegrounds/cards/battlegrounds-cards.component';
import { BattlegroundsCompositionsComponent } from './components/battlegrounds/compositions/battlegrounds-compositions.component';
import { BattlegroundsHeroesComponent } from './components/battlegrounds/heroes/battlegrounds-heroes.component';
import { ConstructedComponent } from './components/constructed/constructed.component';

export const routes: Routes = [
	{ path: '', redirectTo: '/battlegrounds', pathMatch: 'full' },
	{ path: 'battlegrounds', redirectTo: '/battlegrounds/heroes', pathMatch: 'full' },
	{ path: 'battlegrounds/heroes', component: BattlegroundsHeroesComponent },
	{ path: 'battlegrounds/comps', component: BattlegroundsCompositionsComponent },
	{ path: 'battlegrounds/cards', component: BattlegroundsCardsComponent },
	{ path: 'arena', component: ArenaComponent },
	{ path: 'constructed', component: ConstructedComponent },
];
