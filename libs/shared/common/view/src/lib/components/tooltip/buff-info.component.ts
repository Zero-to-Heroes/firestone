import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { CardsFacadeService } from '@firestone/shared/framework/core';

@Component({
	selector: 'buff-info',
	styleUrls: [`./buff-info.component.scss`],
	template: `
		<div class="buff-info">
			<div class="header">
				<div class="count" *ngIf="count > 1">x{{ count }}</div>
				<div class="name">{{ name }}</div>
			</div>
			<div class="body">
				<div class="icon-container">
					<img [src]="iconUrl" class="icon" />
				</div>
				<div class="text">{{ text }}</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BuffInfoComponent {
	count: number;
	name: string;
	iconUrl: string;
	text: string;

	@Input() set buff(value: { bufferCardId: string; buffCardId: string; count: number }) {
		this.updateBuff(value);
	}

	constructor(private readonly allCards: CardsFacadeService, private readonly cdr: ChangeDetectorRef) {}

	private async updateBuff(value: { bufferCardId: string; buffCardId: string; count: number }) {
		const card = this.allCards.getCard(value.buffCardId);
		this.count = value.count;
		this.name = card.name;
		this.iconUrl = `https://static.zerotoheroes.com/hearthstone/cardart/256x/${value.bufferCardId}.jpg`;
		this.text = card.text?.replace(/<\/?[ib]>/g, '');
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
