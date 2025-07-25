/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @angular-eslint/template/eqeqeq */
/* eslint-disable @angular-eslint/template/no-negated-async */
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ILocalizationService } from '@firestone/shared/framework/core';

@Component({
	standalone: false,
	selector: 'community-internal-ladder-view',
	styleUrls: [`./community-internal-ladder-view.component.scss`],
	template: `
		<div class="internal-ladder-view" *ngIf="ladder !== null">
			<div class="header">
				<div class="cell rank">Rank</div>
				<div class="cell name">Name</div>
				<div class="cell openskill">MMR</div>
			</div>
			<ul class="entries">
				<div class="entry" *ngFor="let entry of ladder; let i = index; trackBy: trackByFn">
					<div class="cell rank">{{ i + 1 }}</div>
					<div class="cell name">{{ entry.name }}</div>
					<div class="cell openskill">{{ buildValue(entry.ranking) }}</div>
				</div>
			</ul>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommunityInternalLadderViewComponent {
	@Input() ladder: readonly LadderEntry[] | null;

	constructor(private readonly i18n: ILocalizationService) {}

	trackByFn(index: number, entry: LadderEntry) {
		return entry.name + entry.ordinal;
	}

	buildValue(value: number): string {
		return value == null
			? '-'
			: value === 0
			? '0'
			: value.toLocaleString(this.i18n.formatCurrentLocale() ?? 'enUs', {
					maximumFractionDigits: 2,
			  });
	}
}

export interface CommunityInternalLadder {
	ladder: readonly LadderEntry[];
}

export interface LadderEntry {
	readonly name: string;
	readonly ranking: number;
	readonly mu: number;
	readonly sigma: number;
	readonly ordinal: number;
	readonly totalGames: number;
}
