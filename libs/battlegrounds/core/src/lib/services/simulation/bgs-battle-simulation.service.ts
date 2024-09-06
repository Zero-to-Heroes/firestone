import { Inject, Injectable } from '@angular/core';
import { CardIds, normalizeHeroCardId, Race } from '@firestone-hs/reference-data';
import { BgsBattleInfo } from '@firestone-hs/simulate-bgs-battle/dist/bgs-battle-info';
import { BgsBattleOptions } from '@firestone-hs/simulate-bgs-battle/dist/bgs-battle-options';
import { SimulationResult } from '@firestone-hs/simulate-bgs-battle/dist/simulation-result';
import { GameSample } from '@firestone-hs/simulate-bgs-battle/dist/simulation/spectator/game-sample';
import { BugReportService, Preferences, PreferencesService } from '@firestone/shared/common/service';
import { sleep } from '@firestone/shared/framework/common';
import { ADS_SERVICE_TOKEN, ApiRunner, CardsFacadeService, IAdsService } from '@firestone/shared/framework/core';
import { BehaviorSubject } from 'rxjs';
import { BgsBattleSimulationExecutorService } from './bgs-battle-simulation-executor.service';
import { BgsIntermediateResultsSimGuardianService } from './bgs-intermediate-results-sim-guardian.service';

const BGS_BATTLE_SIMULATION_ENDPOINT = 'https://664abby5durcmapfl2wc6cqlaq0xkkcm.lambda-url.us-west-2.on.aws/';
const BGS_BATTLE_SIMULATION_SAMPLE_ENDPOINT = 'https://r65kigvlbtzarakaxao6kxw4q40sesoo.lambda-url.us-west-2.on.aws/';

@Injectable()
export class BgsBattleSimulationService {
	public battleInfo$$ = new BehaviorSubject<BattleInfo | null>(null);

	private isPremium: boolean;

	constructor(
		private readonly api: ApiRunner,
		private readonly cards: CardsFacadeService,
		private readonly executor: BgsBattleSimulationExecutorService,
		@Inject(ADS_SERVICE_TOKEN) private readonly ads: IAdsService,
		private readonly bugService: BugReportService,
		private readonly prefs: PreferencesService,
		private readonly guardian: BgsIntermediateResultsSimGuardianService,
	) {
		this.init();
	}

	private async init() {
		await this.ads.isReady();

		this.ads.enablePremiumFeatures$$.subscribe((premium) => {
			this.isPremium = premium;
		});
	}

	public async startBgsBattleSimulation(
		gameId: string,
		battleId: string,
		battleInfo: BgsBattleInfo,
		races: readonly Race[],
		currentTurn: number,
		reconnectOngoing: boolean,
	) {
		const prefs = await this.prefs?.getPreferences();
		if (!prefs.bgsEnableSimulation || !prefs.bgsFullToggle) {
			console.log('[bgs-simulation] simulation turned off');
			return;
		}
		const options: BgsBattleOptions = {
			...battleInfo.options,
		} as BgsBattleOptions;
		const battleInfoInput: BgsBattleInfo = {
			...battleInfo,
			options,
			gameState: {
				validTribes: races,
				currentTurn: currentTurn,
			},
		};
		console.debug('[bgs-simulation] battle simulation request prepared', battleInfo);

		const shouldUseLocalSimulator = !prefs.bgsUseRemoteSimulator || !this.isPremium;
		const shouldUseIntermediateResults =
			prefs.bgsSimShowIntermediaryResults && (this.isPremium || this.guardian.hasFreeUses(gameId));
		console.debug(
			'[bgs-simulation] [debug] useLocalSim?',
			shouldUseLocalSimulator,
			shouldUseIntermediateResults,
			prefs.bgsSimShowIntermediaryResults,
			this.guardian.hasFreeUses(gameId),
			this.isPremium,
			gameId,
		);

		// Don't show intermediate results
		if (shouldUseLocalSimulator && shouldUseIntermediateResults && !reconnectOngoing) {
			(battleInfoInput.options as any).intermediateResults = 200;
			console.debug('[bgs-simulation] [debug] starting sim with partial results');
			this.simulateLocalBattle(battleInfoInput, prefs, async (result: SimulationResult | null) => {
				await sleep(0);
				const resultForLog = !!result ? { ...result } : null;
				if (!!resultForLog) {
					delete resultForLog.outcomeSamples;
				}
				if (!!result) {
					console.debug('[bgs-simulation] [debug] partial battle simulation result', resultForLog);
					if (result.outcomeSamples) {
						console.log('[bgs-simulation] battle simulation result', resultForLog);
					}
					this.battleInfo$$.next({
						battleId: battleId,
						result: result,
						intermediateResult: !result.outcomeSamples,
						heroCardId: normalizeHeroCardId(
							battleInfoInput.opponentBoard.player.nonGhostCardId ??
								CardIds.Kelthuzad_TB_BaconShop_HERO_KelThuzad,
							this.cards,
						),
					});
				}
			});
		} else {
			console.debug('[bgs-simulation] [debug] starting sim for single use');
			(battleInfoInput.options as any).intermediateResults = 0;
			const result: SimulationResult | null = shouldUseLocalSimulator
				? await this.simulateLocalBattleOnce(battleInfoInput, prefs)
				: await this.api.callPostApi<SimulationResult>(BGS_BATTLE_SIMULATION_ENDPOINT, battleInfoInput);
			const resultForLog = !!result ? { ...result } : null;
			if (!!resultForLog) {
				delete resultForLog.outcomeSamples;
			}
			console.log('[bgs-simulation] battle simulation result', resultForLog);
			this.battleInfo$$.next({
				battleId: battleId,
				result: result,
				heroCardId: normalizeHeroCardId(
					battleInfoInput.opponentBoard.player.nonGhostCardId ??
						CardIds.Kelthuzad_TB_BaconShop_HERO_KelThuzad,
					this.cards,
				),
			});
		}
	}

	public async getIdForSimulationSample(sample: GameSample): Promise<string | null> {
		console.log('calling sample endpoint');
		try {
			const result = await this.api.callPostApi<string>(BGS_BATTLE_SIMULATION_SAMPLE_ENDPOINT, sample);
			console.log('[bgs-simulation] id for simulation sample', result);
			return result;
		} catch (e: any) {
			console.error('[bgs-simulation] could not get if from sample', e.message, sample, e);
			return null;
		}
	}

	public async getIdForSimulationSampleWithFetch(sample: GameSample): Promise<string | null> {
		console.log('calling fetch sample endpoint');
		try {
			const response = await fetch(BGS_BATTLE_SIMULATION_SAMPLE_ENDPOINT, {
				method: 'POST',
				mode: 'cors',
				// credentials: 'same-origin',
				headers: {
					'Content-Type': 'application/json',
					// 'Content-Type': 'application/x-www-form-urlencoded',
				},
				body: JSON.stringify(sample),
			});
			// console.debug('[bgs-simulation] id for simulation sample', response);
			return response.text();
		} catch (e: any) {
			console.error('[bgs-simulation] could not get if from sample', e.message, sample, e);
			return null;
		}
	}

	public simulateLocalBattleOnce(battleInfo: BgsBattleInfo, prefs: Preferences): Promise<SimulationResult | null> {
		return new Promise<SimulationResult | null>((resolve) => {
			try {
				this.executor.simulateLocalBattle(battleInfo, prefs, (result) => resolve(result));
			} catch (e: any) {
				console.error('[bgs-simulation] could not simulate battle', e.message, e);
				if (!e.message?.includes('Maximum call stack size exceeded')) {
					this.bugService.submitAutomatedReport({
						type: 'bg-sim-crash',
						info: JSON.stringify({
							message: '[bgs-simulation] Simulation crashed',
							battleInfo: battleInfo,
						}),
					});
				}
			}
		});
	}

	public simulateLocalBattle(
		battleInfo: BgsBattleInfo,
		prefs: Preferences,
		onResultReceived: (result: SimulationResult | null) => void,
	): void {
		try {
			this.executor.simulateLocalBattle(battleInfo, prefs, onResultReceived);
		} catch (e: any) {
			console.error('[bgs-simulation] could not simulate battle', e.message, e);
			if (!e.message?.includes('Maximum call stack size exceeded')) {
				this.bugService.submitAutomatedReport({
					type: 'bg-sim-crash',
					info: JSON.stringify({
						message: '[bgs-simulation] Simulation crashed',
						battleInfo: battleInfo,
					}),
				});
			}
		}
	}
}

export interface BattleInfo {
	battleId: string;
	result: SimulationResult | null;
	intermediateResult?: boolean;
	heroCardId: string;
}
