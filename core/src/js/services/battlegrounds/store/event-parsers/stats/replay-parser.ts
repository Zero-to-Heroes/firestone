/* eslint-disable @typescript-eslint/no-use-before-define */
import { extractTotalDamageDealtToEnemyHero, Replay } from '@firestone-hs/hs-replay-xml-parser';
import { BlockType, CardType, GameTag, MetaTags, Step, Zone } from '@firestone-hs/reference-data';
import { Element } from 'elementtree';
import { Map } from 'immutable';
import { NumericTurnInfo } from '../../../../../models/battlegrounds/post-match/numeric-turn-info';
import { ParsingStructure } from './parsing-structure';

export const reparseReplay = (
	replay: Replay,
): {
	rerollsOverTurn: readonly NumericTurnInfo[];
	minionsSoldOverTurn: readonly NumericTurnInfo[];
	hpOverTurn: { [playerCardId: string]: readonly NumericTurnInfo[] };
	totalStatsOverTurn: readonly NumericTurnInfo[];
	totalMinionsDamageDealt: { [cardId: string]: number };
	totalMinionsDamageTaken: { [cardId: string]: number };
	totalDamageDealtToEnemyHeroes: number;
} => {
	const opponentPlayerElement = replay.replay
		.findall('.//Player')
		.find(player => player.get('isMainPlayer') === 'false');
	const opponentPlayerEntityId = opponentPlayerElement.get('id');
	// console.log('mainPlayerEntityId', opponentPlayerEntityId);
	const structure: ParsingStructure = {
		currentTurn: 0,
		boardOverTurn: Map.of(),
		rerollOverTurn: Map.of(),
		minionsSoldOverTurn: Map.of(),
		hpOverTurn: {},
		leaderboardPositionOverTurn: {},
		totalStatsOverTurn: Map.of(),
		entities: {},
		rerollsForTurn: 0,
		rerollsIds: [],
		playerHps: {},
		leaderboardPositions: {},
		minionsSoldForTurn: 0,
		minionsSoldIds: [],
		minionsDamageDealt: {},
		minionsDamageReceived: {},
	};

	const playerEntities = replay.replay
		.findall(`.//FullEntity`)
		.filter(fullEntity => fullEntity.find(`.Tag[@tag='${GameTag.CARDTYPE}'][@value='${CardType.HERO}']`))
		.filter(fullEntity => {
			const controllerId = parseInt(fullEntity.find(`.Tag[@tag='${GameTag.CONTROLLER}']`).get('value'));
			return controllerId === replay.mainPlayerId || controllerId === replay.opponentPlayerId;
		})
		.filter(
			fullEntity =>
				['TB_BaconShop_HERO_PH', 'TB_BaconShop_HERO_KelThuzad', 'TB_BaconShopBob'].indexOf(
					fullEntity.get('cardID'),
				) === -1,
		);
	const playerCardIds: readonly string[] = [
		...new Set(playerEntities.map(entity => entity.get('cardID'))),
	] as readonly string[];
	for (const playerCardId of playerCardIds) {
		structure.playerHps[playerCardId] = playerCardId === 'TB_BaconShop_HERO_34' ? 50 : 40;
	}

	parseElement(
		replay.replay.getroot(),
		replay.mainPlayerId,
		opponentPlayerEntityId,
		null,
		{ currentTurn: 0 },
		[
			compositionForTurnParse(structure),
			rerollsForTurnParse(structure),
			minionsSoldForTurnParse(structure),
			hpForTurnParse(structure, playerEntities),
			leaderboardForTurnParse(structure, playerEntities),
			damageDealtByMinionsParse(structure, replay),
		],
		[
			compositionForTurnPopulate(structure, replay),
			rerollsForTurnPopulate(structure, replay),
			minionsSoldForTurnPopulate(structure, replay),
			// Order is important, because we want to first populate the leaderboard (for which it's easy
			// to filter out the mulligan choices) and use this to iterate on the other elements
			leaderboardForTurnPopulate(structure, replay),
			hpForTurnPopulate(structure, replay),
			totalStatsForTurnPopulate(structure, replay),
		],
	);

	// const compositionsOverTurn: readonly BgsCompositionForTurn[] = structure.boardOverTurn
	// 	.map((cards: any[], turn: number) => {
	// 		return {
	// 			turn: turn,
	// 			beast: cards.filter(card => card.tribe === Race.BEAST).length,
	// 			demon: cards.filter(card => card.tribe === Race.DEMON).length,
	// 			dragon: cards.filter(card => card.tribe === Race.DRAGON).length,
	// 			mech: cards.filter(card => card.tribe === Race.MECHANICAL).length,
	// 			murloc: cards.filter(card => card.tribe === Race.MURLOC).length,
	// 			blank: cards.filter(card => card.tribe === Race.BLANK || card.tribe === -1).length,
	// 		} as BgsCompositionForTurn;
	// 	})
	// 	.valueSeq()
	// 	.toArray();
	const rerollsOverTurn: readonly NumericTurnInfo[] = structure.rerollOverTurn
		.map(
			(rerolls, turn: number) =>
				({
					turn: turn,
					value: rerolls,
				} as NumericTurnInfo),
		)
		.valueSeq()
		.toArray();
	const minionsSoldOverTurn: readonly NumericTurnInfo[] = structure.minionsSoldOverTurn
		.map(
			(minions, turn: number) =>
				({
					turn: turn,
					value: minions,
				} as NumericTurnInfo),
		)
		.valueSeq()
		.toArray();
	const hpOverTurn: { [playerCardId: string]: readonly NumericTurnInfo[] } = structure.hpOverTurn;
	const totalStatsOverTurn: readonly NumericTurnInfo[] = structure.totalStatsOverTurn
		.map((stats: number, turn: number) => {
			return {
				turn: turn,
				value: stats,
			} as NumericTurnInfo;
		})
		.valueSeq()
		.toArray();
	return {
		// compositionsOverTurn: compositionsOverTurn,
		rerollsOverTurn: rerollsOverTurn,
		minionsSoldOverTurn: minionsSoldOverTurn,
		hpOverTurn: hpOverTurn,
		totalStatsOverTurn: totalStatsOverTurn,
		totalDamageDealtToEnemyHeroes: extractTotalDamageDealtToEnemyHero(replay).opponent,
		totalMinionsDamageDealt: structure.minionsDamageDealt,
		totalMinionsDamageTaken: structure.minionsDamageReceived,
	};
};

const hpForTurnParse = (structure: ParsingStructure, playerEntities: readonly Element[]) => {
	return element => {
		if (
			element.tag === 'TagChange' &&
			parseInt(element.get('value')) > 0 &&
			parseInt(element.get('tag')) === GameTag.DAMAGE &&
			playerEntities.map(entity => entity.get('id')).indexOf(element.get('entity')) !== -1
		) {
			const playerCardId = playerEntities
				.find(entity => entity.get('id') === element.get('entity'))
				.get('cardID');
			structure.playerHps[playerCardId] =
				// Patchwerk is a special case
				Math.max(0, (playerCardId === 'TB_BaconShop_HERO_34' ? 50 : 40) - parseInt(element.get('value')));
		}
	};
};

const leaderboardForTurnParse = (structure: ParsingStructure, playerEntities: readonly Element[]) => {
	return element => {
		if (
			element.tag === 'TagChange' &&
			parseInt(element.get('tag')) === GameTag.PLAYER_LEADERBOARD_PLACE &&
			playerEntities.map(entity => entity.get('id').indexOf(element.get('entity')) !== -1)
		) {
			const playerCardId = playerEntities
				.find(entity => entity.get('id') === element.get('entity'))
				.get('cardID');
			structure.leaderboardPositions[playerCardId] = parseInt(element.get('value'));
		}
	};
};

const rerollsForTurnParse = (structure: ParsingStructure) => {
	return element => {
		if (element.tag === 'FullEntity' && element.get('cardID') === 'TB_BaconShop_8p_Reroll_Button') {
			structure.rerollsIds = [...structure.rerollsIds, element.get('id')];
		}
		if (
			element.tag === 'Block' &&
			parseInt(element.get('type')) === BlockType.POWER &&
			structure.rerollsIds.indexOf(element.get('entity')) !== -1 &&
			element.findall('.FullEntity').length > 0
		) {
			// console.log('adding one reroll', structure.rerollsForTurn, element);
			structure.rerollsForTurn = structure.rerollsForTurn + 1;
		}
	};
};

const minionsSoldForTurnParse = (structure: ParsingStructure) => {
	return element => {
		if (element.tag === 'FullEntity' && element.get('cardID') === 'TB_BaconShop_DragSell') {
			structure.minionsSoldIds = [...structure.minionsSoldIds, element.get('id')];
		}
		if (
			element.tag === 'Block' &&
			parseInt(element.get('type')) === BlockType.POWER &&
			structure.minionsSoldIds.indexOf(element.get('entity')) !== -1
		) {
			// console.log('adding one reroll', structure.rerollsForTurn, element);
			structure.minionsSoldForTurn = structure.minionsSoldForTurn + 1;
		}
	};
};

const leaderboardForTurnPopulate = (structure: ParsingStructure, replay: Replay) => {
	return currentTurn => {
		for (const playerCardId of Object.keys(structure.leaderboardPositions)) {
			const currentLeaderboards = [...(structure.leaderboardPositionOverTurn[playerCardId] || [])];
			currentLeaderboards.push({
				turn: currentTurn,
				value: structure.leaderboardPositions[playerCardId],
			});
			structure.leaderboardPositionOverTurn[playerCardId] = currentLeaderboards;
		}
	};
};

const hpForTurnPopulate = (structure: ParsingStructure, replay: Replay) => {
	return currentTurn => {
		for (const playerCardId of Object.keys(structure.leaderboardPositions)) {
			const currentHps = [...(structure.hpOverTurn[playerCardId] || [])];
			currentHps.push({
				turn: currentTurn,
				value: structure.playerHps[playerCardId],
			});
			structure.hpOverTurn[playerCardId] = currentHps;
		}
	};
};

const rerollsForTurnPopulate = (structure: ParsingStructure, replay: Replay) => {
	return currentTurn => {
		structure.rerollOverTurn = structure.rerollOverTurn.set(currentTurn, structure.rerollsForTurn);
		structure.rerollsForTurn = 0;
	};
};

const minionsSoldForTurnPopulate = (structure: ParsingStructure, replay: Replay) => {
	return currentTurn => {
		structure.minionsSoldOverTurn = structure.minionsSoldOverTurn.set(currentTurn, structure.minionsSoldForTurn);
		structure.minionsSoldForTurn = 0;
	};
};

const totalStatsForTurnPopulate = (structure: ParsingStructure, replay: Replay) => {
	return currentTurn => {
		const totalStatsOnBoard = Object.values(structure.entities)
			.filter(entity => entity.controller === replay.mainPlayerId)
			.filter(entity => entity.zone === Zone.PLAY)
			.filter(entity => entity.cardType === CardType.MINION)
			.map(entity => entity.atk + entity.health)
			.reduce((a, b) => a + b, 0);
		structure.totalStatsOverTurn = structure.totalStatsOverTurn.set(currentTurn, totalStatsOnBoard);
	};
};

const damageDealtByMinionsParse = (structure: ParsingStructure, replay: Replay) => {
	return (element: Element) => {
		// For now we only consider damage in attacks / powers, which should cover most cases
		if (element.tag?.toString() === 'Block') {
			// console.log('handling block', element.tag, element.get('type'), element.get('entity'));
			const actionEntity = structure.entities[element.get('entity')];
			if (!actionEntity) {
				// console.warn('could not find entity', element.get('entity'));
				return;
			}
			const damageTags = element.findall(`.//MetaData[@meta='${MetaTags.DAMAGE}']`);
			// If it's an attack, the attacker deals to the def, and vice versa
			if ([BlockType.ATTACK].indexOf(parseInt(element.get('type'))) !== -1) {
				// const debug = element.get('entity') === '6205';
				// console.log('handling attack', element.get('entity'), '6205', damageTags.length);
				const attackerEntityId = element.find(`.//TagChange[@tag='${GameTag.ATTACKING}']`)?.get('entity');
				const defenderEntityId = element.find(`.//TagChange[@tag='${GameTag.DEFENDING}']`)?.get('entity');
				damageTags.forEach(tag => {
					const infos = tag.findall(`.Info`);
					// if (debug) {
					// 	// console.log('handling damage tag', tag);
					// }
					infos.forEach(info => {
						// if (debug) {
						// 	// console.log('handling info', info);
						// }
						const damagedEntity = structure.entities[info.get('entity')];
						// if (info.get('entity') === '6205') {
						// 	console.log(
						// 		'damage in attack',
						// 		info.get('entity'),
						// 		element.get('entity'),
						// 		damagedEntity.controller,
						// 		replay.mainPlayerId,
						// 		actionEntity.controller,
						// 		damagedEntity,
						// 		info,
						// 	);
						// }
						// We are damaged, so add the info
						if (damagedEntity.controller === replay.mainPlayerId) {
							// if (debug) {
							// 	console.log(
							// 		'damage dealt to us',
							// 		damagedEntity.cardId,
							// 		structure.minionsDamageReceived[damagedEntity.cardId],
							// 		parseInt(tag.get('data')),
							// 	);
							// }
							structure.minionsDamageReceived[damagedEntity.cardId] =
								(structure.minionsDamageReceived[damagedEntity.cardId] || 0) +
								parseInt(tag.get('data'));
						}
						// We are not damaged, so the Info represents the opponent's entity
						// First case, we attack so we add the damage to our count
						else if (actionEntity.controller === replay.mainPlayerId) {
							// if (debug) {
							// 	console.log(
							// 		'damage dealt by us while we attack',
							// 		actionEntity.cardId,
							// 		structure.minionsDamageDealt[actionEntity.cardId],
							// 		parseInt(tag.get('data')),
							// 	);
							// }
							structure.minionsDamageDealt[actionEntity.cardId] =
								(structure.minionsDamageDealt[actionEntity.cardId] || 0) + parseInt(tag.get('data'));
						}
						// Second case, we are attacked so we need to find out who did the damage to the enemy
						else {
							const defenderEntity = structure.entities[defenderEntityId];
							// if (debug) {
							// 	console.log(
							// 		'damage dealt by us while we are attacked',
							// 		defenderEntity.cardId,
							// 		structure.minionsDamageDealt[defenderEntityId],
							// 		parseInt(tag.get('data')),
							// 	);
							// }
							structure.minionsDamageDealt[defenderEntity.cardId] =
								(structure.minionsDamageDealt[defenderEntity.cardId] || 0) + parseInt(tag.get('data'));
						}
					});
				});
			}
			// Otherwise, it goes one way
			else {
				// We do the damage
				if (actionEntity.controller === replay.mainPlayerId && actionEntity.cardType === CardType.MINION) {
					const newDamage = damageTags.map(tag => parseInt(tag.get('data'))).reduce((a, b) => a + b, 0);
					structure.minionsDamageDealt[actionEntity.cardId] =
						(structure.minionsDamageDealt[actionEntity.cardId] || 0) + newDamage;
				}
				// Damage is done to us
				else if (actionEntity.controller !== replay.mainPlayerId && actionEntity.cardType === CardType.MINION) {
					damageTags.forEach(tag => {
						const infos = tag.findall(`.Info`);
						infos.forEach(info => {
							const damagedEntity = structure.entities[info.get('entity')];
							// if (damagedEntity.cardId === 'BGS_038') {
							// 	console.log('handling damage done to us', tag, element);
							// }
							if (
								damagedEntity.controller === replay.mainPlayerId &&
								damagedEntity.cardType === CardType.MINION
							) {
								structure.minionsDamageReceived[damagedEntity.cardId] =
									(structure.minionsDamageReceived[damagedEntity.cardId] || 0) +
									parseInt(tag.get('data'));
							}
						});
					});
				}
			}
		}
	};
};

// While we don't use the metric, the entity info that is populated is useful for other extractors
const compositionForTurnParse = (structure: ParsingStructure) => {
	return element => {
		if (element.tag === 'FullEntity') {
			structure.entities[element.get('id')] = {
				cardId: element.get('cardID'),
				controller: parseInt(element.find(`.Tag[@tag='${GameTag.CONTROLLER}']`)?.get('value') || '-1'),
				zone: parseInt(element.find(`.Tag[@tag='${GameTag.ZONE}']`)?.get('value') || '-1'),
				zonePosition: parseInt(element.find(`.Tag[@tag='${GameTag.ZONE_POSITION}']`)?.get('value') || '-1'),
				cardType: parseInt(element.find(`.Tag[@tag='${GameTag.CARDTYPE}']`)?.get('value') || '-1'),
				tribe: parseInt(element.find(`.Tag[@tag='${GameTag.CARDRACE}']`)?.get('value') || '-1'),
				atk: parseInt(element.find(`.Tag[@tag='${GameTag.ATK}']`)?.get('value') || '0'),
				health: parseInt(element.find(`.Tag[@tag='${GameTag.HEALTH}']`)?.get('value') || '0'),
			};
		}
		if (structure.entities[element.get('entity')]) {
			if (parseInt(element.get('tag')) === GameTag.CONTROLLER) {
				structure.entities[element.get('entity')].controller = parseInt(element.get('value'));
			}
			if (parseInt(element.get('tag')) === GameTag.ZONE) {
				// console.log('entity', child.get('entity'), structure.entities[child.get('entity')]);
				structure.entities[element.get('entity')].zone = parseInt(element.get('value'));
			}
			if (parseInt(element.get('tag')) === GameTag.ZONE_POSITION) {
				// console.log('entity', child.get('entity'), structure.entities[child.get('entity')]);
				structure.entities[element.get('entity')].zonePosition = parseInt(element.get('value'));
			}
			if (parseInt(element.get('tag')) === GameTag.ATK) {
				// ATK.log('entity', child.get('entity'), structure.entities[child.get('entity')]);
				structure.entities[element.get('entity')].atk = parseInt(element.get('value'));
			}
			if (parseInt(element.get('tag')) === GameTag.HEALTH) {
				// console.log('entity', child.get('entity'), structure.entities[child.get('entity')]);
				structure.entities[element.get('entity')].health = parseInt(element.get('value'));
			}
		}
	};
};

const compositionForTurnPopulate = (structure: ParsingStructure, replay: Replay) => {
	return currentTurn => {
		const playerEntitiesOnBoard = Object.values(structure.entities)
			.map(entity => entity as any)
			.filter(entity => entity.controller === replay.mainPlayerId)
			.filter(entity => entity.zone === Zone.PLAY)
			.filter(entity => entity.cardType === CardType.MINION)
			.map(entity => ({
				cardId: entity.cardId,
				tribe: entity.tribe,
			}));
		structure.boardOverTurn = structure.boardOverTurn.set(currentTurn, playerEntitiesOnBoard);
		// console.log('updated', structure.boardOverTurn.toJS(), playerEntitiesOnBoard);
	};
};

const parseElement = (
	element: Element,
	mainPlayerId: number,
	opponentPlayerEntityId: string,
	parent: Element,
	turnCountWrapper,
	parseFunctions,
	populateFunctions,
) => {
	parseFunctions.forEach(parseFunction => parseFunction(element));
	if (element.tag === 'TagChange') {
		if (
			parseInt(element.get('tag')) === GameTag.NEXT_STEP &&
			parseInt(element.get('value')) === Step.MAIN_START_TRIGGERS
		) {
			// console.log('considering parent', parent.get('entity'), parent);
			if (parent && parent.get('entity') === opponentPlayerEntityId) {
				populateFunctions.forEach(populateFunction => populateFunction(turnCountWrapper.currentTurn));
				turnCountWrapper.currentTurn++;
			}
			// console.log('board for turn', structure.currentTurn, mainPlayerId, '\n', playerEntitiesOnBoard);
		}
	}

	const children = element.getchildren();
	if (children && children.length > 0) {
		for (const child of children) {
			parseElement(
				child,
				mainPlayerId,
				opponentPlayerEntityId,
				element,
				turnCountWrapper,
				parseFunctions,
				populateFunctions,
			);
		}
	}
};
