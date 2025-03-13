/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Injectable } from '@angular/core';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import {
	AbstractFacadeService,
	AppInjector,
	LocalStorageService,
	WindowManagerService,
} from '@firestone/shared/framework/core';
import { filter } from 'rxjs';
import { CustomAppearance, CustomStyleKey, FinalStyles, defaultStyleKeys } from '../models/custom-appearance';

@Injectable()
export class CustomAppearanceService extends AbstractFacadeService<CustomAppearanceService> {
	public colors$$: SubscriberAwareBehaviorSubject<CustomAppearance | null>;
	public finalStyles$$: SubscriberAwareBehaviorSubject<FinalStyles | null>;

	private localStorage: LocalStorageService;

	private internalSubject$$: SubscriberAwareBehaviorSubject<null>;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'CustomAppearanceService', () => !!this.colors$$);
	}

	protected override assignSubjects() {
		this.colors$$ = this.mainInstance.colors$$;
		this.finalStyles$$ = this.mainInstance.finalStyles$$;
	}

	protected async init() {
		this.internalSubject$$ = new SubscriberAwareBehaviorSubject<null>(null);
		this.colors$$ = new SubscriberAwareBehaviorSubject<CustomAppearance | null>(null);
		this.finalStyles$$ = new SubscriberAwareBehaviorSubject<FinalStyles | null>(null);
		this.localStorage = AppInjector.get(LocalStorageService);

		this.colors$$.onFirstSubscribe(() => {
			this.internalSubject$$.subscribe();
		});
		this.finalStyles$$.onFirstSubscribe(() => {
			this.internalSubject$$.subscribe();
		});

		const defaultStyles = await defaultStyleKeys();

		this.internalSubject$$.onFirstSubscribe(() => {
			const localColors =
				this.localStorage.getItem<CustomAppearance>(LocalStorageService.LOCAL_STORAGE_CUSTOM_APPEARANCE) ??
				({} as CustomAppearance);
			this.colors$$.next(localColors);

			this.colors$$.subscribe((colors) => {
				this.localStorage.setItem(LocalStorageService.LOCAL_STORAGE_CUSTOM_APPEARANCE, colors);
			});

			this.colors$$.pipe(filter((colors) => !!colors)).subscribe((colors) => {
				const bgsBackgroundColor = getStyle(colors, defaultStyles, '--bgs-widget-background-color');
				const finalStyles: FinalStyles = {
					...colors!,
					'--bgs-simulation-widget-background-image': `radial-gradient(30vw at 50% 50%, ${bgsBackgroundColor} 0%, rgba(30, 1, 22, 1) 100%),
		url('https://static.zerotoheroes.com/hearthstone/asset/firestone/images/backgrounds/battlegrounds.jpg')`,
					'--bgs-session-widget-background-image': `radial-gradient(30vw at 50% 50%, ${bgsBackgroundColor} 0%, rgba(30, 1, 22, 1) 100%),
		url('https://static.zerotoheroes.com/hearthstone/asset/firestone/images/backgrounds/battlegrounds.jpg')`,
					'--bgs-minions-list-widget-background-image': `radial-gradient(50% 50% at 50% 50%, ${bgsBackgroundColor} 0%, rgba(43, 24, 39, 0.7) 100%),
		url('https://static.zerotoheroes.com/hearthstone/asset/firestone/images/backgrounds/bg_tier_list.png')`,
				};
				// console.debug('[custom-appearance] setting final styles', finalStyles);
				this.finalStyles$$.next(finalStyles);
			});
		});
	}

	public register() {
		this.finalStyles$$.subscribe((styles) => {
			if (!styles) {
				return;
			}

			// Set the CSS variables, for each key in the styles
			Object.keys(styles).forEach((key) => {
				window.document.documentElement.style.setProperty(key, styles[key]);
				console.debug('[custom-appearance] setting style', key, styles[key]);
			});
		});
	}

	public resetAll() {
		this.mainInstance.resetAllInternal();
	}

	private async resetAllInternal() {
		const defaultStyles = await defaultStyleKeys();
		this.colors$$.next(defaultStyles);
	}

	public setColor(key: CustomStyleKey, value: string) {
		this.mainInstance.setColorInternal(key, value);
	}

	public setColorInternal(key: CustomStyleKey, value: string) {
		const currentColors = this.colors$$.value!;
		this.colors$$.next({
			...currentColors,
			[key]: value,
		});
	}
}

const getStyle = (colors: CustomAppearance | null, defaultStyles: CustomAppearance, key: CustomStyleKey) => {
	return colors?.[key] ?? defaultStyles[key];
};
