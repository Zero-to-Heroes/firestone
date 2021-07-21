import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { CardPackResult, PackResult } from '@firestone-hs/retrieve-pack-stats';

@Component({
	selector: 'pack-display',
	styleUrls: [
		`../../../css/global/scrollbar.scss`,
		`../../../css/global/forms.scss`,
		`../../../css/global/toggle.scss`,
		`../../../css/component/collection/pack-display.component.scss`,
	],
	template: `
		<div class="pack-display" *ngIf="cards?.length">
			<div
				class="card {{ card.cardType?.toLowerCase() }}"
				*ngFor="let card of cards; let i = index; trackBy: trackByFn"
				[style.left.%]="getLeft(i)"
				[cardTooltip]="card.cardId"
				[cardTooltipType]="card.cardType"
				[cardTooltipText]="''"
			>
				<img
					*ngIf="card.cardType === 'NORMAL'"
					[src]="
						'https://static.zerotoheroes.com/hearthstone/fullcard/en/compressed/' + card.cardId + '.png?v=3'
					"
				/>
				<video *ngIf="card.cardType === 'GOLDEN'" #videoPlayer loop="loop" [autoplay]="true" [preload]="true">
					<source
						src="{{
							'https://static.zerotoheroes.com/hearthstone/fullcard/en/golden/' +
								card.cardId +
								'.webm?v=3'
						}}"
						type="video/webm"
					/>
				</video>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PackDisplayComponent {
	@Input() set pack(value: PackResult) {
		this.cards = value.cards;
		// if (!(this.cdr as ViewRef)?.destroyed) {
		// 	this.cdr.detectChanges();
		// }
	}

	cards: readonly CardPackResult[];

	constructor(private readonly cdr: ChangeDetectorRef) {}

	getLeft(i: number): number {
		const offset = 0;
		const step = 18;
		return offset + i * step;
	}

	trackByFn(item: CardPackResult, index: number) {
		return item.cardId + '' + index;
	}
}
