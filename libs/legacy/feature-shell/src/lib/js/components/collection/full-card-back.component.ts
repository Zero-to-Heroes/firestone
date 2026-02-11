import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { CardBack } from '@firestone/memory';
import { PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { Observable } from 'rxjs';
import { InternalCardBack } from './internal-card-back';

@Component({
	standalone: false,
	selector: 'full-card-back',
	styleUrls: [`../../../css/component/collection/full-card-back.component.scss`],
	template: `
		<div class="card-back-details-container" *ngIf="_cardBack">
			<card-back
				class="card-back"
				[cardBack]="_cardBack"
				[animated]="animated$ | async"
				[alwaysOn]="true"
			></card-back>
			<div class="details">
				<h1>{{ _cardBack.name }}</h1>
				<div class="card-back-details">
					<div class="card-back-info description">
						<span class="value">{{ this.transformFlavor(_cardBack.text) }}</span>
					</div>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FullCardBackComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	animated$: Observable<boolean>;
	_cardBack: InternalCardBack;

	@Input() set cardBack(value: CardBack) {
		if (!value) {
			return;
		}
		this._cardBack = {
			...value,
			image: `https://static.firestoneapp.com/cardbacks/512/${value.id}.png`,
			animatedImage: `https://static.firestoneapp.com/cardbacks/512/${value.id}.webm`,
		};
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.markForCheck();
		}
	}

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly prefs: PreferencesService,
	) {
		super(cdr);
	}

	ngAfterContentInit() {
		this.animated$ = this.prefs.preferences$$.pipe(
			this.mapData(
				(prefs) =>
					prefs.cardBackAnimatedToggle === 'animated' || prefs.cardBackAnimatedToggle === 'animated-all',
			),
		);
	}

	transformFlavor(flavor: string): string {
		const result = flavor
			.replace(/\n/g, '<br>')
			.replace(/<i>/g, '')
			.replace(/<\/i>/g, '')
			.replace(/<br>/g, ' ')
			.replace(/[x]/g, '');
		return result;
	}
}
