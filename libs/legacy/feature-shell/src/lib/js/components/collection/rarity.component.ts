import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RarityTYpe } from '@firestone-hs/reference-data';
import { Set } from '../../models/set';

@Component({
	selector: 'rarity-view',
	styleUrls: [`../../../css/component/collection/rarity.component.scss`],
	template: `
		<div *ngIf="cardSet && rarity" class="rarity-container">
			<div class="rarity-progress">
				<img
					src="{{
						'https://static.zerotoheroes.com/hearthstone/asset/firestone/images/rarity-' +
							rarity?.toLowerCase() +
							'.png'
					}}"
					class="rarity"
					title="{{ rarity }}"
				/>
				<span class="rarity-progress-info"
					>{{ rarity }}: {{ cardSet.ownedForRarity(rarity) }} / {{ cardSet.totalForRarity(rarity) }}</span
				>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RarityComponent {
	@Input() rarity: RarityTYpe;
	@Input() cardSet: Set;
}
