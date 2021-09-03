import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	Input,
	Output,
	ViewRef,
} from '@angular/core';

@Component({
	selector: 'bgs-hero-portrait-simulator',
	styleUrls: [`../../../../css/component/battlegrounds/battles/bgs-hero-portrait-simulator.component.scss`],
	template: `
		<div class="container">
			<div class="hero">
				<bgs-hero-portrait
					class="portrait click-to-change"
					[heroCardId]="heroCardId"
					[health]="health"
					[maxHealth]="maxHealth"
				></bgs-hero-portrait>
				<bgs-plus-button class="change-icon" (click)="onPortraitClick()"></bgs-plus-button>
				<tavern-level-icon *ngIf="_tavernTier" [level]="_tavernTier" class="tavern"></tavern-level-icon>
			</div>
			<div class="hero-power">
				<div
					class="hero-power-container"
					[cardTooltip]="_heroPowerCardId"
					[cardTooltipPosition]="tooltipPosition"
				>
					<img [src]="heroPowerIcon" class="image" *ngIf="!!heroPowerIcon" />
					<div class="image empty-icon" *ngIf="!heroPowerIcon"></div>
					<img
						src="https://static.zerotoheroes.com/hearthstone/asset/firestone/images/bgs_hero_power_frame.png?v=3"
						class="frame"
					/>
				</div>
				<bgs-plus-button class="change-icon" (click)="onHeroPowerClick()"></bgs-plus-button>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsHeroPortraitSimulatorComponent {
	@Output() portraitChangeRequested: EventEmitter<void> = new EventEmitter<void>();
	@Output() heroPowerChangeRequested: EventEmitter<void> = new EventEmitter<void>();

	@Input() health = 40;
	@Input() maxHealth = 40;
	@Input() heroCardId: string;
	@Input() tooltipPosition: string;

	@Input() set tavernTier(value: number) {
		this._tavernTier = value;
		console.debug('setting tavern tier', this._tavernTier);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	@Input() set heroPowerCardId(value: string) {
		this._heroPowerCardId = value;
		if (value) {
			this.heroPowerIcon = `https://static.zerotoheroes.com/hearthstone/cardart/256x/${value}.jpg`;
			console.debug('heroPowerIcon', this.heroPowerIcon, value);
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
		}
	}

	heroIcon: string;
	heroPowerIcon: string;
	_heroPowerCardId: string;
	_tavernTier: number;

	constructor(private readonly cdr: ChangeDetectorRef) {}

	onPortraitClick() {
		this.portraitChangeRequested.next();
	}

	onHeroPowerClick() {
		this.heroPowerChangeRequested.next();
	}
}
