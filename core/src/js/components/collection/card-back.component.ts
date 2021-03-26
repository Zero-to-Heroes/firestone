import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { InternalCardBack } from './internal-card-back';

@Component({
	selector: 'card-back',
	styleUrls: [`../../../css/component/collection/card-back.component.scss`],
	template: `
		<div
			class="card-back"
			[ngClass]="{ 'missing': !cardBack.owned }"
			[helpTooltip]="cardBack.name"
			rotateOnMouseOver
		>
			<img [src]="cardBack.image + '?v=3'" />
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardBackComponent {
	@Input() cardBack: InternalCardBack;
}
