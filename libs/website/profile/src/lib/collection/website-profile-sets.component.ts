import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ProfileSet } from '@firestone-hs/api-user-profile';
import { ExtendedProfileSet } from '../+state/website/profile.models';

@Component({
	selector: 'website-profile-sets',
	styleUrls: [`./website-profile-sets.component.scss`],
	template: `
		<div *ngIf="sets?.length" class="sets-container">
			<div class="category-header">{{ header }}</div>
			<div class="category-container">
				<ol>
					<li *ngFor="let set of sets; trackBy: trackById">
						<set-view
							class="set"
							[setId]="set.id"
							[released]="true"
							[collectedCards]="getTotalGlobalCollected(set)"
							[collectableCards]="getTotalCollectableCards(set)"
							[collectedCardsGolden]="getTotalGoldenCollected(set)"
							[showHoverEffect]="false"
						>
						</set-view>
					</li>
				</ol>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WebsiteProfileSetsComponent {
	@Input() sets: readonly ExtendedProfileSet[] | null;
	@Input() header: string;

	getTotalGlobalCollected(set: ExtendedProfileSet): number {
		return set.global.totalCollectedCards;
	}

	getTotalGoldenCollected(set: ExtendedProfileSet): number {
		return set.golden.totalCollectedCards;
	}

	getTotalCollectableCards(set: ExtendedProfileSet): number {
		return set.totalCollectibleCards;
	}

	trackById(index, set: ProfileSet) {
		return set?.id;
	}
}
