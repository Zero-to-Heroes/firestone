import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import {
	BoosterType,
	ReferenceSet,
	boosterIdToBoosterName,
	boosterIdToSetId,
	sets,
} from '@firestone-hs/reference-data';
import {
	CLASS_PACKS,
	GOLDEN_SET_PACKS,
	InternalPackInfo,
	NON_BUYABLE_BOOSTER_IDS,
	YEAR_PACKS,
} from '@firestone/collection/view';
import { AbstractSubscriptionComponent, sortByProperties, sumOnArray } from '@firestone/shared/framework/common';
import { WebsiteLocalizationService } from '@firestone/website/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { WebsiteProfileState } from '../+state/website/profile.models';
import { getPacks } from '../+state/website/profile.selectors';

@Component({
	selector: 'website-profile-packs',
	styleUrls: [`./website-profile-packs.component.scss`],
	template: `
		<website-profile>
			<div class="pack-groups">
				<div class="pack-group" *ngFor="let group of packGroups$ | async">
					<div class="group-name">{{ group.name }}</div>
					<div class="packs-container">
						<pack-stat-view
							class="pack-stat"
							*ngFor="let pack of group.packs; trackBy: trackByPackFn"
							[pack]="pack"
							[helpTooltip]="pack.name"
						>
						</pack-stat-view>
					</div>
				</div>
			</div>
		</website-profile>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WebsiteProfilePacksComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	packGroups$: Observable<readonly InternalPackGroup[]>;

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

		this.packGroups$ = packs$.pipe(
			this.mapData((packs) => {
				const mainGroupPacks = packs
					.filter(
						(pack) =>
							!!pack.set ||
							pack.packType === BoosterType.CLASSIC ||
							pack.packType === BoosterType.WILD_PACK ||
							pack.packType === BoosterType.STANDARD_PACK,
					)
					.filter((pack) => !GOLDEN_SET_PACKS.includes(pack.packType))
					.sort(sortByProperties((pack) => [!pack.set, -(pack.set?.launchDate?.getTime() ?? 0)]));
				const mainSetsGroup: InternalPackGroup = {
					name: this.i18n.translateString('app.collection.pack-stats.main-sets-group-name', {
						totalPacks: sumOnArray(mainGroupPacks, (pack) => pack.totalObtained),
					}),
					packs: mainGroupPacks,
				};

				const nonBuyablePacks = packs
					.map((pack) => ({
						...pack,
						set: sets.find((set) => set.id === pack.setId),
					}))
					.filter((pack) => NON_BUYABLE_BOOSTER_IDS.includes(pack.packType))
					.sort(
						sortByProperties((pack) => [
							!CLASS_PACKS.includes(pack.packType),
							!YEAR_PACKS.includes(pack.packType),
							!pack.set,
							-(pack.set?.launchDate?.getTime() ?? 0),
							pack.name,
						]),
					);
				const nonBuyableGroup: InternalPackGroup = {
					name: this.i18n.translateString('app.collection.pack-stats.non-buyable-group-name', {
						totalPacks: sumOnArray(nonBuyablePacks, (pack) => pack.totalObtained),
					}),
					packs: nonBuyablePacks,
				};

				const packIdsInGroups = [...mainSetsGroup.packs, ...nonBuyableGroup.packs].map((pack) => pack.packType);
				const otherGroupPacks = packs
					.filter((pack) => !packIdsInGroups.includes(pack.packType))
					.sort(sortByProperties((pack) => [-pack.packType]));
				const otherGroup: InternalPackGroup = {
					name: this.i18n.translateString('app.collection.pack-stats.other-group-name', {
						totalPacks: sumOnArray(otherGroupPacks, (pack) => pack.totalObtained),
					}),
					packs: otherGroupPacks,
				};
				return [mainSetsGroup, nonBuyableGroup, otherGroup].filter((group) => !!group?.packs?.length);
			}),
		);
	}

	trackByPackFn(index: number, item: InternalPackInfo) {
		return item.packType;
	}
}

interface InternalPackGroup {
	readonly name: string;
	readonly packs: readonly InternalPackInfo[];
}
