import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { WebShellComponent } from '@firestone/shared/web-shell';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

@NgModule({
	declarations: [AppComponent],
	imports: [BrowserModule, AppRoutingModule, WebShellComponent],
	providers: [],
	bootstrap: [AppComponent],
})
export class AppModule {}
