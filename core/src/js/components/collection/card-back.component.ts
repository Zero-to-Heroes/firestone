import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { InternalCardBack } from './internal-card-back';

@Component({
	selector: 'card-back',
	styleUrls: [`../../../css/component/collection/card-back.component.scss`],
	template: `
		<li class="card-back" [ngClass]="{ 'missing': !cardBack.owned }" rotateOnMouseOver>
			<img [src]="cardBack.image" />
		</li>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardBackComponent {
	@Input() cardBack: InternalCardBack;
}
