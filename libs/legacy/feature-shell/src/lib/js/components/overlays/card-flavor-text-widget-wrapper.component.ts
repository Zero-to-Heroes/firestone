import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewRef } from '@angular/core';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { Observable } from 'rxjs';
import { CardFlavorTextService, FlavorTextInfo } from '../../services/decktracker/card-flavor-text.service';

@Component({
	standalone: false,
	selector: 'card-flavor-text-widget-wrapper',
	styleUrls: ['./card-flavor-text-widget-wrapper.component.scss'],
	template: `
		<div class="flavor-text-widget" *ngIf="flavorTextInfo$ | async as info">
			<div class="flavor-text-container">
				<div class="card-name">{{ info.cardName }}</div>
				<div class="flavor-text">{{ info.flavorText }}</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardFlavorTextWidgetWrapperComponent extends AbstractSubscriptionComponent implements OnInit {
	flavorTextInfo$: Observable<FlavorTextInfo | null>;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly flavorTextService: CardFlavorTextService,
	) {
		super(cdr);
	}

	ngOnInit(): void {
		this.flavorTextInfo$ = this.flavorTextService.flavorText$$.pipe(this.mapData((info) => info));

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
