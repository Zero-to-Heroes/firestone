import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ArenaComponent } from './arena/arena.component';
import { BattlegroundsComponent } from './battlegrounds/battlegrounds.component';
import { ConstructedComponent } from './constructed/constructed.component';

export const routes: Routes = [
	{ path: '', redirectTo: '/battlegrounds', pathMatch: 'full' },
	{ path: 'battlegrounds', component: BattlegroundsComponent },
	{ path: 'arena', component: ArenaComponent },
	{ path: 'constructed', component: ConstructedComponent },
];

@NgModule({
	imports: [RouterModule.forRoot(routes, { enableTracing: false })],
	exports: [RouterModule],
})
export class AppRoutingModule {}
