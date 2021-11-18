import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { DeckSummary } from '../../../models/mainwindow/decktracker/deck-summary';
import { DecktrackerState } from '../../../models/mainwindow/decktracker/decktracker-state';
import { NavigationState } from '../../../models/mainwindow/navigation/navigation-state';
import { GameStat } from '../../../models/mainwindow/stats/game-stat';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionComponent } from '../../abstract-subscription.component';

@Component({
	selector: 'decktracker-deck-details',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/component/decktracker/main/decktracker-deck-details.component.scss`,
	],
	template: `
		<div class="decktracker-deck-details">
			<decktracker-stats-for-replays class="global-stats" [replays]="replays"></decktracker-stats-for-replays>
			<div class="container">
				<div class="deck-list-container">
					<copy-deckstring class="copy-deckcode" [deckstring]="deck?.deckstring" copyText="Copy deck code">
					</copy-deckstring>
					<deck-list class="deck-list" [deckstring]="deck?.deckstring"></deck-list>
				</div>
				<deck-winrate-matrix [deck]="deck" [showMatchupAsPercentagesValue]="showMatchupAsPercentages">
				</deck-winrate-matrix>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DecktrackerDeckDetailsComponent extends AbstractSubscriptionComponent implements AfterViewInit {
	@Input() set state(value: DecktrackerState) {
		this._state = value;
		this.updateValues();
	}

	@Input() set navigation(value: NavigationState) {
		this._navigation = value;
		this.updateValues();
	}

	showMatchupAsPercentages = true;
	deck: DeckSummary;
	replays: readonly GameStat[];

	private _state: DecktrackerState;
	private _navigation: NavigationState;

	constructor(protected readonly store: AppUiStoreFacadeService, protected readonly cdr: ChangeDetectorRef) {
		super(store, cdr);
	}

	ngAfterViewInit() {
		this.listenForBasicPref$((prefs) => prefs.desktopDeckShowMatchupAsPercentages).subscribe((value) => {
			this.showMatchupAsPercentages = value;
			this.updateValues();
		});
	}

	private updateValues() {
		if (!this._state?.decks || !this._navigation?.navigationDecktracker) {
			return;
		}

		this.deck = this._state.decks.find(
			(deck) => deck.deckstring === this._navigation.navigationDecktracker.selectedDeckstring,
		);
		this.replays = this.deck?.replays ?? [];
	}
}
