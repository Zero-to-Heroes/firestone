import { BattleResultHistory } from '@firestone-hs/hs-replay-xml-parser/dist/public-api';
import { Race } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@services/cards-facade.service';
import { normalizeHeroCardId } from '../../services/battlegrounds/bgs-utils';
import { RealTimeStatsState } from '../../services/battlegrounds/store/real-time-stats/real-time-stats';
import { BgsFaceOffWithSimulation } from './bgs-face-off-with-simulation';
import { BgsPlayer } from './bgs-player';

export class BgsGame {
	readonly reviewId: string;
	readonly players: readonly BgsPlayer[] = [];
	readonly currentTurn: number = 1;
	readonly phase: 'recruit' | 'combat';
	readonly faceOffs: readonly BgsFaceOffWithSimulation[] = [];
	// readonly battleResultHistory: readonly BattleResultHistory[] = [];
	readonly replayXml: string;
	readonly mmrAtStart: number;
	readonly pogoHoppersCount: number;
	readonly availableRaces: readonly Race[];
	readonly bannedRaces: readonly Race[];
	readonly hasPrizes: boolean;
	readonly lastOpponentCardId: string;
	readonly liveStats: RealTimeStatsState;
	readonly gameEnded: boolean;

	public static create(base: BgsGame): BgsGame {
		return Object.assign(new BgsGame(), base);
	}

	public update(base: BgsGame) {
		return Object.assign(new BgsGame(), this, base);
	}

	public updatePlayer(newPlayer: BgsPlayer, allCards: CardsFacadeService): BgsGame {
		const newPlayers: readonly BgsPlayer[] = this.players.map((player) =>
			normalizeHeroCardId(player.cardId, allCards) === normalizeHeroCardId(newPlayer.cardId, allCards)
				? newPlayer
				: player,
		);
		return this.update({ players: newPlayers } as BgsGame);
	}

	public getMainPlayer(): BgsPlayer {
		const mainPlayer = this.players.find((player) => player.isMainPlayer);
		if (!mainPlayer) {
			if (this.players.length === 8) {
				console.error(
					'Could not find main player',
					this.players.map((player) => ({
						cardId: player.cardId,
						isMainPlayer: player.isMainPlayer,
						name: player.name,
					})),
				);
			}
		}
		return mainPlayer;
	}

	public updateLastFaceOff(
		opponentHeroCardId: string,
		faceOff: BgsFaceOffWithSimulation,
		createIfMissing = false,
	): BgsGame {
		if (!this.faceOffs?.length && !createIfMissing) {
			console.error(
				'[face-off] [bgs-next-opponent] trying to update non-existing face-off',
				this.faceOffs,
				faceOff,
			);
			return this;
		}

		console.debug(
			'[face-off] trying to update face-off',
			opponentHeroCardId,
			createIfMissing,
			faceOff,
			this.faceOffs,
		);
		const matchingFaceOffs = this.faceOffs
			.filter((f) => f.opponentCardId === opponentHeroCardId)
			.filter((f) => (!!faceOff.turn ? f.turn === faceOff.turn || !f.turn : true))
			.filter((f) => {
				if (faceOff.battleInfo) {
					return !f.battleInfo;
				}
				if (faceOff.battleResult) {
					return !f.battleResult;
				}
				if (faceOff.result) {
					return !f.result;
				}
				return true;
			})
			.reverse();
		if (!matchingFaceOffs.length) {
			if (!createIfMissing) {
				// Stop logging these as errors, as they happen pretty often during reconnects
				console.warn(
					'[face-off] [bgs-next-opponent] no matching face-off',
					opponentHeroCardId,
					this.faceOffs.map(
						(f) =>
							`${f.playerCardId} vs ${f.opponentCardId}, t${f.turn}, ${f.result}, ${
								f.battleInfo != null
							}, ${f.battleResult != null}`,
					),
					new Error().stack,
				);
				return this;
			} else {
				// Create a new faceOff
				return this.update({
					faceOffs: [...this.faceOffs, faceOff] as readonly BgsFaceOffWithSimulation[],
				} as BgsGame);
			}
		}

		const lastFaceOff = matchingFaceOffs[0];
		console.debug(
			'[bgs-next-opponent] found face-off',
			lastFaceOff,
			matchingFaceOffs,
			this.faceOffs,
			opponentHeroCardId,
			faceOff,
		);
		const updatedFaceOff = lastFaceOff.update(faceOff);
		updatedFaceOff.checkIntegrity(this);
		console.debug('[bgs-next-opponent] updated face-off', updatedFaceOff, this.faceOffs);
		const updatedFaceOffs: readonly BgsFaceOffWithSimulation[] = this.faceOffs.map((f) =>
			f.id === updatedFaceOff.id ? updatedFaceOff : f,
		);
		console.debug('[bgs-next-opponent] updated face-offs', updatedFaceOffs, this.faceOffs);
		const cleanedFaceOffs = this.removeOldSimulationDetails(updatedFaceOffs);
		console.debug('[bgs-next-opponent] cleaned face-offs', cleanedFaceOffs);
		return this.update({
			faceOffs: cleanedFaceOffs,
		} as BgsGame);
	}

	// Only include sim samples for the last game to reduce the memory footprint
	private removeOldSimulationDetails(
		faceOffs: readonly BgsFaceOffWithSimulation[],
	): readonly BgsFaceOffWithSimulation[] {
		if (!faceOffs?.length) {
			return [];
		}
		let hasSamples = false;
		const reversed = [...faceOffs].reverse();
		const result = [];
		for (const faceOff of reversed) {
			result.push(
				!hasSamples
					? faceOff
					: faceOff.update({
							battleResult: {
								...faceOff.battleResult,
								outcomeSamples: undefined,
							},
					  }),
			);

			if (
				!!faceOff.battleResult?.outcomeSamples?.lost?.length ||
				!!faceOff.battleResult?.outcomeSamples?.won?.length ||
				!!faceOff.battleResult?.outcomeSamples?.tied?.length
			) {
				hasSamples = true;
			}
		}
		return result.reverse();
	}

	// Not all players finish their battles at the same time. So you might still be in battle, but
	// another player might have already gone back to the tavern and levelled up for instance
	public getCurrentTurnAdjustedForAsyncPlay(): number {
		if (this.phase === 'combat') {
			return this.currentTurn + 1;
		}
		return this.currentTurn;
	}

	// For backward-compatibility
	public buildBattleResultHistory(): readonly BattleResultHistory[] {
		return this.faceOffs.map((faceOff) => ({
			turn: faceOff.turn,
			actualResult: faceOff.result,
			simulationResult: faceOff.battleResult,
			battleInfo: faceOff.battleInfo,
		}));
	}

	public getRelevantFaceOff(
		bgsShowSimResultsOnlyOnRecruit: boolean,
		bgsHideSimResultsOnRecruit: boolean,
	): BgsFaceOffWithSimulation {
		if (this.phase === 'combat') {
			if (bgsShowSimResultsOnlyOnRecruit) {
				return null;
			}
			return this.lastFaceOff();
		}

		if (bgsHideSimResultsOnRecruit) {
			return null;
		} else {
			return this.lastNonEmptyFaceOff();
		}
	}

	// Used for next opponent panel
	public lastFaceOff(): BgsFaceOffWithSimulation {
		if (!this.faceOffs?.length) {
			return null;
		}
		return this.faceOffs[this.faceOffs.length - 1];
	}

	private lastNonEmptyFaceOff(): BgsFaceOffWithSimulation {
		if (!this.faceOffs?.length) {
			return null;
		}
		return this.faceOffs
			.filter((faceOff) => faceOff.battleResult)
			.reverse()
			.shift();
	}
}
