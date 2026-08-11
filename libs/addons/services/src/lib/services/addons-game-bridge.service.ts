import { Injectable } from '@angular/core';
import { BnetRegion } from '@firestone-hs/reference-data';
import { AddonRegion, BattlegroundsGameEndPayload } from '@firestone/addons/common';
import { AccountService } from '@firestone/profile/services';
import { Events } from '@firestone/shared/common/service';
import { AppInjector, waitForReady } from '@firestone/shared/framework/core';
import { AddonsHostService } from './addons-host.service';
import { AddonsInstallService } from './addons-install.service';

/** Minimal shape of Events.REVIEW_FINALIZED payload (avoids importing @firestone/app/common). */
interface ReviewFinalizedInfo {
	readonly type: 'new-review' | 'new-empty-review';
	readonly reviewId: string;
	readonly game: {
		readonly gameMode?: string;
		readonly playerRank?: string | number | null;
		readonly newPlayerRank?: string | number | null;
		readonly player?: { readonly name?: string };
	};
	readonly metadata?: {
		readonly meta?: { readonly region?: BnetRegion | number | string };
	};
}

@Injectable()
export class AddonsGameBridgeService {
	private events: Events;
	private host: AddonsHostService;
	private install: AddonsInstallService;
	private account: AccountService;
	private started = false;

	public async init(): Promise<void> {
		if (this.started) {
			return;
		}
		this.started = true;
		this.events = AppInjector.get(Events);
		this.host = AppInjector.get(AddonsHostService);
		this.install = AppInjector.get(AddonsInstallService);
		this.account = AppInjector.get(AccountService);

		await waitForReady(this.install);
		await this.host.init();

		this.events.on(Events.REVIEW_FINALIZED).subscribe(async (event) => {
			try {
				const info: ReviewFinalizedInfo = event.data[0];
				await this.onReviewFinalized(info);
			} catch (e) {
				console.error('[addons-bridge] failed to handle REVIEW_FINALIZED', e);
			}
		});
		console.log('[addons-bridge] initialized');
	}

	private async onReviewFinalized(info: ReviewFinalizedInfo | null | undefined): Promise<void> {
		if (!info || info.type !== 'new-review' || !info.game) {
			return;
		}
		const mode = info.game.gameMode;
		if (mode !== 'battlegrounds' && mode !== 'battlegrounds-duo') {
			return;
		}

		// 0 is a valid start-of-season MMR. GameForUpload stringifies null as "null".
		const rating = parseBgRating(info.game.newPlayerRank) ?? parseBgRating(info.game.playerRank);
		if (rating == null) {
			console.warn('[addons-bridge] skipping BG game end, invalid rating', {
				newPlayerRank: info.game.newPlayerRank,
				playerRank: info.game.playerRank,
			});
			return;
		}

		const playerName = info.game.player?.name;
		if (!playerName?.length) {
			console.warn('[addons-bridge] skipping BG game end, missing player name');
			return;
		}

		const region = await this.resolveRegion(info);
		const payload: BattlegroundsGameEndPayload = {
			playerName,
			region,
			rating,
			reviewId: info.reviewId,
		};
		console.log('[addons-bridge] battlegroundsGameEnd', {
			playerName: payload.playerName,
			region: payload.region,
			rating: payload.rating,
			reviewId: payload.reviewId,
		});
		await this.host.emitBattlegroundsGameEnd(payload);
	}

	private async resolveRegion(info: ReviewFinalizedInfo): Promise<AddonRegion> {
		const metaRegion = info.metadata?.meta?.region;
		const fromMeta = mapRegion(metaRegion);
		if (fromMeta) {
			return fromMeta;
		}
		const accountRegion = this.account.region$$?.value ?? (await this.account.getRegion());
		return mapRegion(accountRegion) ?? 'NA';
	}
}

/** Parses BG MMR from GameForUpload fields; accepts 0, rejects null/"null"/NaN/negatives. */
const parseBgRating = (raw: string | number | null | undefined): number | null => {
	if (raw == null) {
		return null;
	}
	if (typeof raw === 'string') {
		const trimmed = raw.trim();
		if (!trimmed.length || trimmed === 'null' || trimmed === 'undefined') {
			return null;
		}
		const parsed = Number(trimmed);
		if (!Number.isFinite(parsed) || parsed < 0) {
			return null;
		}
		return Math.round(parsed);
	}
	if (!Number.isFinite(raw) || raw < 0) {
		return null;
	}
	return Math.round(raw);
};

const mapRegion = (region: BnetRegion | number | string | null | undefined): AddonRegion | null => {
	if (region == null) {
		return null;
	}
	if (typeof region === 'string') {
		const upper = region.toUpperCase();
		if (upper === 'NA' || upper === 'US') {
			return 'NA';
		}
		if (upper === 'EU') {
			return 'EU';
		}
		if (upper === 'AP' || upper === 'KR' || upper === 'TW' || upper === 'SG') {
			return 'AP';
		}
		if (upper === 'CN') {
			return 'CN';
		}
	}
	const numeric = typeof region === 'number' ? region : Number(region);
	switch (numeric) {
		case BnetRegion.REGION_US:
			return 'NA';
		case BnetRegion.REGION_EU:
			return 'EU';
		case BnetRegion.REGION_KR:
		case BnetRegion.REGION_TW:
		case BnetRegion.REGION_SG:
			return 'AP';
		case BnetRegion.REGION_CN:
			return 'CN';
		default:
			return null;
	}
};
