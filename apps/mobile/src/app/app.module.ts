import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ArenaComponent } from './arena/arena.component';
import { BattlegroundsComponent } from './battlegrounds/battlegrounds.component';
import { ConstructedComponent } from './constructed/constructed.component';

@NgModule({
	declarations: [AppComponent, BattlegroundsComponent, ArenaComponent, ConstructedComponent],
	imports: [BrowserModule, AppRoutingModule],
	providers: [],
	bootstrap: [AppComponent],
})
export class AppModule {}
