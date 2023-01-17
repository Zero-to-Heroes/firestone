import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { GameTag, Race } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@services/cards-facade.service';

@Component({
	selector: 'bgs-tavern-minion',
	styleUrls: [
		'../../../../css/themes/battlegrounds-theme.scss',
		'../../../../css/component/battlegrounds/overlay/bgs-tavern-minion.component.scss',
	],
	template: `
		<div class="battlegrounds-theme card">
			<!-- transparent image with 1:1 intrinsic aspect ratio -->
			<img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" />

			<div
				class="highlight highlight-minion"
				*ngIf="highlightedFromMinion"
				inlineSVG="assets/svg/pinned.svg"
				[style.top.%]="minionTop"
				[style.right.%]="minionRight"
			></div>
			<div
				class="highlight highlight-tribe"
				*ngIf="highlightedFromTribe"
				inlineSVG="assets/svg/created_by.svg"
				[style.top.%]="tribeTop"
				[style.right.%]="tribeRight"
			></div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsTavernMinionComponent {
	@Input() showTribesHighlight: boolean;

	@Input() set minion(value: string) {
		this._minionCardId = value;
		this.updateValues();
	}

	@Input() set highlightedTribes(value: readonly Race[]) {
		this._highlightedTribes = value ?? [];
		this.updateValues();
	}

	@Input() set highlightedMechanics(value: readonly GameTag[]) {
		this._highlightedMechanics = value ?? [];
		this.updateValues();
	}

	@Input() set highlightedMinions(value: readonly string[]) {
		this._highlightedMinions = value ?? [];
		this.updateValues();
	}

	_minionCardId: string;
	_highlightedTribes: readonly Race[] = [];
	_highlightedMechanics: readonly GameTag[] = [];
	_highlightedMinions: readonly string[] = [];

	highlightedFromTribe: boolean;
	highlightedFromMinion: boolean;
	tribeTop: number;
	tribeRight: number;
	minionTop: number;
	minionRight: number;

	constructor(private readonly allCards: CardsFacadeService) {}

	private updateValues() {
		this.highlightedFromTribe = false;
		this.highlightedFromMinion = false;
		if (
			!this.showTribesHighlight ||
			!this._minionCardId ||
			(!this._highlightedTribes?.length &&
				!this._highlightedMinions?.length &&
				!this._highlightedMechanics?.length)
		) {
			return;
		}

		const card = this.allCards.getCard(this._minionCardId);
		const highlightedFromMechanics = card?.mechanics?.some((m) => this._highlightedMechanics.includes(GameTag[m]));
		const tribes: readonly Race[] = card.races?.length
			? card.races.map((race) => Race[race.toUpperCase()])
			: [Race.BLANK];
		this.highlightedFromTribe =
			tribes.some((tribe) => this._highlightedTribes.includes(tribe)) ||
			(this._highlightedTribes.length > 0 && tribes.some((tribe) => tribe === Race.ALL)) ||
			highlightedFromMechanics;
		this.highlightedFromMinion = this._highlightedMinions.includes(card.id);

		if (this.highlightedFromTribe) {
			this.tribeTop = 10;
			this.tribeRight = 8;
			if (this.highlightedFromMinion) {
				this.minionTop = 29;
				this.minionRight = 1;
			}
		} else {
			this.minionTop = 10;
			this.minionRight = 8;
		}
	}
}
