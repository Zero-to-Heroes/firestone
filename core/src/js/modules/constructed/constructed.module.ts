import { OverlayModule } from '@angular/cdk/overlay';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ColiseumComponentsModule } from '@firestone-hs/coliseum-components';
import { init, Integrations } from '@sentry/browser';
import { CaptureConsole, ExtraErrorData } from '@sentry/integrations';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { InlineSVGModule } from 'ng-inline-svg';
import { SelectModule } from 'ng-select';
import { ChartsModule } from 'ng2-charts';
import { LoggerModule, NgxLoggerLevel } from 'ngx-logger';
import { ConstructedContentComponent } from '../../components/constructed/constructed-content.component';
import { ConstructedMenuSelectionComponent } from '../../components/constructed/constructed-menu-selection.component';
import { ConstructedComponent } from '../../components/constructed/constructed.component';
import { InGameAchievementRecapComponent } from '../../components/constructed/in-game-achievement-recap.component';
import { InGameAchievementsRecapComponent } from '../../components/constructed/in-game-achievements-recap.component';
import { InGameOpponentRecapComponent } from '../../components/constructed/in-game-opponent-recap.component';
import { AdService } from '../../services/ad.service';
import { SharedServicesModule } from '../shared-services/shared-services.module';
import { SharedModule } from '../shared/shared.module';

init({
	dsn: 'https://53b0813bb66246ae90c60442d05efefe@o92856.ingest.sentry.io/1338840',
	enabled: process.env.NODE_ENV === 'production',
	release: process.env.APP_VERSION,
	attachStacktrace: true,
	sampleRate: 0.1,
	integrations: [
		new Integrations.GlobalHandlers({
			onerror: true,
			onunhandledrejection: true,
		}),
		new ExtraErrorData(),
		new CaptureConsole({
			levels: ['error'],
		}),
	],
});

console.log('version is ' + process.env.APP_VERSION);

@NgModule({
	imports: [
		BrowserModule,
		HttpClientModule,
		BrowserAnimationsModule,
		SharedModule,
		SelectModule,
		OverlayModule,
		FormsModule,
		ReactiveFormsModule,
		LoggerModule.forRoot({ level: NgxLoggerLevel.WARN }),
		ChartsModule,
		NgxChartsModule,
		SharedServicesModule.forRoot(),
		ColiseumComponentsModule,
		InlineSVGModule.forRoot(),
	],
	declarations: [
		ConstructedComponent,
		ConstructedContentComponent,
		InGameAchievementsRecapComponent,
		InGameAchievementRecapComponent,
		InGameOpponentRecapComponent,
		ConstructedMenuSelectionComponent,
	],
	entryComponents: [],
	bootstrap: [ConstructedComponent],
	providers: [AdService],
})
export class ConstructedModule {}
