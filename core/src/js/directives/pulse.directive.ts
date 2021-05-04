import { animate, AnimationBuilder, AnimationMetadata, AnimationPlayer, style } from '@angular/animations';
import { Directive, ElementRef, HostListener, Input } from '@angular/core';
import { FtueKey } from '../models/preferences/ftue';
import { PreferencesService } from '../services/preferences.service';

@Directive({
	selector: '[pulse]',
})
export class PulseDirective {
	private pulsePlayer: AnimationPlayer;
	private burstPlayer: AnimationPlayer;
	private _value: FtueKey;

	@Input('pulse') set pulseProperty(value: FtueKey) {
		// console.log('setting pulse', value);
		this._value = value;
		this.setProperty(value);
	}

	constructor(
		private readonly el: ElementRef,
		private readonly builder: AnimationBuilder,
		private readonly prefs: PreferencesService,
	) {}

	@HostListener('mouseenter')
	async onMouseEnter() {
		this.startBurst(this._value);
		if (this._value) {
			await this.prefs.acknowledgeFtue(this._value);
			await this.setProperty(this._value);
		}
	}

	private async setProperty(value: FtueKey) {
		const prefs = await this.prefs.getPreferences();
		if (!value || prefs.ftue[value]) {
			return;
		}
		try {
			if (this.pulsePlayer) {
				this.pulsePlayer.destroy();
			}
		} catch (e) {}
		const rbgValue = this.buildRgbValueToUse();
		if (!rbgValue) {
			return;
		}
		const metadata: AnimationMetadata[] = [
			style({
				borderRadius: '50%',
				overflow: 'visible',
				zIndex: 9999,
				transform: 'translateZ(0)',
				boxShadow: `0 0 0 0px rgba(${rbgValue}, 0.4)`,
			}),
			animate(
				'2s',
				style({
					boxShadow: `0 0 0 35px rgba(${rbgValue}, 0.0)`,
				}),
			),
		];
		const factory = this.builder.build(metadata);
		this.pulsePlayer = factory.create(this.el.nativeElement);
		this.play();
	}

	private async startBurst(value: FtueKey) {
		const prefs = await this.prefs.getPreferences();
		if (!value || prefs.ftue[value]) {
			return;
		}
		try {
			if (this.pulsePlayer) {
				this.pulsePlayer.pause();
				this.pulsePlayer.destroy();
			}
			if (this.burstPlayer) {
				this.burstPlayer.destroy();
			}
		} catch (e) {}
		const rbgValue = this.buildRgbValueToUse();
		if (!rbgValue) {
			return;
		}
		const metadata: AnimationMetadata[] = [
			style({
				borderRadius: '50%',
				overflow: 'visible',
				zIndex: 9999,
				transform: 'translateZ(0)',
				boxShadow: `0 0 0 0px rgba(${rbgValue}, 0.4)`,
			}),
			animate(
				'0.5s',
				style({
					boxShadow: `0 0 0 50px rgba(${rbgValue}, 0.0)`,
				}),
			),
		];
		const factory = this.builder.build(metadata);
		this.burstPlayer = factory.create(this.el.nativeElement);
		this.burstPlayer.play();
	}

	private play() {
		if (this.pulsePlayer) {
			try {
				this.pulsePlayer.onDone(() => {
					this.reset();
					this.play();
				});
				this.pulsePlayer.play();
			} catch (e) {}
		}
	}

	private reset() {
		if (this.pulsePlayer) {
			try {
				this.pulsePlayer.reset();
			} catch (e) {}
		}
	}

	private buildRgbValueToUse(): string {
		const hexValue = window.getComputedStyle(this.el.nativeElement).getPropertyValue('--pulse-color').trim();
		const rgb = this.hexToRgb(hexValue);
		if (rgb) {
			return rgb.r + ', ' + rgb.g + ', ' + rgb.b;
		}
		return null;
	}

	private hexToRgb(hex) {
		// Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
		const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
		hex = hex.replace(shorthandRegex, function (m, r, g, b) {
			return r + r + g + g + b + b;
		});

		const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
		return result
			? {
					r: parseInt(result[1], 16),
					g: parseInt(result[2], 16),
					b: parseInt(result[3], 16),
			  }
			: null;
	}
}
