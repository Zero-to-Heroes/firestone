import {
	ChangeDetectionStrategy, Component, Input
} from '@angular/core';
import { PackResult } from '@firestone-hs/user-packs';
import { boosterIdToBoosterName, getDefaultBoosterIdForSetId, getPackDustValue } from '../../services/hs-utils';
import { LocalizationFacadeService } from '../../services/localization-facade.service';

@Component({
	selector: 'pack-history-item',
	styleUrls: [`../../../css/component/collection/pack-history-item.component.scss`],
	template: `
		<div class="pack-history-item">
			<img class="set-icon" src="{{ setIcon }}" />
			<span class="name">{{ setName }}</span>
			<span class="dust-amount">
				<span>{{ dustValue }}</span>
				<i class="i-30 pale-theme">
					<svg class="svg-icon-fill">
						<use xlink:href="assets/svg/sprite.svg#dust" />
					</svg>
				</i>
			</span>
			<span class="date">{{ creationDate }}</span>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PackHistoryItemComponent {
	@Input('historyItem') set historyItem(pack: PackResult) {
		if (!pack) {
			return;
		}
		const boosterId = pack.boosterId ?? getDefaultBoosterIdForSetId(pack.setId);
		this.setIcon = `https://static.firestoneapp.com/cardPacks/256/${boosterId}.png?v=3`;
		this.setName = boosterIdToBoosterName(boosterId, this.i18n);
		this.dustValue = getPackDustValue(pack);
		this.creationDate = new Date(pack.creationDate).toLocaleDateString(this.i18n.formatCurrentLocale(), {
			day: '2-digit',
			month: '2-digit',
			year: '2-digit',
		});
		if (!this.setName) {
			console.warn('missing entry', pack, boosterId);
		}
	}

	setIcon: string;
	setName: string;
	creationDate: string;
	dustValue: number;

	constructor(private readonly i18n: LocalizationFacadeService) {}
}
