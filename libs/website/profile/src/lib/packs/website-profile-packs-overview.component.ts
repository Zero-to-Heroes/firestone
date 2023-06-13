import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { ReferenceSet, boosterIdToBoosterName, boosterIdToSetId, sets } from '@firestone-hs/reference-data';
import { InternalPackInfo } from '@firestone/collection/view';
import { AbstractSubscriptionComponent, sumOnArray } from '@firestone/shared/framework/common';
import { WebsiteLocalizationService } from '@firestone/website/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { WebsiteProfileState } from '../+state/website/profile.models';
import { getPacks } from '../+state/website/profile.selectors';

@Component({
	selector: 'website-profile-packs-overview',
	styleUrls: [`./website-profile-packs-overview.component.scss`],
	template: `
		<div class="card overview" [helpTooltip]="'website.collection.packs.overview-title-tooltip' | fsTranslate">
			<div class="title" [fsTranslate]="'website.collection.packs.overview-title'"></div>
			<img
				class="icon"
				[src]="
					'https://static.zerotoheroes.com/hearthstone/asset/firestone/images/collection/all-packs.webp?v=3'
				"
			/>
			<div class="value">{{ totalPacks$ | async }}</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WebsiteProfilePacksOverviewComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	totalPacks$: Observable<number>;

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly store: Store<WebsiteProfileState>,
		private readonly i18n: WebsiteLocalizationService,
	) {
		super(cdr);
	}

	ngAfterContentInit(): void {
		const packs$: Observable<readonly (InternalPackInfo & { set: ReferenceSet | undefined })[]> = this.store
			.select(getPacks)
			.pipe(
				this.mapData((packs) =>
					packs.map((pack) => ({
						packType: pack.id,
						setId: boosterIdToSetId(pack.id),
						totalObtained: pack.totalObtained,
						unopened: 0,
						set: sets.find((set) => set.id === boosterIdToSetId(pack.id)),
						name: boosterIdToBoosterName(pack.id, this.i18n),
					})),
				),
			);
		this.totalPacks$ = packs$.pipe(this.mapData((packs) => sumOnArray(packs, (pack) => pack.totalObtained)));
	}
}
