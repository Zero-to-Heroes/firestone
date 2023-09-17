import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { ArchetypeStat } from '@firestone-hs/constructed-deck-stats';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../../abstract-subscription-store.component';

@Component({
	selector: 'constructed-meta-archetypes',
	styleUrls: [
		`../../../../css/component/decktracker/main/constructed-meta-archetypes-columns.scss`,
		`../../../../css/component/decktracker/main/constructed-meta-archetypes.component.scss`,
	],
	template: `
		<ng-container
			*ngIf="{
				archetypes: archetypes$ | async
			} as value"
		>
			Here will be archetypes
			<div class="constructed-meta-archetypes" *ngIf="value.archetypes">
				<with-loading [isLoading]="!value.archetypes?.length">
					<div class="header"></div>
					<virtual-scroller
						#scroll
						class="decks-list"
						[items]="value.archetypes"
						[bufferAmount]="15"
						[attr.aria-label]="'Meta deck stats'"
						role="list"
						scrollable
					>
						archetypes
					</virtual-scroller>
				</with-loading>
			</div>
		</ng-container>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConstructedMetaArchetypesComponent extends AbstractSubscriptionStoreComponent implements AfterContentInit {
	archetypes$: Observable<ArchetypeStat[]>;

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly allCards: CardsFacadeService,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.archetypes$ = this.store.constructedMetaDecks$().pipe(
			filter((stats) => !!stats?.dataPoints),
			this.mapData((stats) => [...stats.archetypeStats]),
		);
	}
}
