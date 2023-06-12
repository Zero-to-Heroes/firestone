import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ExtendedProfileSet } from '../+state/website/profile.models';

@Component({
	selector: 'website-profile-collection-overview',
	styleUrls: [`./website-profile-collection-overview.component.scss`],
	template: `
		<div class="mode standard">
			<div class="title">{{ title }}</div>
			<img class="icon" [src]="setIcon" />
			<div class="progress-container">
				<div class="progress normal">{{ progressNormal() }}</div>
				<div class="progress golden">{{ progressGolden() }}</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WebsiteProfileCollectionOverviewComponent {
	@Input() sets: readonly ExtendedProfileSet[] | null;
	@Input() title: string;
	@Input() set mode(value: 'standard' | 'wild') {
		this.setIcon = `https://static.zerotoheroes.com/hearthstone/asset/firestone/images/collection/collection_${value}.webp`;
	}
	setIcon: string;

	progressNormal(): string {
		const totalCollected =
			this.sets
				?.map((set) => set.vanilla.common + set.vanilla.rare + set.vanilla.epic + set.vanilla.legendary)
				.reduce((a, b) => a + b, 0) ?? 0;
		const totalCollectible = this.sets?.map((set) => set.totalCollectibleCards).reduce((a, b) => a + b, 0) ?? 0;
		return `${totalCollected}/${totalCollectible}`;
	}

	progressGolden(): string {
		const totalCollected =
			this.sets
				?.map((set) => set.golden.common + set.golden.rare + set.golden.epic + set.golden.legendary)
				.reduce((a, b) => a + b, 0) ?? 0;
		const totalCollectible = this.sets?.map((set) => set.totalCollectibleCards).reduce((a, b) => a + b, 0) ?? 0;
		return `${totalCollected}/${totalCollectible}`;
	}
}
