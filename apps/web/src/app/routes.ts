import { Routes } from '@angular/router';
import { ArenaComponent } from './arena/arena.component';
import { BattlegroundsComponent } from './battlegrounds/battlegrounds.component';
import { ConstructedComponent } from './constructed/constructed.component';

export const routes: Routes = [
	{ path: '', redirectTo: '/battlegrounds', pathMatch: 'full' },
	{ path: 'battlegrounds', component: BattlegroundsComponent },
	{ path: 'arena', component: ArenaComponent },
	{ path: 'constructed', component: ConstructedComponent },
];
