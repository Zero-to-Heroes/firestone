import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter, Input } from '@angular/core';
import { DeckSummary } from '../../../models/mainwindow/decktracker/deck-summary';
import { MainWindowState } from '../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../models/mainwindow/navigation/navigation-state';
import { MainWindowStoreEvent } from '../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../services/overwolf.service';
import { OwUtilsService } from '../../../services/plugins/ow-utils.service';

@Component({
	selector: 'decktracker-deck-details',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/component/decktracker/main/decktracker-deck-details.component.scss`,
	],
	template: `
		<div class="decktracker-deck-details">
			<div class="deck-list-container">
				<copy-deckstring class="copy-deckcode" [deckstring]="deck?.deckstring" copyText="Copy deck code">
				</copy-deckstring>
				<deck-list class="deck-list" [deckstring]="deck?.deckstring"></deck-list>
			</div>
			<deck-winrate-matrix [deck]="deck"> </deck-winrate-matrix>
			<social-shares class="social-shares" [onSocialClick]="takeScreenshotFunction"></social-shares>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DecktrackerDeckDetailsComponent implements AfterViewInit {
	@Input() set state(value: MainWindowState) {
		this._state = value;
		this.updateValues();
	}

	@Input() set navigation(value: NavigationState) {
		this._navigation = value;
		this.updateValues();
	}

	deck: DeckSummary;

	takeScreenshotFunction: (copyToCliboard: boolean) => Promise<[string, any]> = this.takeScreenshot();

	private _state: MainWindowState;
	private _navigation: NavigationState;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(private readonly ow: OverwolfService, private readonly owUtils: OwUtilsService) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	private takeScreenshot(): (copyToCliboard: boolean) => Promise<[string, any]> {
		// console.log('taking screenshot from deck details');
		return copyToCliboard => this.owUtils.captureWindow('Firestone - MainWindow', copyToCliboard);
	}

	private updateValues() {
		if (!this._state?.decktracker?.decks || !this._navigation?.navigationDecktracker) {
			return;
		}

		this.deck = this._state.decktracker.decks.find(
			deck => deck.deckstring === this._navigation.navigationDecktracker.selectedDeckstring,
		);
	}
}
