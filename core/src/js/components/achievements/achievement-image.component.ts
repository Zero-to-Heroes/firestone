import { animate, state, style, transition, trigger } from '@angular/animations';
import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	Input,
	ViewEncapsulation,
	ViewRef,
} from '@angular/core';

@Component({
	selector: 'achievement-image',
	styleUrls: [`../../../css/component/achievements/achievement-image.component.scss`],
	template: `
		<div class="achievement-image-container">
			<img
				src="{{ image }}"
				class="real-achievement {{ _imageType }}"
				(load)="imageLoadedHandler()"
				[@showRealAchievement]="!showPlaceholder"
			/>
			<div class="overlay"></div>
			<i class="i-84x90 frame">
				<svg>
					<use xlink:href="assets/svg/sprite.svg#achievement_frame" />
				</svg>
			</i>
		</div>
	`,
	encapsulation: ViewEncapsulation.None,
	changeDetection: ChangeDetectionStrategy.OnPush,
	animations: [
		trigger('showPlaceholder', [
			state(
				'false',
				style({
					opacity: 0,
					'pointer-events': 'none',
				}),
			),
			state(
				'true',
				style({
					opacity: 1,
				}),
			),
			transition('true => false', animate(`150ms linear`)),
		]),
		trigger('showRealAchievement', [
			state(
				'false',
				style({
					opacity: 0,
					'pointer-events': 'none',
				}),
			),
			state(
				'true',
				style({
					opacity: 1,
				}),
			),
			transition('false => true', animate(`150ms linear`)),
		]),
	],
})
export class AchievementImageComponent {
	image: string;
	_imageType: string;
	showPlaceholder = true;

	constructor(private cdr: ChangeDetectorRef) {}

	@Input() set imageId(imageId: string) {
		this.image = `https://static.zerotoheroes.com/hearthstone/cardart/256x/${imageId}.jpg`;
	}

	@Input() set imageType(imageType: string) {
		this._imageType = imageType;
	}

	imageLoadedHandler() {
		this.showPlaceholder = false;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
