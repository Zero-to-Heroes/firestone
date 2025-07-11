/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable @angular-eslint/template/no-negated-async */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { GameFormatString } from '@firestone-hs/reference-data';
import { PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { ILocalizationService, waitForReady } from '@firestone/shared/framework/core';
import { BehaviorSubject, Observable, combineLatest, filter, startWith } from 'rxjs';
import { buildArchetypeName } from '../services/constructed-archetype.service';
import { ConstructedMetaDecksStateService } from '../services/constructed-meta-decks-state-builder.service';

@Component({
	selector: 'mulligan-deck-view-archetype',
	styleUrls: ['./mulligan-deck-view-archetype.component.scss'],
	template: `
		<div class="subtitle">
			<ng-container
				*ngIf="{ archetypeId: archetypeId$ | async, archetypeOverride: archetypeOverride$ | async } as value"
			>
				<ng-container *ngIf="!value.archetypeId || value.archetypeOverride">
					<mulligan-deck-guide-archetype-selection
						[deckstring]="deckstring$ | async"
						[archetypeId]="value.archetypeId"
						[format]="format"
					></mulligan-deck-guide-archetype-selection>
				</ng-container>
				<ng-container *ngIf="value.archetypeId && !value.archetypeOverride">
					<div class="text">{{ archetypeName$ | async }}</div>
				</ng-container>
			</ng-container>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MulliganDeckViewArchetypeComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	deckstring$: Observable<string | null>;
	archetypeOverride$: Observable<number | null>;
	archetypeId$: Observable<number | null>;
	archetypeName$: Observable<string | null>;

	@Input() set archetypeId(value: number | null) {
		this.archetypeId$$.next(value);
	}
	@Input() set deckstring(value: string | null) {
		this.deckstring$$.next(value);
	}
	@Input() format: GameFormatString | null;

	private deckstring$$ = new BehaviorSubject<string | null>(null);
	private archetypeId$$ = new BehaviorSubject<number | null>(null);

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly constructedMetaStats: ConstructedMetaDecksStateService,
		private readonly i18n: ILocalizationService,
		private readonly prefs: PreferencesService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.constructedMetaStats, this.prefs);

		this.deckstring$ = this.deckstring$$.pipe(this.mapData((info) => info));
		this.archetypeId$ = this.archetypeId$$.pipe(this.mapData((info) => info));
		this.archetypeName$ = combineLatest([
			this.archetypeId$$,
			this.constructedMetaStats.constructedMetaArchetypes$$,
		]).pipe(
			filter(([archetypeId, archetypes]) => !!archetypeId && !!archetypes?.archetypeStats?.length),
			this.mapData(([archetypeId, archetypes]) => {
				const archetype = archetypes!.archetypeStats!.find((arch) => arch.id === archetypeId);
				return buildArchetypeName(archetype?.name, this.i18n);
			}),
			startWith(null),
		);
		this.archetypeOverride$ = combineLatest([
			this.deckstring$$,
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.constructedDeckArchetypeOverrides)),
		]).pipe(
			this.mapData(([deckstring, archetypeOverrides]) => {
				return archetypeOverrides?.[deckstring!] ?? null;
			}),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
