import { Inject, Injectable } from '@angular/core';
import { sleep } from '@firestone/shared/framework/common';
import { APP_VERSION_SERVICE_TOKEN, IAppVersionService, ILocalizationService } from '@firestone/shared/framework/core';
import { BehaviorSubject } from 'rxjs';
import { FEATURE_SPOTLIGHTS } from '../models/feature-spotlights.catalog';
import { FeatureSpotlight } from '../models/feature-spotlight';
import { Preferences } from '../models/preferences';
import {
	buildSpotlightTooltipHtml,
	collectSpotlightTargets,
	filterActiveSpotlights,
	filterFeaturedSpotlights,
	findSpotlightForPrefField,
	findSpotlightsForModule,
	findSpotlightsForNodeId,
	getFeatureSpotlightMediaUrl,
	getSpotlightBlurbKey,
	getSpotlightTitleKey,
	isSpotlightUnseen,
	SpotlightTargets,
	translateSpotlightField,
} from './feature-spotlights.utils';
import { PreferencesService } from './preferences.service';

@Injectable()
export class FeatureSpotlightsService {
	public readonly currentVersion$$ = new BehaviorSubject<string | null>(null);
	public readonly activeSpotlights$$ = new BehaviorSubject<readonly FeatureSpotlight[]>([]);

	private ready = false;

	constructor(
		@Inject(APP_VERSION_SERVICE_TOKEN) private readonly appVersion: IAppVersionService,
		private readonly prefs: PreferencesService,
		private readonly i18n: ILocalizationService,
	) {
		this.init();
	}

	public async isReady() {
		while (!this.ready) {
			await sleep(50);
		}
	}

	public getAll(): readonly FeatureSpotlight[] {
		return FEATURE_SPOTLIGHTS;
	}

	public getActive(): readonly FeatureSpotlight[] {
		return this.activeSpotlights$$.getValue();
	}

	public getFeatured(): readonly FeatureSpotlight[] {
		const version = this.currentVersion$$.getValue();
		if (!version) {
			return FEATURE_SPOTLIGHTS.filter((spotlight) => spotlight.featured).slice(0, 3);
		}
		return filterFeaturedSpotlights(FEATURE_SPOTLIGHTS, version);
	}

	public getTargets(spotlights: readonly FeatureSpotlight[] = this.getActive()): SpotlightTargets {
		return collectSpotlightTargets(spotlights);
	}

	public getUnseen(seenIds: readonly string[] | null | undefined): readonly FeatureSpotlight[] {
		return this.getActive().filter((spotlight) => isSpotlightUnseen(spotlight.id, seenIds));
	}

	public findForPrefField(field: keyof Preferences | string | undefined): FeatureSpotlight | undefined {
		return findSpotlightForPrefField(this.getActive(), field);
	}

	public findForNodeId(nodeId: string | undefined): readonly FeatureSpotlight[] {
		return findSpotlightsForNodeId(this.getActive(), nodeId);
	}

	public findForModule(module: string | undefined): readonly FeatureSpotlight[] {
		return findSpotlightsForModule(this.getActive(), module);
	}

	public getMediaUrl(file: string): string {
		return getFeatureSpotlightMediaUrl(file);
	}

	public getTitle(spotlight: FeatureSpotlight): string {
		return translateSpotlightField(
			(key) => this.i18n.translateString(key),
			getSpotlightTitleKey(spotlight.id),
			spotlight.title,
		);
	}

	public getBlurb(spotlight: FeatureSpotlight): string {
		return translateSpotlightField(
			(key) => this.i18n.translateString(key),
			getSpotlightBlurbKey(spotlight.id),
			spotlight.blurb,
		);
	}

	public buildTooltipHtml(spotlight: FeatureSpotlight): string {
		return buildSpotlightTooltipHtml(spotlight, this.getBlurb(spotlight));
	}

	public async acknowledge(id: string): Promise<void> {
		await this.acknowledgeMany([id]);
	}

	public async acknowledgeMany(ids: readonly string[]): Promise<void> {
		if (!ids.length) {
			return;
		}
		await this.prefs.acknowledgeSpotlights(ids);
	}

	private async init() {
		try {
			const info = await this.appVersion.getAppVersion();
			const version = info?.version;
			if (version) {
				this.currentVersion$$.next(version);
				this.activeSpotlights$$.next(filterActiveSpotlights(FEATURE_SPOTLIGHTS, version));
			}
		} catch (e) {
			console.warn('[feature-spotlights] could not read app version', e);
			this.activeSpotlights$$.next(FEATURE_SPOTLIGHTS);
		}
		this.ready = true;
	}
}
