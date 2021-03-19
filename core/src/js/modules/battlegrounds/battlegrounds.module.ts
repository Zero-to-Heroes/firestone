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
import { BattlegroundsContentComponent } from '../../components/battlegrounds/battlegrounds-content.component';
import { BattlegroundsComponent } from '../../components/battlegrounds/battlegrounds.component';
import { BgsCardTooltipComponent } from '../../components/battlegrounds/bgs-card-tooltip.component';
import { BgsHeroSelectionOverviewComponent } from '../../components/battlegrounds/hero-selection/bgs-hero-selection-overview.component';
import { BgsHeroWarbandStatsComponent } from '../../components/battlegrounds/hero-selection/bgs-hero-warband-stats.component';
import { BgsHeroFaceOffComponent } from '../../components/battlegrounds/in-game/bgs-hero-face-off.component';
import { BgsHeroFaceOffsComponent } from '../../components/battlegrounds/in-game/bgs-hero-face-offs.component';
import { BgsNextOpponentOverviewComponent } from '../../components/battlegrounds/in-game/bgs-next-opponent-overview.component';
import { BgsOpponentOverviewComponent } from '../../components/battlegrounds/in-game/bgs-opponent-overview.component';
import { MenuSelectionBgsComponent } from '../../components/battlegrounds/menu-selection-bgs.component';
import { AdService } from '../../services/ad.service';
import { BgsBattleSimulationService } from '../../services/battlegrounds/bgs-battle-simulation.service';
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
		BattlegroundsComponent,
		BattlegroundsContentComponent,
		BgsHeroSelectionOverviewComponent,
		BgsHeroWarbandStatsComponent,
		BgsNextOpponentOverviewComponent,
		BgsHeroFaceOffComponent,
		BgsOpponentOverviewComponent,
		MenuSelectionBgsComponent,
		BgsHeroFaceOffsComponent,
	],
	entryComponents: [BgsCardTooltipComponent],
	bootstrap: [BattlegroundsComponent],
	providers: [AdService, BgsBattleSimulationService],
})
export class BattlegroundsModule {}
