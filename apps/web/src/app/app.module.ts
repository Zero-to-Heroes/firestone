import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { CommonModule } from '@angular/common';
import { InlineSVGModule } from 'ng-inline-svg-2';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ArenaComponent } from './arena/arena.component';
import { BattlegroundsComponent } from './battlegrounds/battlegrounds.component';
import { ConstructedComponent } from './constructed/constructed.component';

@NgModule({
	declarations: [AppComponent, BattlegroundsComponent, ArenaComponent, ConstructedComponent],
	imports: [BrowserModule, AppRoutingModule, CommonModule, HttpClientModule, InlineSVGModule.forRoot()],
	providers: [
		// Add your HTTP interceptors here if you have any
		// { provide: HTTP_INTERCEPTORS, useClass: YourInterceptorClass, multi: true },
	],
	bootstrap: [AppComponent],
})
export class AppModule {}
