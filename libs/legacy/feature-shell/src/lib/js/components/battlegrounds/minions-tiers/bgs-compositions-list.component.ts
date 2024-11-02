import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { BgsCompAdvice } from '@firestone-hs/content-craetor-input';
import { GameTag, Race } from '@firestone-hs/reference-data';

@Component({
	selector: 'bgs-compositions-list',
	styleUrls: ['./bgs-compositions-list.component.scss'],
	template: `
		<div class="compositions-list" *ngIf="displayedTierId === 'compositions'">
			<!-- Collapse -->
			<bgs-minions-list-composition
				*ngFor="let comp of compositions ?? []; trackBy: trackByCompFn"
				class="composition"
				[composition]="comp"
				[showTribesHighlight]="showTribesHighlight"
				[highlightedMinions]="highlightedMinions"
				[highlightedTribes]="highlightedTribes"
				[highlightedMechanics]="highlightedMechanics"
				[showGoldenCards]="showGoldenCards"
				[showTrinketTips]="showTrinketTips"
			></bgs-minions-list-composition>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsCompositionsListComponent {
	@Input() compositions: readonly BgsCompAdvice[];
	@Input() highlightedTribes: readonly Race[];
	@Input() highlightedMechanics: readonly GameTag[];
	@Input() highlightedMinions: readonly string[];
	@Input() showTribesHighlight: boolean;
	@Input() showGoldenCards: boolean;
	@Input() showTrinketTips: boolean;

	trackByCompFn(index: number, comp: BgsCompAdvice) {
		return comp?.compId;
	}
}
