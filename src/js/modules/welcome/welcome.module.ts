import { OverlayModule } from '@angular/cdk/overlay';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { init } from '@sentry/browser';
import { AppChoiceComponent } from '../../components/home/app-choice.component';
import { HomeScreenInfoTextComponent } from '../../components/home/home-screen-info-text.component';
import { SocialMediaComponent } from '../../components/social-media.component';
import { WelcomePageComponent } from '../../components/welcome-page.component';
import { RealTimeNotificationService } from '../../services/real-time-notifications.service';
import { SharedServicesModule } from '../shared-services/shared-services.module';
import { SharedModule } from '../shared/shared.module';

init({
	dsn: 'https://53b0813bb66246ae90c60442d05efefe@sentry.io/1338840',
	enabled: process.env.NODE_ENV === 'production',
	release: process.env.APP_VERSION,
});

console.log('version is ' + process.env.APP_VERSION);

@NgModule({
	imports: [
		BrowserModule,
		HttpClientModule,
		BrowserAnimationsModule,
		SharedModule,
		OverlayModule,
		SharedServicesModule.forRoot(),
	],
	declarations: [WelcomePageComponent, HomeScreenInfoTextComponent, AppChoiceComponent, SocialMediaComponent],
	bootstrap: [WelcomePageComponent],
	providers: [RealTimeNotificationService],
})
export class WelcomeModule {}
