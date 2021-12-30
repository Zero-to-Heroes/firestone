import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NotificationsFeatureShellModule } from '@firestone/notifications/feature-shell';
import { AppComponent } from './app.component';

@NgModule({
	declarations: [AppComponent],
	imports: [BrowserModule, BrowserAnimationsModule, NotificationsFeatureShellModule],
	providers: [],
	bootstrap: [AppComponent],
})
export class AppModule {}
