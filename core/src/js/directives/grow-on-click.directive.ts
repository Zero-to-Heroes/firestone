import { animate, AnimationBuilder, AnimationMetadata, AnimationPlayer, style } from '@angular/animations';
import { Directive, ElementRef, HostListener, Input } from '@angular/core';
import { PreferencesService } from '../services/preferences.service';

@Directive({
	selector: '[growOnClick]',
})
export class GrowOnClickDirective {
	@Input() growOnClickScale = 1.3;

	private animationPlayer: AnimationPlayer;

	constructor(
		private readonly el: ElementRef,
		private readonly builder: AnimationBuilder,
		private readonly prefs: PreferencesService,
	) {}

	@HostListener('click')
	async onClick() {
		const metadata: AnimationMetadata[] = [
			style({
				transform: 'scale(1)',
			}),
			animate(
				'0.15s',
				style({
					transform: `scale(${this.growOnClickScale})`,
				}),
			),
			animate(
				'0.15s',
				style({
					transform: 'scale(1)',
				}),
			),
		];
		const factory = this.builder.build(metadata);
		this.animationPlayer = factory.create(this.el.nativeElement);
		this.animationPlayer.play();
	}
}
