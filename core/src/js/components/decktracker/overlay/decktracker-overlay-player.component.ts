import { ChangeDetectionStrategy, Component } from '@angular/core';
import { GameState } from '../../../models/decktracker/game-state';
import { Preferences } from '../../../models/preferences';
import { PreferencesService } from '../../../services/preferences.service';

@Component({
	selector: 'decktracker-overlay-player',
	styleUrls: [],
	template: `
		<decktracker-overlay-root
			tabindex="0"
			[overlayWidthExtractor]="overlayWidthExtractor"
			[overlayDisplayModeExtractor]="overlayDisplayModeExtractor"
			[opacityExtractor]="opacityExtractor"
			[scaleExtractor]="scaleExtractor"
			[cardsGoToBottomExtractor]="cardsGoToBottomExtractor"
			[showGlobalEffectsExtractor]="showGlobalEffectsExtractor"
			[darkenUsedCardsExtractor]="darkenUsedCardsExtractor"
			[hideGeneratedCardsInOtherZoneExtractor]="hideGeneratedCardsInOtherZoneExtractor"
			[sortCardsByManaCostInOtherZoneExtractor]="sortCardsByManaCostInOtherZoneExtractor"
			[showBottomCardsSeparatelyExtractor]="showBottomCardsSeparatelyExtractor"
			[showTopCardsSeparatelyExtractor]="showTopCardsSeparatelyExtractor"
			[deckExtractor]="deckExtractor"
			[showDeckWinrateExtractor]="showDeckWinrateExtractor"
			[showMatchupWinrateExtractor]="showMatchupWinrateExtractor"
			closeEvent="CLOSE_TRACKER"
			player="player"
		>
		</decktracker-overlay-root>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeckTrackerOverlayPlayerComponent {
	overlayWidthExtractor = (prefs: Preferences) => prefs.overlayWidthInPx;
	overlayDisplayModeExtractor = (prefs: Preferences) =>
		!prefs.overlayGroupByZone ? 'DISPLAY_MODE_GROUPED' : 'DISPLAY_MODE_ZONE';
	opacityExtractor = (prefs: Preferences) => prefs.overlayOpacityInPercent;
	scaleExtractor = (prefs: Preferences) => prefs.decktrackerScale;
	cardsGoToBottomExtractor = (prefs: Preferences) => prefs.overlayCardsGoToBottom;
	showGlobalEffectsExtractor = (prefs: Preferences) => prefs.overlayShowGlobalEffects;
	darkenUsedCardsExtractor = (prefs: Preferences) => prefs.overlayDarkenUsedCards;
	hideGeneratedCardsInOtherZoneExtractor = (prefs: Preferences) => prefs.overlayHideGeneratedCardsInOtherZone;
	sortCardsByManaCostInOtherZoneExtractor = (prefs: Preferences) => prefs.overlaySortByManaInOtherZone;
	showBottomCardsSeparatelyExtractor = (prefs: Preferences) => prefs.overlayShowBottomCardsSeparately;
	showTopCardsSeparatelyExtractor = (prefs: Preferences) => prefs.overlayShowTopCardsSeparately;
	deckExtractor = (state: GameState) => state.playerDeck;
	// trackerPositionUpdater = (left: number, top: number) => this.prefs.updateTrackerPosition(left, top);
	// trackerPositionExtractor = (prefs: Preferences) => prefs.decktrackerPosition;
	showDeckWinrateExtractor = (prefs: Preferences) => prefs.overlayShowDeckWinrate;
	showMatchupWinrateExtractor = (prefs: Preferences) => prefs.overlayShowMatchupWinrate;
	// defaultTrackerPositionLeftProvider = (gameWidth: number, windowWidth: number) => gameWidth - windowWidth / 2 - 180;
	// defaultTrackerPositionTopProvider = (gameHeight: number, windowHeight: number) => 10;

	constructor(private prefs: PreferencesService) {}
}
