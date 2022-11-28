import { ChangeDetectionStrategy, Component } from '@angular/core';
import { GameState } from '../../../models/decktracker/game-state';
import { Preferences } from '../../../models/preferences';
import { PreferencesService } from '../../../services/preferences.service';

@Component({
	selector: 'decktracker-overlay-opponent',
	styleUrls: [],
	template: `
		<decktracker-overlay-root
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
			closeEvent="CLOSE_OPPONENT_TRACKER"
			player="opponent"
		>
		</decktracker-overlay-root>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeckTrackerOverlayOpponentComponent {
	overlayWidthExtractor = (prefs: Preferences) => prefs.opponentOverlayWidthInPx;
	overlayDisplayModeExtractor = (prefs: Preferences) =>
		!prefs.opponentOverlayGroupByZone ? 'DISPLAY_MODE_GROUPED' : 'DISPLAY_MODE_ZONE';
	opacityExtractor = (prefs: Preferences) => prefs.opponentOverlayOpacityInPercent;
	scaleExtractor = (prefs: Preferences) => prefs.opponentOverlayScale;
	cardsGoToBottomExtractor = (prefs: Preferences) => prefs.opponentOverlayCardsGoToBottom;
	showGlobalEffectsExtractor = (prefs: Preferences) => prefs.opponentOverlayShowGlobalEffects;
	darkenUsedCardsExtractor = (prefs: Preferences) => prefs.opponentOverlayDarkenUsedCards;
	hideGeneratedCardsInOtherZoneExtractor = (prefs: Preferences) => prefs.opponentOverlayHideGeneratedCardsInOtherZone;
	sortCardsByManaCostInOtherZoneExtractor = (prefs: Preferences) => prefs.opponentOverlaySortByManaInOtherZone;
	showBottomCardsSeparatelyExtractor = (prefs: Preferences) => prefs.opponentOverlayShowBottomCardsSeparately;
	showTopCardsSeparatelyExtractor = (prefs: Preferences) => prefs.opponentOverlayShowTopCardsSeparately;
	deckExtractor = (state: GameState) => state.opponentDeck;
	// trackerPositionUpdater = (left: number, top: number) => this.prefs.updateOpponentTrackerPosition(left, top);
	// trackerPositionExtractor = (prefs: Preferences) => prefs.opponentOverlayPosition;
	showDeckWinrateExtractor = (prefs: Preferences) => false;
	showMatchupWinrateExtractor = (prefs: Preferences) => false;
	// Because whitespace for the tooltips
	// defaultTrackerPositionLeftProvider = (gameWidth: number, windowWidth: number) => -windowWidth / 2 + 250;
	// defaultTrackerPositionTopProvider = (gameHeight: number, windowHeight: number) => 50;

	constructor(private prefs: PreferencesService) {}
}
