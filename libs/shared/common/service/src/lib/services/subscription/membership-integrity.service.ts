import { Inject, Injectable } from '@angular/core';
import {
	ADS_SERVICE_TOKEN,
	ApiRunner,
	CurrentPlan,
	IAdsService,
	isActivePremiumPlan,
	IUserService,
	LocalStorageService,
	OverwolfService,
	USER_SERVICE_TOKEN,
	waitForReady,
} from '@firestone/shared/framework/core';
import { distinctUntilChanged } from 'rxjs';
import { OwLegacyPremiumService } from './ow-legacy-premium.service';
import { SUB_STATUS_ERROR } from './subscription-status';
import { TebexService } from './tebex.service';

// Filled in after deploying the api-log-membership-bypass lambda (npm run full-deploy).
// Same URL accepts telemetry reports and `{ action: 'checkStatus' }` probes (cached server-side).
const LOG_ENDPOINT = 'https://73ybnsv6auhl6x2hv5tvdoppcq0oecmq.lambda-url.us-west-2.on.aws/';

const CHECK_INTERVAL = 2 * 60 * 1000;
// Consecutive confirmed mismatches (premium claimed AND server says no-sub) required before we
// degrade to non-premium. Gates out SSO-hint / Tebex-latency races and transient network errors.
const DEGRADE_THRESHOLD = 4;
// Prolonged inability to verify status while the client claims premium (hosts/firewall shield).
// At CHECK_INTERVAL=10m, 36 ≈ 6 hours — short outages stay fail-open.
const UNVERIFIABLE_EXPIRE_THRESHOLD = 36;
// CDP / Overwolf CEF remote-debugging ports the tool relies on. 9222 is the default.
const REMOTE_DEBUG_CANDIDATE_PORTS = [9222, 9223, 9229];

const F2G_RELATIVE_PATHS = [
	'Firestone2Green',
	'Firestone2Green/scripts/Firestone2Green.ps1',
	'Firestone2Green/assets/avatar.jpg',
	'Firestone2Green/LaunchFirestone2Green.vbs',
	'Firestone2Green/WatchFirestone2Green.vbs',
	'Firestone2Green/hosts-backups',
] as const;

type ServerPremiumVerdict = 'premium' | 'free' | 'unverifiable';

type F2gArtifacts = {
	readonly detected: boolean;
	readonly paths: readonly string[];
};

/**
 * Detects when the app grants premium ({@link IAdsService.hasPremiumSub$$} is true) while a fresh,
 * authoritative server subscription check says the user is NOT premium - the signature of a
 * membership bypass (CDP / Automation inject). Prefers the Firestone cached status API, then
 * falls back to client Tebex/legacy. Reports identity + environment evidence on the first
 * confirmed mismatch, and after {@link DEGRADE_THRESHOLD} consecutive confirmed mismatches
 * degrades via {@link IAdsService.forceNonPremium}. Also expires premium after prolonged
 * unverifiable status (hosts-block fail-open).
 */
@Injectable()
export class MembershipIntegrityService {
	// Set from the bootstrap layer (which can read isPreReleaseBuild from @firestone/game-state
	// without creating a dependency cycle). Reported as-is so it can be filtered server-side.
	public preReleaseBuild = false;

	private alreadyReported = false;
	private consecutiveMismatches = 0;
	private consecutiveUnverifiable = 0;
	private degraded = false;
	private verifying = false;

	constructor(
		@Inject(ADS_SERVICE_TOKEN) private readonly ads: IAdsService,
		@Inject(USER_SERVICE_TOKEN) private readonly userService: IUserService,
		private readonly api: ApiRunner,
		private readonly tebex: TebexService,
		private readonly legacy: OwLegacyPremiumService,
		private readonly localStorage: LocalStorageService,
		private readonly ow: OverwolfService,
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
			} else {
				this.consecutiveMismatches = 0;
				this.consecutiveUnverifiable = 0;
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
				this.consecutiveUnverifiable = 0;
				return;
			}

			const verdict = await this.serverPremiumVerdict();
			if (verdict === 'premium') {
				debug && console.debug('[membership-integrity] server has premium');
				this.consecutiveMismatches = 0;
				this.consecutiveUnverifiable = 0;
				return;
			}

			// Re-read after the await in case premium legitimately arrived (Tebex latency / SSO hint).
			if (this.ads.hasPremiumSub$$.value !== true) {
				this.consecutiveMismatches = 0;
				this.consecutiveUnverifiable = 0;
				return;
			}

			if (verdict === 'unverifiable') {
				this.consecutiveUnverifiable++;
				this.consecutiveMismatches = 0;
				debug &&
					console.debug(
						'[membership-integrity] unverifiable status',
						this.consecutiveUnverifiable,
						'/',
						UNVERIFIABLE_EXPIRE_THRESHOLD,
					);
				if (this.consecutiveUnverifiable >= UNVERIFIABLE_EXPIRE_THRESHOLD) {
					this.expireUnverifiablePremium();
				}
				return;
			}

			// Definitive free while client claims premium.
			this.consecutiveUnverifiable = 0;
			this.consecutiveMismatches++;
			debug &&
				console.debug(
					'[membership-integrity] confirmed mismatch',
					this.consecutiveMismatches,
					'/',
					DEGRADE_THRESHOLD,
				);
			if (!this.alreadyReported) {
				await this.report();
			}
			if (this.consecutiveMismatches >= DEGRADE_THRESHOLD) {
				this.degrade('membership-integrity');
			}
		} finally {
			this.verifying = false;
		}
	}

	private expireUnverifiablePremium(): void {
		console.warn(
			'[membership-integrity] expiring premium after prolonged unverifiable subscription status',
			this.consecutiveUnverifiable,
		);
		this.localStorage.setItem(LocalStorageService.CURRENT_SUB_PLAN, null);
		this.degrade('membership-unverifiable');
	}

	private degrade(reason: string): void {
		if (this.degraded) {
			return;
		}
		this.degraded = true;
		console.warn(
			'[membership-integrity] degrading to non-premium after',
			this.consecutiveMismatches,
			'confirmed mismatches /',
			this.consecutiveUnverifiable,
			'unverifiable polls, reason=',
			reason,
		);
		this.ads.forceNonPremium(reason);
	}

	/**
	 * Prefer Firestone's cached status API (does not hammer Overwolf client rate limits). Fall back
	 * to client Tebex/legacy; treat provider errors as unverifiable (fail-open for short outages).
	 */
	private async serverPremiumVerdict(): Promise<ServerPremiumVerdict> {
		const firestone = await this.firestoneCachedHasPremium();
		if (firestone === 'premium' || firestone === 'free') {
			return firestone;
		}
		try {
			const [tebexPlan, legacyPlan] = await Promise.all([
				this.tebex.getSubscriptionStatus(),
				this.legacy.getSubscriptionStatus(),
			]);
			if (tebexPlan === SUB_STATUS_ERROR || legacyPlan === SUB_STATUS_ERROR) {
				console.warn('[membership-integrity] could not verify server subscription status');
				return 'unverifiable';
			}
			if (isActivePremiumPlan(tebexPlan) || isActivePremiumPlan(legacyPlan)) {
				return 'premium';
			}
			return 'free';
		} catch (e) {
			console.warn('[membership-integrity] could not verify server subscription status', e);
			return 'unverifiable';
		}
	}

	private async firestoneCachedHasPremium(): Promise<ServerPremiumVerdict | 'skip'> {
		try {
			const currentUser = await this.userService.getCurrentUser();
			if (!currentUser?.username) {
				return 'skip';
			}
			const result = await this.api.callPostApi<{
				success?: boolean;
				inconclusive?: boolean;
				hasPremium?: boolean | null;
			}>(LOG_ENDPOINT, {
				action: 'checkStatus',
				username: currentUser.username,
				uuid: currentUser.uuid,
			});
			if (!result || result.inconclusive || result.hasPremium == null) {
				return 'unverifiable';
			}
			return result.hasPremium ? 'premium' : 'free';
		} catch (e) {
			console.debug('[membership-integrity] Firestone status probe failed, falling back', e);
			return 'skip';
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
			const f2gArtifacts = await this.probeF2gArtifacts();
			const payload = {
				clientDate: new Date().toISOString(),
				userId: currentUser?.userId,
				username: currentUser?.username,
				uuid: currentUser?.uuid,
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
				f2gArtifacts,
			};
			console.warn('[membership-integrity] detected premium without a valid subscription, reporting');
			console.debug('[membership-integrity] payload', payload);
			await this.api.callPostApi(LOG_ENDPOINT, payload);
		} catch (e) {
			console.warn('[membership-integrity] could not report membership bypass', e);
		}
	}

	private async probeF2gArtifacts(): Promise<F2gArtifacts> {
		const hits: string[] = [];
		try {
			if (!this.ow.isOwEnabled()) {
				return { detected: false, paths: [] };
			}
			const localAppData = OverwolfService.getLocalAppDataFolder();
			if (!localAppData) {
				return { detected: false, paths: [] };
			}
			const root = localAppData.replace(/[\\/]+$/, '');
			for (const relative of F2G_RELATIVE_PATHS) {
				const fullPath = `${root}\\${relative.replace(/\//g, '\\')}`;
				try {
					if (await this.ow.fileExists(fullPath)) {
						hits.push(relative);
					}
				} catch (e) {
					// ignore per-path failures
				}
			}
			// Desktop shortcut (common install of persistent repair).
			// localAppData is typically ...\AppData\Local — Desktop is ...\Desktop
			try {
				const userProfile = root.replace(/\\AppData\\Local$/i, '');
				const shortcutPath = `${userProfile}\\Desktop\\Firestone2Green 启动 Firestone.lnk`;
				if (await this.ow.fileExists(shortcutPath)) {
					hits.push('Desktop/Firestone2Green 启动 Firestone.lnk');
				}
			} catch (e) {
				// ignore
			}
		} catch (e) {
			console.debug('[membership-integrity] F2G artifact probe failed', e);
		}
		return { detected: hits.length > 0, paths: hits };
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
