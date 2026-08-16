import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { SettingsControllerService } from '@firestone/settings/services';
import {
	FeatureSpotlight,
	FeatureSpotlightsService,
	PreferencesService,
	resolveSpotlightMediaFile,
} from '@firestone/shared/common/service';
import { SpotlightMediaLightboxService } from '@firestone/shared/common/view';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { waitForReady, WindowHandlerFacadeService } from '@firestone/shared/framework/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';

@Component({
	standalone: false,
	selector: 'featured-spotlights',
	styleUrls: ['./featured-spotlights.component.scss'],
	template: `
		<div class="featured-spotlights" *ngIf="spotlights$ | async as spotlights">
			<ng-container *ngIf="spotlights.length">
				<div class="featured-title" [fsTranslate]="'new-version.featured-title'"></div>
				<div class="featured-item" *ngFor="let spotlight of spotlights">
					<div class="copy">
						<div class="item-title">{{ spotlight.title }}</div>
						<div class="item-blurb">{{ spotlight.blurb }}</div>
					</div>
					<div
						class="media"
						*ngIf="spotlight.mediaUrl && !spotlight.mediaFailed"
						(click)="openMedia(spotlight)"
					>
						<video
							*ngIf="spotlight.mediaType === 'video'"
							[src]="spotlight.mediaUrl"
							autoplay
							muted
							loop
							playsinline
							(error)="onMediaError(spotlight)"
						></video>
						<img
							*ngIf="spotlight.mediaType === 'image'"
							[src]="spotlight.mediaUrl"
							alt=""
							(error)="onMediaError(spotlight)"
						/>
					</div>
					<button class="show-me" type="button" (click)="showMe(spotlight)">
						{{ 'new-version.show-me' | fsTranslate }}
					</button>
				</div>
			</ng-container>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeaturedSpotlightsComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	@Input() set version(value: string | null | undefined) {
		this.version$$.next(value ?? null);
	}

	@Input() set latestVersion(value: string | null | undefined) {
		this.latestVersion$$.next(value ?? null);
	}

	spotlights$: Observable<readonly FeaturedSpotlightView[]>;

	private version$$ = new BehaviorSubject<string | null>(null);
	private latestVersion$$ = new BehaviorSubject<string | null>(null);

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly spotlights: FeatureSpotlightsService,
		private readonly settingsController: SettingsControllerService,
		private readonly windowHandler: WindowHandlerFacadeService,
		private readonly prefs: PreferencesService,
		private readonly lightbox: SpotlightMediaLightboxService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.spotlights, this.prefs, this.settingsController);

		this.spotlights$ = combineLatest([
			this.version$$,
			this.latestVersion$$,
			this.spotlights.currentVersion$$,
			this.prefs.preferences$$,
		]).pipe(
			this.mapData(([selectedVersion, latestVersion, currentVersion]) => {
				const latest = latestVersion || currentVersion;
				if (!selectedVersion || !latest || selectedVersion !== latest) {
					return [];
				}
				return this.toView(this.spotlights.getFeatured());
			}),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.markForCheck();
		}
	}

	async showMe(spotlight: FeaturedSpotlightView) {
		if (spotlight.settingsNodeId) {
			this.settingsController.setShowNewOnly(true);
			this.settingsController.selectNodeFromOutside(spotlight.settingsNodeId);
		}
		const prefs = await this.prefs.getPreferences();
		this.windowHandler.showSettingsWindow(prefs.collectionUseOverlay);
	}

	onMediaError(spotlight: FeaturedSpotlightView) {
		spotlight.mediaFailed = true;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.markForCheck();
		}
	}

	openMedia(spotlight: FeaturedSpotlightView) {
		if (!spotlight.mediaUrl || spotlight.mediaFailed) {
			return;
		}
		this.lightbox.open({ url: spotlight.mediaUrl, mediaType: spotlight.mediaType });
	}

	private toView(spotlights: readonly FeatureSpotlight[]): readonly FeaturedSpotlightView[] {
		return spotlights.map((spotlight) => {
			const media = resolveSpotlightMediaFile(spotlight);
			return {
				id: spotlight.id,
				title: this.spotlights.getTitle(spotlight),
				blurb: this.spotlights.getBlurb(spotlight),
				settingsNodeId: spotlight.target.settingsNodeId,
				mediaUrl: this.spotlights.getMediaUrl(media),
				mediaType: media.match(/\.(webm|mp4|mov)$/i) ? 'video' : 'image',
				mediaFailed: false,
			};
		});
	}
}

interface FeaturedSpotlightView {
	readonly id: string;
	readonly title: string;
	readonly blurb: string;
	readonly settingsNodeId?: string;
	readonly mediaUrl?: string;
	readonly mediaType: 'image' | 'video';
	mediaFailed: boolean;
}
