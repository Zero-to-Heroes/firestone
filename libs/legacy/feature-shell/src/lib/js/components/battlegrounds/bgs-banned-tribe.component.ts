import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { CardClass, getTribeIcon, Race } from '@firestone-hs/reference-data';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { BehaviorSubject, combineLatest, filter, takeUntil } from 'rxjs';
import { classForTribe, colorForClass } from '../../services/hs-utils';

@Component({
	selector: 'bgs-banned-tribe',
	styleUrls: [
		`../../../css/global/cdk-overlay.scss`,
		// `../../../css/themes/battlegrounds-theme.scss`,
		'../../../css/component/battlegrounds/bgs-banned-tribe.component.scss',
	],
	template: `
		<div class="bgs-banned-tribe" *ngIf="image">
			<div class="background" [ngStyle]="{ 'background-color': color }"></div>
			<img class="icon" [src]="image" />
			<div class="center-wrapper" *ngIf="!available">
				<div class="cross-container-outer">
					<div class="cross-container-inner">
						<img
							class="crossed"
							src="https://static.zerotoheroes.com/hearthstone/asset/coliseum/images/mulligan_discard.png"
						/>
					</div>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsBannedTribeComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	image: string;
	color: string;

	@Input() set tribe(value: Race) {
		if (!value) {
			this.image = undefined;
			return;
		}
		this.image = getTribeIcon(value);
		this.tribe$$.next(value);
	}

	@Input() set useTribeColors(value: boolean) {
		this.useTribeColors$$.next(value);
	}

	@Input() available: boolean;

	private tribe$$ = new BehaviorSubject<Race | null>(null);
	private useTribeColors$$ = new BehaviorSubject<boolean>(false);

	constructor(protected readonly cdr: ChangeDetectorRef) {
		super(cdr);
	}

	ngAfterContentInit(): void {
		combineLatest([this.tribe$$, this.useTribeColors$$])
			.pipe(
				filter(([tribe, useTribeColors]) => !!tribe),
				takeUntil(this.destroyed$),
			)
			.subscribe(([tribe, useTribeColors]) => {
				if (useTribeColors) {
					const cardClass = classForTribe(tribe);
					this.color = colorForClass(CardClass[cardClass]?.toLowerCase());
					console.debug('color', this.color, Race[tribe].toLowerCase(), tribe);
				} else {
					this.color = null;
				}
			});
	}
}
