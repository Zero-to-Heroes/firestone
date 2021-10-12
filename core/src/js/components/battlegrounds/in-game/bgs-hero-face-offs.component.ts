import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { BgsFaceOff } from '@firestone-hs/hs-replay-xml-parser/dist/lib/model/bgs-face-off';
import { BgsPlayer } from '../../../models/battlegrounds/bgs-player';
import { groupByFunction } from '../../../services/utils';

@Component({
	selector: 'bgs-hero-face-offs',
	styleUrls: [
		`../../../../css/global/reset-styles.scss`,
		`../../../../css/component/battlegrounds/in-game/bgs-hero-face-offs.component.scss`,
		`../../../../css/global/scrollbar.scss`,
	],
	template: `
		<div class="face-offs" scrollable>
			<div class="header entry">
				<div class="hero">Hero</div>
				<div class="won">Won</div>
				<div class="lost">Lost</div>
				<div class="tied">Tied</div>
			</div>
			<bgs-hero-face-off
				*ngFor="let opponent of opponents || []; trackBy: trackByFn"
				[opponent]="opponent"
				[isNextOpponent]="nextOpponentCardId === opponent.cardId"
				[faceOffs]="faceOffsByOpponent[opponent.cardId]"
			></bgs-hero-face-off>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsHeroFaceOffsComponent {
	opponents: readonly BgsPlayer[];
	faceOffsByOpponent = {};

	@Input() nextOpponentCardId: string;

	@Input() set faceOffs(value: readonly BgsFaceOff[]) {
		this.faceOffsByOpponent = groupByFunction((faceOff: BgsFaceOff) => faceOff.opponentCardId)(value);
	}

	@Input() set players(value: readonly BgsPlayer[]) {
		this.opponents = value
			.filter((player) => !player.isMainPlayer)
			.sort((a, b) => {
				if (a.leaderboardPlace < b.leaderboardPlace) {
					return -1;
				}
				if (b.leaderboardPlace < a.leaderboardPlace) {
					return 1;
				}
				if (a.damageTaken < b.damageTaken) {
					return -1;
				}
				if (b.damageTaken < a.damageTaken) {
					return 1;
				}
				return 0;
			});

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	constructor(private readonly cdr: ChangeDetectorRef) {}

	trackByFn(index, item: BgsPlayer) {
		return item.cardId;
	}
}
