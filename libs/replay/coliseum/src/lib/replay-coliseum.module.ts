import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ReplayParserModule } from '@firestone-hs/replay-parser';
import { Ng2FittextModule } from 'ng2-fittext';
import { ColiseumComponent } from './components/coliseum.component';
import { ControlsComponent } from './components/controls.component';
import { ActiveSpellComponent } from './components/game/active-spell.component';
import { BoardCardFrameComponent } from './components/game/board/board-card-frame.component';
import { BoardCardStatsComponent } from './components/game/board/board-card-stats.component';
import { BoardComponent } from './components/game/board/board.component';
import { CardOnBoardOverlaysComponent } from './components/game/board/card-on-board-overlays.component';
import { CardOnBoardComponent } from './components/game/board/card-on-board.component';
import { PowerIndicatorComponent } from './components/game/board/power-indicator.component';
import { SleepingComponent } from './components/game/board/sleeping.component';
import { CardArtComponent } from './components/game/card/card-art.component';
import { CardCostComponent } from './components/game/card/card-cost.component';
import { CardEnchantmentComponent } from './components/game/card/card-enchantment.component';
import { CardEnchantmentsComponent } from './components/game/card/card-enchantments.component';
import { CardFrameComponent } from './components/game/card/card-frame.component';
import { CardNameComponent } from './components/game/card/card-name.component';
import { CardRaceComponent } from './components/game/card/card-race.component';
import { CardRarityComponent } from './components/game/card/card-rarity.component';
import { CardStatsComponent } from './components/game/card/card-stats.component';
import { CardTextComponent } from './components/game/card/card-text.component';
import { CardComponent } from './components/game/card/card.component';
import { DamageComponent } from './components/game/card/damage.component';
import { OverlayBurnedComponent } from './components/game/card/overlay-burned.component';
import { OverlayCrossedComponent } from './components/game/card/overlay-crossed.component';
import { OverlayTickedComponent } from './components/game/card/overlay-ticked.component';
import { TavernLevelIconComponent } from './components/game/card/tavern-level-icon.component';
import { DeckComponent } from './components/game/deck/deck.component';
import { GameComponent } from './components/game/game.component';
import { HandComponent } from './components/game/hand.component';
import { CoinCostComponent } from './components/game/hero/coin-cost.component';
import { HeroArtComponent } from './components/game/hero/hero-art.component';
import { HeroCardComponent } from './components/game/hero/hero-card.component';
import { HeroFrameComponent } from './components/game/hero/hero-frame.component';
import { HeroOverlaysComponent } from './components/game/hero/hero-overlays.component';
import { HeroPowerArtComponent } from './components/game/hero/hero-power-art.component';
import { HeroPowerCostComponent } from './components/game/hero/hero-power-cost.component';
import { HeroPowerFrameComponent } from './components/game/hero/hero-power-frame.component';
import { HeroPowerComponent } from './components/game/hero/hero-power.component';
import { HeroStatsComponent } from './components/game/hero/hero-stats.component';
import { HeroComponent } from './components/game/hero/hero.component';
import { QuestComponent } from './components/game/hero/quest.component';
import { SecretComponent } from './components/game/hero/secret.component';
import { SecretsComponent } from './components/game/hero/secrets.component';
import { TavernButtonComponent } from './components/game/hero/tavern-button.component';
import { WeaponArtComponent } from './components/game/hero/weapon-art.component';
import { WeaponFrameComponent } from './components/game/hero/weapon-frame.component';
import { WeaponStatsComponent } from './components/game/hero/weapon-stats.component';
import { WeaponComponent } from './components/game/hero/weapon.component';
import { LeaderboardEntityComponent } from './components/game/leaderboard/leaderboard-entity.component';
import { LeaderboardComponent } from './components/game/leaderboard/leaderboard.component';
import { ManaTrayComponent } from './components/game/manatray/mana-tray.component';
import { BurnComponent } from './components/game/overlay/burn.component';
import { DiscoverComponent } from './components/game/overlay/discover.component';
import { EndGameComponent } from './components/game/overlay/end-game.component';
import { FatigueComponent } from './components/game/overlay/fatigue.component';
import { HeroSelectionComponent } from './components/game/overlay/hero-selection.component';
import { MulliganComponent } from './components/game/overlay/mulligan.component';
import { OpponentRevealedComponent } from './components/game/overlay/opponents-reveal.component';
import { OverlaysComponent } from './components/game/overlay/overlays.component';
import { PlayerNameComponent } from './components/game/overlay/player-name.component';
import { QuestCompletedComponent } from './components/game/overlay/quest-completed.component';
import { QuestTooltipComponent } from './components/game/overlay/quest-tooltip.component';
import { VisualBoardStateChangeComponent } from './components/game/overlay/visual-board-state-change';
import { PlayAreaComponent } from './components/game/play-area.component';
import { SecretRevealedComponent } from './components/game/secret-revealed.component';
import { TargetZoneComponent } from './components/game/target-zone.component';
import { PreloaderComponent } from './components/preloader.component';
import { SeekerComponent } from './components/seeker.component';
import { TooltipComponent, TooltipsComponent } from './components/tooltips.component';
import { TransitionGroupComponent } from './components/transition-group.component';
import { TurnNarratorComponent } from './components/turn-narrator.component';
import { CardElementResizeDirective } from './directives/card-element-resize.directive';
import { CardResizeDirective } from './directives/card-resize.directive';
import { CardTooltipDirective } from './directives/card-tooltip.directive';
import { TransitionGroupItemDirective } from './directives/transition-group-item.directive';
import { Events } from './services/events.service';

@NgModule({
	imports: [CommonModule, FormsModule, BrowserAnimationsModule, Ng2FittextModule, ReplayParserModule.forRoot()],
	declarations: [
		ColiseumComponent,
		GameComponent,
		OverlaysComponent,
		TurnNarratorComponent,
		HandComponent,
		PlayAreaComponent,
		HandComponent,
		ManaTrayComponent,

		BoardComponent,
		CardOnBoardComponent,
		BoardCardFrameComponent,
		BoardCardStatsComponent,
		DamageComponent,
		SleepingComponent,
		PowerIndicatorComponent,
		CardOnBoardOverlaysComponent,
		CardEnchantmentsComponent,
		CardEnchantmentComponent,

		TooltipsComponent,
		TooltipComponent,

		HeroComponent,
		HeroCardComponent,
		HeroOverlaysComponent,
		HeroArtComponent,
		HeroStatsComponent,
		HeroFrameComponent,
		HeroPowerComponent,
		HeroPowerArtComponent,
		HeroPowerCostComponent,
		HeroPowerFrameComponent,

		WeaponComponent,
		WeaponArtComponent,
		WeaponFrameComponent,
		WeaponStatsComponent,

		SecretsComponent,
		SecretComponent,
		QuestComponent,

		CardComponent,
		CardArtComponent,
		CardFrameComponent,
		CardRarityComponent,
		CardNameComponent,
		CardTextComponent,
		CardRaceComponent,
		CardStatsComponent,
		CardCostComponent,
		OverlayCrossedComponent,
		OverlayTickedComponent,
		OverlayBurnedComponent,

		TavernLevelIconComponent,
		VisualBoardStateChangeComponent,
		LeaderboardComponent,
		LeaderboardEntityComponent,
		TavernButtonComponent,
		CoinCostComponent,

		DeckComponent,
		PlayerNameComponent,
		EndGameComponent,

		MulliganComponent,
		HeroSelectionComponent,
		OpponentRevealedComponent,
		BurnComponent,
		DiscoverComponent,
		ActiveSpellComponent,
		SecretRevealedComponent,
		FatigueComponent,
		QuestCompletedComponent,
		QuestTooltipComponent,

		PreloaderComponent,
		SeekerComponent,
		ControlsComponent,

		TargetZoneComponent,

		TransitionGroupComponent,

		CardTooltipDirective,
		CardResizeDirective,
		CardElementResizeDirective,
		TransitionGroupItemDirective,
	],
	exports: [ColiseumComponent],
	providers: [Events],
})
export class ReplayColiseumModule {}
