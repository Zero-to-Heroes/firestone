import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { BattlegroundsCommonModule } from '@firestone/battlegrounds/common';
import { BattlegroundsCoreModule } from '@firestone/battlegrounds/core';
import { BattlegroundsSimulatorModule } from '@firestone/battlegrounds/simulator';
import { GameStateModule } from '@firestone/game-state';
import { SharedCommonServiceModule } from '@firestone/shared/common/service';
import { BgsSimulationOverlayStandaloneComponent } from './components/bgs-simulation-overlay-standalone.component';
import { TwitchBgsHeroOverviewComponent } from './components/twitch-bgs-hero-overview.component';
import { TwitchPreferencesService } from './services/twitch-preferences.service';

const components = [BgsSimulationOverlayStandaloneComponent, TwitchBgsHeroOverviewComponent];

@NgModule({
	imports: [
		CommonModule,

		BattlegroundsSimulatorModule,
		BattlegroundsCommonModule,
		BattlegroundsCoreModule,
		GameStateModule,
		SharedCommonServiceModule,
	],
	declarations: components,
	exports: components,
	providers: [TwitchPreferencesService],
})
export class TwitchCommonModule {}
