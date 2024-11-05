import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { BgsCompAdvice } from '@firestone-hs/content-craetor-input';
import { GameTag, Race } from '@firestone-hs/reference-data';
import { BgsCompositionsListMode, PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { waitForReady } from '@firestone/shared/framework/core';
import { ExtendedBgsCompAdvice } from 'libs/battlegrounds/core/src/lib/services/compositions/model';
import { Observable } from 'rxjs';

@Component({
	selector: 'bgs-compositions-list',
	styleUrls: ['./bgs-compositions-list.component.scss'],
	template: `
		<div class="compositions-list">
			<!-- 
				Need a way to switch between various display modes?  
				- Still looking for a comp, so show the enablers
					- Darken enablers that are of a tier that is not available
				- Found a comp, so zero-in on the minions for that comp
				- Exapand / collapse all
			-->
			<div class="header">
				<div class="header-text">Compositions</div>
				<div class="header-filters"><bgs-comps-view-select-dropdown></bgs-comps-view-select-dropdown></div>
				<!-- TODO: add a "pin" button next to "exploring" to pin all the enablers? -->
			</div>
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
				[displayMode]="displayMode$ | async"
				[minionsOnBoardAndHand]="minionsOnBoardAndHand"
				[minionsInShop]="minionsInShop"
			></bgs-minions-list-composition>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsCompositionsListComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	displayMode$: Observable<BgsCompositionsListMode>;

	@Input() compositions: readonly ExtendedBgsCompAdvice[];
	@Input() highlightedTribes: readonly Race[];
	@Input() highlightedMechanics: readonly GameTag[];
	@Input() highlightedMinions: readonly string[];
	@Input() showTribesHighlight: boolean;
	@Input() showGoldenCards: boolean;
	@Input() showTrinketTips: boolean;
	@Input() minionsOnBoardAndHand: readonly string[];
	@Input() minionsInShop: readonly string[];

	constructor(protected override readonly cdr: ChangeDetectorRef, private readonly prefs: PreferencesService) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.prefs);

		this.displayMode$ = this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.bgsCompositionsListMode));

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	trackByCompFn(index: number, comp: BgsCompAdvice) {
		return comp?.compId;
	}
}
