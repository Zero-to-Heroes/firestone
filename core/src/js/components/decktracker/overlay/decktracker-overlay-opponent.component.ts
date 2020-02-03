import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
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
			[deckExtractor]="deckExtractor"
			[trackerPositionUpdater]="trackerPositionUpdater"
			[trackerPositionExtractor]="trackerPositionExtractor"
			[defaultTrackerPositionLeftProvider]="defaultTrackerPositionLeftProvider"
			[defaultTrackerPositionTopProvider]="defaultTrackerPositionTopProvider"
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
	deckExtractor = (state: GameState) => state.opponentDeck;
	trackerPositionUpdater = (left: number, top: number) => this.prefs.updateOpponentTrackerPosition(left, top);
	trackerPositionExtractor = (prefs: Preferences) => prefs.opponentOverlayPosition;
	defaultTrackerPositionLeftProvider = (gameWidth: number, width: number, dpi: number) => 10;
	defaultTrackerPositionTopProvider = (gameWidth: number, width: number, dpi: number) => 10;

	constructor(private logger: NGXLogger, private prefs: PreferencesService) {}
}
