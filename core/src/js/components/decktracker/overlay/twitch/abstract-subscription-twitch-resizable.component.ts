import { ChangeDetectorRef, ElementRef, HostListener, Injectable, Renderer2, ViewRef } from '@angular/core';
import { sleep } from '@services/utils';
import { BehaviorSubject, combineLatest, Subscription } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { AbstractSubscriptionTwitchComponent } from './abstract-subscription-twitch.component';
import { TwitchPreferences } from './twitch-preferences';
import { TwitchPreferencesService } from './twitch-preferences.service';

@Injectable()
export abstract class AbstractSubscriptionTwitchResizableComponent extends AbstractSubscriptionTwitchComponent {
	private resizeSubject = new BehaviorSubject<boolean>(false);
	private sub: Subscription;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		protected readonly prefs: TwitchPreferencesService,
		protected readonly el: ElementRef,
		protected readonly renderer: Renderer2,
	) {
		super(cdr);
	}

	async listenForResize() {
		this.sub = combineLatest(this.prefs.prefs.asObservable(), this.resizeSubject.asObservable())
			.pipe(
				map(([prefs, resize]) => prefs),
				takeUntil(this.destroyed$),
			)
			.subscribe((prefs) => {
				this.resize(prefs);
			});
		await sleep(100);
		this.onResized(null);
	}

	@HostListener('window:resize', ['$event'])
	async onResized(event) {
		this.resizeSubject.next(!this.resizeSubject.value);
	}

	@HostListener('window:beforeunload')
	onDestroy(): void {
		this.sub?.unsubscribe();
	}

	private resize(prefs: TwitchPreferences) {
		try {
			const newHeight = window.innerHeight;
			const adaptativeScale = prefs.adaptativeScaling ? Math.max(0.5, Math.min(1, newHeight / 950)) : 1;
			const scale = (prefs.scale / 100) * adaptativeScale;
			const element = this.el.nativeElement.querySelector('.scalable');
			this.renderer.setStyle(element, 'transform', `scale(${scale})`);
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
		} catch (e) {
			console.warn('Caught exception while trying to resize overlay', e);
		}
	}
}
