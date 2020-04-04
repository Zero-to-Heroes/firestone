import { OverlayModule } from '@angular/cdk/overlay';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ColiseumComponentsModule } from '@firestone-hs/coliseum-components';
import { init, Integrations } from '@sentry/browser';
import { CaptureConsole, ExtraErrorData } from '@sentry/integrations';
import { SelectModule } from 'ng-select';
import { ChartsModule } from 'ng2-charts';
import { LoggerModule, NgxLoggerLevel } from 'ngx-logger';
import { BattlegroundsContentComponent } from '../../components/battlegrounds/battlegrounds-content.component';
import { BattlegroundsComponent } from '../../components/battlegrounds/battlegrounds.component';
import { BgsHeroMiniComponent } from '../../components/battlegrounds/hero-selection/bgs-hero-mini.component';
import { BgsHeroOverviewComponent } from '../../components/battlegrounds/hero-selection/bgs-hero-overview.component';
import { BgsHeroSelectionOverviewComponent } from '../../components/battlegrounds/hero-selection/bgs-hero-selection-overview.component';
import { BgsHeroSelectionTooltipComponent } from '../../components/battlegrounds/hero-selection/bgs-hero-selection-tooltip.component';
import { BgsHeroStatsComponent } from '../../components/battlegrounds/hero-selection/bgs-hero-stats.component';
import { BgsHeroTierComponent } from '../../components/battlegrounds/hero-selection/bgs-hero-tier.component.ts';
import { BgsHeroTribesComponent } from '../../components/battlegrounds/hero-selection/bgs-hero-tribes.component';
import { BgsHeroWarbandStatsComponent } from '../../components/battlegrounds/hero-selection/bgs-hero-warband-stats.component';
import { BgsHeroFaceOffComponent } from '../../components/battlegrounds/in-game/bgs-hero-face-off.component';
import { BgsHeroFaceOffsComponent } from '../../components/battlegrounds/in-game/bgs-hero-face-offs.component';
import { BgsNextOpponentOverviewComponent } from '../../components/battlegrounds/in-game/bgs-next-opponent-overview.component';
import { BgsOpponentOverviewBigComponent } from '../../components/battlegrounds/in-game/bgs-opponent-overview-big.component';
import { BgsOpponentOverviewComponent } from '../../components/battlegrounds/in-game/bgs-opponent-overview.component';
import { MenuSelectionBgsComponent } from '../../components/battlegrounds/menu-selection-bgs.component';
import { BgsChartHpComponent } from '../../components/battlegrounds/post-match/bgs-chart-hp.component';
import { BgsChartStatsComponent } from '../../components/battlegrounds/post-match/bgs-chart-stats.component';
import { BgsChartWarbandCompositionComponent } from '../../components/battlegrounds/post-match/bgs-chart-warband-composition.component';
import { BgsChartWarbandStatsComponent } from '../../components/battlegrounds/post-match/bgs-chart-warband-stats.component';
import { BgsPostMatchStatsComponent } from '../../components/battlegrounds/post-match/bgs-post-match-stats.component';
import { AdService } from '../../services/ad.service';
import { SharedServicesModule } from '../shared-services/shared-services.module';
import { SharedModule } from '../shared/shared.module';

init({
	dsn: 'https://53b0813bb66246ae90c60442d05efefe@sentry.io/1338840',
	enabled: process.env.NODE_ENV === 'production',
	release: process.env.APP_VERSION,
	attachStacktrace: true,
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
		SharedServicesModule.forRoot(),
		ColiseumComponentsModule,
	],
	declarations: [
		BattlegroundsComponent,
		BattlegroundsContentComponent,
		BgsHeroSelectionOverviewComponent,
		BgsHeroOverviewComponent,
		BgsHeroWarbandStatsComponent,
		BgsNextOpponentOverviewComponent,
		BgsPostMatchStatsComponent,
		BgsHeroMiniComponent,
		BgsHeroFaceOffComponent,
		BgsOpponentOverviewComponent,
		BgsChartHpComponent,
		BgsChartWarbandStatsComponent,
		BgsChartWarbandCompositionComponent,
		BgsChartStatsComponent,
		MenuSelectionBgsComponent,
		BgsHeroTierComponent,
		BgsHeroSelectionTooltipComponent,
		BgsHeroStatsComponent,
		BgsHeroTribesComponent,
		BgsOpponentOverviewBigComponent,
		BgsHeroFaceOffsComponent,
	],
	entryComponents: [BgsHeroSelectionTooltipComponent],
	bootstrap: [BattlegroundsComponent],
	providers: [AdService],
})
export class BattlegroundsModule {}
