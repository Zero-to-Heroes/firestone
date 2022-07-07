/* eslint-disable @angular-eslint/contextual-lifecycle */
import {
	AfterContentInit,
	AfterViewInit,
	ChangeDetectorRef,
	ElementRef,
	HostListener,
	Injectable,
	OnDestroy,
	Renderer2,
	ViewRef,
} from '@angular/core';
import { sleep } from '@services/utils';
import { BehaviorSubject, combineLatest, fromEvent, Observable, Subscription } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { AbstractSubscriptionTwitchComponent } from './abstract-subscription-twitch.component';
import { TwitchPreferences } from './twitch-preferences';
import { TwitchPreferencesService } from './twitch-preferences.service';

@Injectable()
export abstract class AbstractSubscriptionTwitchResizableComponent
	extends AbstractSubscriptionTwitchComponent
	implements AfterContentInit, AfterViewInit, OnDestroy {
	private resizeObservable$: Observable<Event>;
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

	ngAfterContentInit() {
		this.resizeObservable$ = fromEvent(window, 'resize');
		this.sub = combineLatest(
			this.resizeObservable$,
			this.prefs.prefs.asObservable(),
			this.resizeSubject.asObservable(),
		)
			.pipe(
				map(([windowResize, prefs, resize]) => {
					return prefs;
				}),
				takeUntil(this.destroyed$),
			)
			.subscribe((prefs) => {
				this.resize(prefs);
			});
	}

	async ngAfterViewInit() {
		await sleep(100);
		this.onResized(null);
	}

	@HostListener('window:resize', ['$event'])
	async onResized(event) {
		this.resizeSubject.next(!this.resizeSubject.value);
	}

	ngOnDestroy(): void {
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
