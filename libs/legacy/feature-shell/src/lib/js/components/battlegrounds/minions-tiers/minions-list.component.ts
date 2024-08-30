import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter, Input } from '@angular/core';
import { GameTag, Race } from '@firestone-hs/reference-data';
import { Tier, TierGroup } from '@firestone/battlegrounds/core';
import { uuid } from '@firestone/shared/framework/common';
import { OverwolfService } from '@firestone/shared/framework/core';
import { BattlegroundsStoreEvent } from '../../../services/battlegrounds/store/events/_battlegrounds-store-event';
import { BgsResetHighlightsEvent } from '../../../services/battlegrounds/store/events/bgs-reset-highlights-event';

@Component({
	selector: 'bgs-minions-list',
	styleUrls: [`../../../../css/global/cdk-overlay.scss`, './bgs-minions-list.component.scss'],
	template: `
		<div class="bgs-minions-list">
			<div class="list-scroller">
				<bgs-minions-group
					class="minion-group"
					*ngFor="let group of groups; trackBy: trackByGroup"
					[group]="group"
					[showTribesHighlight]="showTribesHighlight"
					[showGoldenCards]="showGoldenCards"
					[highlightedMinions]="highlightedMinions"
					[highlightedTribes]="highlightedTribes"
					[highlightedMechanics]="highlightedMechanics"
				></bgs-minions-group>

				<div class="reset-all-button" (click)="resetHighlights()" *ngIf="showTribesHighlight">
					<div class="background-second-part"></div>
					<div class="background-main-part"></div>
					<div class="content">
						<div class="icon" inlineSVG="assets/svg/restore.svg"></div>
						{{ 'battlegrounds.in-game.minions-list.reset-button' | owTranslate }}
					</div>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsMinionsListComponent implements AfterViewInit {
	groups: readonly TierGroup[];

	uuid = uuid();

	@Input() set tier(value: Tier) {
		this.groups = value?.groups ?? [];
	}

	@Input() highlightedMinions: readonly string[];
	@Input() highlightedTribes: readonly Race[];
	@Input() highlightedMechanics: readonly GameTag[];
	@Input() showTribesHighlight: boolean;
	@Input() showGoldenCards: boolean;

	private battlegroundsUpdater: EventEmitter<BattlegroundsStoreEvent>;

	constructor(private readonly ow: OverwolfService) {}

	async ngAfterViewInit() {
		this.battlegroundsUpdater = (await this.ow.getMainWindow())?.battlegroundsUpdater;
	}

	resetHighlights() {
		this.battlegroundsUpdater.next(new BgsResetHighlightsEvent());
	}

	trackByGroup(index, item: TierGroup) {
		return item.label;
	}
}
