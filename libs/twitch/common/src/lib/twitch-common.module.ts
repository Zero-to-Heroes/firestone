import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { BattlegroundsCommonModule } from '@firestone/battlegrounds/common';
import { BattlegroundsCoreModule } from '@firestone/battlegrounds/core';
import { BattlegroundsSimulatorModule } from '@firestone/battlegrounds/simulator';
import { GameStateModule } from '@firestone/game-state';
import { MemoryModule } from '@firestone/memory';
import { SharedCommonServiceModule } from '@firestone/shared/common/service';
import { SharedFrameworkCommonModule } from '@firestone/shared/framework/common';
import { SharedFrameworkCoreModule } from '@firestone/shared/framework/core';
import { BgsSimulationOverlayStandaloneComponent } from './components/bgs-simulation-overlay-standalone.component';
import { TwitchBgsHeroOverviewComponent } from './components/twitch-bgs-hero-overview.component';
import { TwitchAuthService } from './services/twitch-auth.service';
import { TwitchPreferencesService } from './services/twitch-preferences.service';

const components = [BgsSimulationOverlayStandaloneComponent, TwitchBgsHeroOverviewComponent];

@NgModule({
	imports: [
		CommonModule,

		BattlegroundsSimulatorModule,
		BattlegroundsCommonModule,
		BattlegroundsCoreModule,
		GameStateModule,
		MemoryModule,
		SharedCommonServiceModule,
		SharedFrameworkCommonModule,
		SharedFrameworkCoreModule,
	],
	declarations: components,
	exports: components,
	providers: [TwitchPreferencesService, TwitchAuthService],
})
export class TwitchCommonModule {}
