import { Routes } from '@angular/router';
import { ArenaComponent } from './components/arena/arena.component';
import { BattlegroundsComponent } from './components/battlegrounds/battlegrounds.component';
import { ConstructedComponent } from './components/constructed/constructed.component';

export const routes: Routes = [
	{ path: '', redirectTo: '/battlegrounds', pathMatch: 'full' },
	{ path: 'battlegrounds', component: BattlegroundsComponent },
	{ path: 'arena', component: ArenaComponent },
	{ path: 'constructed', component: ConstructedComponent },
];
