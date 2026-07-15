import { Inject, Injectable } from '@angular/core';
import {
	ADS_SERVICE_TOKEN,
	ApiRunner,
	CurrentPlan,
	IAdsService,
	isActivePremiumPlan,
	IUserService,
	LocalStorageService,
	USER_SERVICE_TOKEN,
	waitForReady,
} from '@firestone/shared/framework/core';
import { distinctUntilChanged } from 'rxjs';
import { OwLegacyPremiumService } from './ow-legacy-premium.service';
import { SUB_STATUS_ERROR } from './subscription-status';
import { TebexService } from './tebex.service';

// Filled in after deploying the api-log-membership-bypass lambda (npm run full-deploy)
const LOG_ENDPOINT = 'https://73ybnsv6auhl6x2hv5tvdoppcq0oecmq.lambda-url.us-west-2.on.aws/';

const CHECK_INTERVAL = 2 * 60 * 1000;
// Consecutive confirmed mismatches (premium claimed AND server says no-sub) required before we
// degrade to non-premium. Gates out SSO-hint / Tebex-latency races and transient network errors,
// since a single good/errored reply resets the counter. ~DEGRADE_THRESHOLD * CHECK_INTERVAL ≈ 2 min,
// which is fine given HS games / sessions run several minutes.
const DEGRADE_THRESHOLD = 4;
// CDP / Overwolf CEF remote-debugging ports the tool relies on. 9222 is the default.
const REMOTE_DEBUG_CANDIDATE_PORTS = [9222, 9223, 9229];

/**
 * Detects when the app grants premium ({@link IAdsService.hasPremiumSub$$} is true) while a fresh,
 * authoritative server subscription check (Tebex + legacy) says the user is NOT premium - the
 * signature of the CDP-injection membership bypass. It reports the user's identity (plus environment
 * evidence) on the first confirmed mismatch, and after {@link DEGRADE_THRESHOLD} consecutive
 * confirmed mismatches it degrades the app to non-premium via {@link IAdsService.forceNonPremium}.
 */
@Injectable()
export class MembershipIntegrityService {
	// Set from the bootstrap layer (which can read isPreReleaseBuild from @firestone/game-state
	// without creating a dependency cycle). Reported as-is so it can be filtered server-side.
	public preReleaseBuild = false;

	private alreadyReported = false;
	private consecutiveMismatches = 0;
	private degraded = false;
	private verifying = false;

	constructor(
		@Inject(ADS_SERVICE_TOKEN) private readonly ads: IAdsService,
		@Inject(USER_SERVICE_TOKEN) private readonly userService: IUserService,
		private readonly api: ApiRunner,
		private readonly tebex: TebexService,
		private readonly legacy: OwLegacyPremiumService,
		private readonly localStorage: LocalStorageService,
	) {
		this.start();
	}

	private async start(): Promise<void> {
		// No environment gating: NODE_ENV / isPreReleaseBuild are themselves patchable by the
		// injected script, so we always run and report their values instead of trusting them.
		await waitForReady(this.ads);

		this.ads.hasPremiumSub$$.pipe(distinctUntilChanged()).subscribe((hasPremium) => {
			if (hasPremium) {
				this.verify();
			}
		});
		setInterval(() => this.verify(), CHECK_INTERVAL);
	}

	private async verify(): Promise<void> {
		const debug = true;
		// Guard against overlapping runs (the hasPremiumSub subscription and the interval can both
		// trigger verify around the same time), which would otherwise double-count mismatches.
		if (this.degraded || this.verifying) {
			return;
		}
		this.verifying = true;
		try {
			if (this.ads.hasPremiumSub$$.value !== true) {
				debug && console.debug('[membership-integrity] hasPremiumSub is false');
				this.consecutiveMismatches = 0;
				return;
			}
			// serverHasPremium() returns true on any network/error, so errors reset the counter and
			// never count as a mismatch.
			if (await this.serverHasPremium()) {
				debug && console.debug('[membership-integrity] server has premium');
				this.consecutiveMismatches = 0;
				return;
			}
			// Re-read after the await in case premium legitimately arrived (Tebex latency / SSO hint).
			if (this.ads.hasPremiumSub$$.value !== true) {
				this.consecutiveMismatches = 0;
				return;
			}

			this.consecutiveMismatches++;
			debug &&
				console.debug(
					'[membership-integrity] confirmed mismatch',
					this.consecutiveMismatches,
					'/',
					DEGRADE_THRESHOLD,
				);
			// Report early (first confirmed mismatch) so telemetry fires well before we degrade.
			if (!this.alreadyReported) {
				await this.report();
			}
			if (this.consecutiveMismatches >= DEGRADE_THRESHOLD) {
				this.degrade();
			}
		} finally {
			this.verifying = false;
		}
	}

	private degrade(): void {
		if (this.degraded) {
			return;
		}
		this.degraded = true;
		console.warn(
			'[membership-integrity] degrading to non-premium after',
			this.consecutiveMismatches,
			'confirmed mismatches',
		);
		this.ads.forceNonPremium('membership-integrity');
	}

	private async serverHasPremium(): Promise<boolean> {
		try {
			const [tebexPlan, legacyPlan] = await Promise.all([
				this.tebex.getSubscriptionStatus(),
				this.legacy.getSubscriptionStatus(),
			]);
			// The status services signal an error when they couldn't get a definitive answer from the
			// server (eg 502). Assume premium in that case to avoid false positives.
			if (tebexPlan === SUB_STATUS_ERROR || legacyPlan === SUB_STATUS_ERROR) {
				console.warn('[membership-integrity] could not verify server subscription status');
				return true;
			}
			return isActivePremiumPlan(tebexPlan) || isActivePremiumPlan(legacyPlan);
		} catch (e) {
			// On error, assume premium to avoid false positives (e.g. transient network issues).
			console.warn('[membership-integrity] could not verify server subscription status', e);
			return true;
		}
	}

	private async report(): Promise<void> {
		this.alreadyReported = true;
		try {
			const currentUser = await this.userService.getCurrentUser();
			const localPlan = this.localStorage.getItem<CurrentPlan>(LocalStorageService.CURRENT_SUB_PLAN);
			const [tebexResult, legacyResult] = await Promise.all([
				this.tebex.getSubscriptionStatus(),
				this.legacy.getSubscriptionStatus(),
			]);
			const tebexPlan = tebexResult === SUB_STATUS_ERROR ? null : tebexResult;
			const legacyPlan = legacyResult === SUB_STATUS_ERROR ? null : legacyResult;
			const remoteDebugging = await this.probeRemoteDebugging();
			const payload = {
				clientDate: new Date().toISOString(),
				userId: currentUser?.userId,
				username: currentUser?.username,
				machineId: currentUser?.machineId,
				appVersion: process.env['APP_VERSION'],
				claimedPlanId: this.ads.currentPlan$$.value?.id,
				planIds: [tebexPlan?.id, legacyPlan?.id, tebexPlan?.discordCode],
				localPlanId: localPlan?.id,
				serverHasPremium: false,
				enablePremiumFeatures: this.ads.enablePremiumFeatures$$.value,
				nodeEnv: process.env['NODE_ENV'],
				isPreReleaseBuild: this.preReleaseBuild,
				remoteDebuggingDetected: remoteDebugging.detected,
				remoteDebuggingPort: remoteDebugging.port,
				devtoolsHeuristic: this.detectDevtoolsHeuristic(),
			};
			console.warn('[membership-integrity] detected premium without a valid subscription, reporting');
			console.debug('[membership-integrity] payload', payload);
			await this.api.callPostApi(LOG_ENDPOINT, payload);
		} catch (e) {
			console.warn('[membership-integrity] could not report membership bypass', e);
		}
	}

	private async probeRemoteDebugging(): Promise<{ detected: boolean; port: number | null }> {
		for (const port of REMOTE_DEBUG_CANDIDATE_PORTS) {
			if (await this.probePort(port)) {
				return { detected: true, port };
			}
		}
		return { detected: false, port: null };
	}

	private async probePort(port: number): Promise<boolean> {
		try {
			const controller = new AbortController();
			const timeout = setTimeout(() => controller.abort(), 600);
			// no-cors resolves (opaque) when something is listening, rejects on connection refused.
			await fetch(`http://127.0.0.1:${port}/json/version`, { mode: 'no-cors', signal: controller.signal });
			clearTimeout(timeout);
			return true;
		} catch (e) {
			return false;
		}
	}

	private detectDevtoolsHeuristic(): boolean {
		try {
			let accessed = false;
			const probe = /./;
			probe.toString = () => {
				accessed = true;
				return '';
			};
			// When a devtools/CDP console formats the object, it reads toString.
			console.debug('%c', probe);
			return accessed;
		} catch (e) {
			return false;
		}
	}
}
