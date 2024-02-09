/* eslint-disable @typescript-eslint/no-use-before-define */
import { Replay } from '@firestone-hs/hs-replay-xml-parser/dist/public-api';
import { GameTag, Step } from '@firestone-hs/reference-data';
import { Element } from 'elementtree';
import { EventEmitter } from 'events';
import { EventName } from './json-event';
import { entities } from './parsers/entities';
import { ParsingStructure } from './parsing-structure';

export interface ParserFunction {
	parser?: (
		replay: Replay,
		structure: ParsingStructure,
		emitter: (eventName: EventName, event: any) => void,
	) => (element: Element) => void;
	endOfTurn?: (
		replay: Replay,
		structure: ParsingStructure,
		emitter: (eventName: EventName, event: any) => void,
	) => (currentTurn: number, turnChangeElement: Element) => void;
}

export class ReplayParser extends EventEmitter {
	constructor(private readonly replay: Replay, private readonly parseFunctions: readonly ParserFunction[]) {
		super();
	}

	public parse() {
		const opponentPlayerElement = this.replay.replay
			.findall('.//Player')
			.find((player) => player.get('isMainPlayer') === 'false')!;
		const opponentPlayerEntityId = opponentPlayerElement.get('id')!;
		const structure: ParsingStructure = {
			currentTurn: 0,
			entities: {},
		};

		parseElement(
			this.replay.replay.getroot(),
			this.replay.mainPlayerId,
			opponentPlayerEntityId,
			null,
			structure,
			[
				...(this.parseFunctions ?? [])
					.map((fn) => fn.parser)
					.filter((fn) => !!fn)
					.map((fn) =>
						fn!(this.replay, structure, (eventName: string, event: any) => {
							this.emit(eventName, event);
						}),
					),
				entities.parser(structure),
			],
			[
				entities.endOfTurn(this.replay, structure, (eventName: string, event: any) => {
					this.emit(eventName, event);
				}),
				...(this.parseFunctions ?? [])
					.map((fn) => fn.endOfTurn)
					.filter((fn) => !!fn)
					.map((fn) =>
						fn!(this.replay, structure, (eventName: string, event: any) => {
							this.emit(eventName, event);
						}),
					),
			],
		);
	}
}

const parseElement = (
	element: Element,
	mainPlayerId: number,
	opponentPlayerEntityId: string,
	parent: Element | null,
	turnCountWrapper,
	parseFunctions,
	endOfTurnFunctions,
) => {
	parseFunctions.forEach((parseFunction) => parseFunction(element));
	if (element.tag === 'TagChange') {
		if (
			parseInt(element.get('entity')!) === 1 &&
			parseInt(element.get('tag')!) === GameTag.STEP &&
			(parseInt(element.get('value')!) === Step.BEGIN_MULLIGAN ||
				parseInt(element.get('value')!) === Step.MAIN_START)
		) {
			// console.debug('new turn', turnCountWrapper.currentTurn, element.get('tag'), element.get('value'));
			endOfTurnFunctions.forEach((populateFunction) => populateFunction(turnCountWrapper.currentTurn, element));
			turnCountWrapper.currentTurn =
				parseInt(element.get('value')!) === Step.BEGIN_MULLIGAN ? 0 : turnCountWrapper.currentTurn + 1;
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
				endOfTurnFunctions,
			);
		}
	}
};
