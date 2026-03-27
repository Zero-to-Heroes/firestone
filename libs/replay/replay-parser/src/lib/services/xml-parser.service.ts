import { GameTag, MetaTags, Mulligan, Step, Zone } from '@firestone-hs/reference-data';
import { SaxesParser, SaxesTagPlain } from 'saxes';
import { ActionHistoryItem } from '../models/history/action-history-item';
import { ChangeEntityHistoryItem } from '../models/history/change-entity-history-item';
import { ChoicesHistoryItem } from '../models/history/choices-history-item';
import { ChosenEntityHistoryItem } from '../models/history/chosen-entities-history-item';
import { FullEntityHistoryItem } from '../models/history/full-entity-history-item';
import { GameHistoryItem } from '../models/history/game-history-item';
import { HideEntityHistoryItem } from '../models/history/hide-entity-history-item';
import { HistoryItem } from '../models/history/history-item';
import { MetadataHistoryItem } from '../models/history/metadata-history-item';
import { OptionsHistoryItem } from '../models/history/options-history-item';
import { PlayerHistoryItem } from '../models/history/player-history-item';
import { ShowEntityHistoryItem } from '../models/history/show-entity-history-item';
import { TagChangeHistoryItem } from '../models/history/tag-change-history-item';
import { Choices } from '../models/parser/choices';
import { ChosenTag } from '../models/parser/chosen-tag';
import { EnrichedTag } from '../models/parser/enriched-tag';
import { EntityDefinition } from '../models/parser/entity-definition';
import { EntityDefinitionAttribute } from '../models/parser/entity-definition-attribute';
import { EntityTag } from '../models/parser/entity-tag';
import { Info } from '../models/parser/info';
import { MetaData } from '../models/parser/metadata';
import { Option } from '../models/parser/option';

// Don't inject it, because of the global state
export class XmlParserService {
	private stack: EnrichedTag[];
	private state: string[];
	private index: number;
	private initialTimestamp: number;
	private history: HistoryItem[];
	private entityDefinition: EntityDefinition;
	private accountHi: string;
	private accountLo: string;
	private isMainPlayer: string;
	private choices: Choices;
	private chosen: ChosenTag;
	private metaData: MetaData;
	private timestamp: number;

	private buildNumber: number;
	private gameType: number;
	private formatType: number;
	private scenarioID: number;

	constructor() {}

	public *parseXml(xmlAsString: string): IterableIterator<readonly HistoryItem[]> {
		this.reset();
		if (!xmlAsString) {
			console.error('[game-parser] [xml-parser] no xmlAsString provided');
			return null;
		}

		// console.debug('[game-parser] [xml-parser] parsing', xmlAsString);
		const saxesParser = new SaxesParser({
			// fragment: true,
		});
		saxesParser.on('opentag', (tag) => this.onOpenTag(tag));
		saxesParser.on('closetag', (tag) => this.onCloseTag());
		// saxesParser.on('end', () => console.debug('parsing over'));
		// saxesParser.on('error', error => console.error('Error while parsing xml', error));

		// We want to have:
		// - a chunk with pre-mulligan stuff, to setup the board
		// - one chunk with both mulligans
		// - one chunk for each turn
		const mulliganSplits = xmlAsString.split(
			new RegExp(`(?=<TagChange[^>]*tag="${GameTag.MULLIGAN_STATE}"[^>]*value="${Mulligan.INPUT}"[^/]*/>)`),
		);
		// We isolate the pre-mulligan stuff
		const [setupChunk, ...gameChunks] = mulliganSplits;
		// console.debug('[game-parser] [xml-parser] setupChunk', setupChunk, gameChunks.length);
		// Then the other chunks are handled only on a turn-by-turn basis
		// This logic is here to handle the case where there is no mulligan info. It should usually not happen,
		// but I've seen it at least once
		const gameXml = gameChunks && gameChunks.length > 0 ? gameChunks.join('') : setupChunk;
		// console.log('[game-parser] [xml-parser] gameXml', gameXml);
		// https://stackoverflow.com/questions/12001953/javascript-and-regex-split-string-and-keep-the-separator
		const chunks = gameXml.split(
			new RegExp(`(?=<TagChange[^>]*tag="${GameTag.STEP}"[^>]*value="${Step.MAIN_READY}"[^/]*/>)`),
		);
		// console.log('[game-parser] [xml-parser] chunks', chunks.length);
		const splitChunks = gameChunks && gameChunks.length > 0 ? [setupChunk, ...chunks] : [...chunks];
		for (const chunk of splitChunks) {
			// console.log('[game-parser] [xml-parser] writing chunk', chunk.length);
			saxesParser.write(chunk);
			yield this.history;
			this.history = [];
		}
		// console.log('[game-parser] [xml-parser] parsing over');
		saxesParser.close();
		return null;
	}

	onOpenTag(tag: SaxesTagPlain) {
		this.stack.push(tag as SaxesTagPlain);
		if (this[`${this.state[this.state.length - 1]}State`]) {
			this[`${this.state[this.state.length - 1]}State`](tag);
		}
	}

	onCloseTag() {
		const tag = this.stack.pop();
		if (this[`${this.state[this.state.length - 1]}StateClose`]) {
			this[`${this.state[this.state.length - 1]}StateClose`](tag);
		}
	}

	rootState(node: EnrichedTag) {
		node.index = this.index++;
		let name;
		let ts;
		switch (node.name) {
			case 'Game':
				this.initialTimestamp = this.tsToSeconds(node.attributes.ts);
				this.timestamp = 0;
				this.buildNumber = parseInt(node.attributes.buildNumber);
				this.gameType = parseInt(node.attributes.gameType);
				this.formatType = parseInt(node.attributes.formatType);
				this.scenarioID = parseInt(node.attributes.scenarioID);
				break;
			case 'Action':
			case 'Block':
				ts = this.tsToSeconds(node.attributes.ts);
				const item: ActionHistoryItem = new ActionHistoryItem(node, this.buildTimestamp(ts), node.index);
				this.enqueueHistoryItem(item);
				this.state.push('action');
				break;
		case 'ShowEntity':
				let showEntities: EntityDefinition[] = this.stack[this.stack.length - 2].showEntities || [];
				showEntities.push(this.entityDefinition);
				this.stack[this.stack.length - 2].showEntities = showEntities;
			/* falls through */
			case 'Player':
				// Remove the battle tag, if present
				name =
					node.attributes.name && node.attributes.name.indexOf('#') !== -1
						? node.attributes.name.split('#')[0]
						: node.attributes.name;
				this.accountHi = node.attributes.accountHi;
				this.accountLo = node.attributes.accountLo;
				this.isMainPlayer = node.attributes.isMainPlayer;
			/* falls through */
			case 'GameEntity':
			case 'FullEntity':
			case 'ChangeEntity':
				name = name || node.attributes.name;
				this.state.push('entity');
				const attributes = Object.assign({}, this.entityDefinition.attributes, {
					ts: this.tsToSeconds(node.attributes.ts),
				});
				const newAttributes: EntityDefinition = {
					id: parseInt(node.attributes.entity || node.attributes.id),
					attributes,
					index: this.index++,
					cardID: node.attributes.cardID,
					name,
					tags: this.entityDefinition.tags, // Avoid the hassle of merging tags, just get the ones from source
					playerID: parseInt(node.attributes.playerID),
				};
				Object.assign(this.entityDefinition, newAttributes);
				break;
			case 'TagChange':
				const tag: EntityTag = {
					index: this.index++,
					entity: parseInt(node.attributes.entity),
					tag: parseInt(node.attributes.tag) as GameTag,
					value: parseInt(node.attributes.value),
					parentIndex: this.stack[this.stack.length - 2].index,
				};
				let parentTags: EntityTag[] = this.stack[this.stack.length - 2].tags || [];
				parentTags.push(tag);
				this.stack[this.stack.length - 2].tags = parentTags;
				const tagItem: TagChangeHistoryItem = new TagChangeHistoryItem(
					tag,
					this.buildTimestamp(ts),
					node.index,
				);
				this.enqueueHistoryItem(tagItem);
				break;
			case 'Options':
				this.state.push('options');
				break;
			case 'ChosenEntities':
				this.chosen = {
					entity: parseInt(node.attributes.entity),
					playerID: parseInt(node.attributes.playerID),
					ts: this.tsToSeconds(node.attributes.ts),
					cards: [],
					index: this.index++,
				};
				this.state.push('chosenEntities');
				break;
		}
	}

	actionState(node: EnrichedTag) {
		node.index = this.index++;
		const ts = node.attributes.ts ? this.tsToSeconds(node.attributes.ts) : null;
		switch (node.name) {
			case 'ShowEntity':
			case 'FullEntity':
			case 'ChangeEntity':
				this.state.push('entity');
				const attributes: EntityDefinitionAttribute = Object.assign({}, this.entityDefinition.attributes, {
					ts: this.tsToSeconds(node.attributes.ts),
					triggerKeyword: parseInt(node.attributes.triggerKeyword) || 0,
				});
				const newAttributes: EntityDefinition = {
					id: parseInt(node.attributes.entity || node.attributes.id),
					index: this.index++,
					attributes,
					cardID: node.attributes.cardID,
					name: node.attributes.name,
					tags: this.entityDefinition.tags, // Avoid the hassle of merging tags, just get the ones from source
					playerID: parseInt(node.attributes.playerID),
					parentIndex: this.stack[this.stack.length - 2].index,
				};
				Object.assign(this.entityDefinition, newAttributes);

				if (node.name === 'ShowEntity') {
					let showEntities: EntityDefinition[] = this.stack[this.stack.length - 2].showEntities || [];
					showEntities.push(this.entityDefinition);
					this.stack[this.stack.length - 2].showEntities = showEntities;
				} else if (node.name === 'FullEntity') {
					let fullEntities: EntityDefinition[] = this.stack[this.stack.length - 2].fullEntities || [];
					fullEntities.push(this.entityDefinition);
					this.stack[this.stack.length - 2].fullEntities = fullEntities;
				}
				break;
			case 'HideEntity':
				const hideEntityHistoryItem = Object.assign(
					new HideEntityHistoryItem(this.index++, this.buildTimestamp(ts)),
					{
						entity: parseInt(node.attributes.entity),
						zone: parseInt(node.attributes.zone) as Zone,
					} as HideEntityHistoryItem,
				);
				this.enqueueHistoryItem(hideEntityHistoryItem);
				break;
			case 'TagChange':
				const tag: EntityTag = {
					index: this.index++,
					entity: parseInt(node.attributes.entity),
					tag: parseInt(node.attributes.tag) as GameTag,
					value: parseInt(node.attributes.value),
					parentIndex: this.stack[this.stack.length - 2].index,
				};
				let parentTags: EntityTag[] = this.stack[this.stack.length - 2].tags || [];
				parentTags.push(tag);
				this.stack[this.stack.length - 2].tags = parentTags;
				const tagItem: TagChangeHistoryItem = new TagChangeHistoryItem(
					tag,
					this.buildTimestamp(ts),
					node.index,
				);
				this.enqueueHistoryItem(tagItem);
				break;
			case 'MetaData':
				this.metaData = {
					meta: MetaTags[parseInt(node.attributes.meta || node.attributes.entity)],
					data: parseInt(node.attributes.data),
					parentIndex: this.stack[this.stack.length - 2].index,
					ts,
					info: [],
					index: this.index++,
				};
				const metaItem: MetadataHistoryItem = new MetadataHistoryItem(
					this.metaData,
					this.buildTimestamp(ts),
					node.index,
				);
				this.enqueueHistoryItem(metaItem);
				let parentMeta: MetaData[] = this.stack[this.stack.length - 2].meta || [];
				parentMeta.push(this.metaData);
				this.stack[this.stack.length - 2].meta = parentMeta;
				this.state.push('metaData');
				break;
			case 'Action':
			case 'Block':
				node.parentIndex = this.stack[this.stack.length - 2].index;
				this.state.push('action');
				const item: ActionHistoryItem = new ActionHistoryItem(node, this.buildTimestamp(ts), node.index);
				this.enqueueHistoryItem(item);
				break;
			case 'Choices':
				this.choices = {
					entity: parseInt(node.attributes.entity),
					max: parseInt(node.attributes.max),
					min: parseInt(node.attributes.min),
					playerID: parseInt(node.attributes.playerID),
					source: parseInt(node.attributes.source),
					type: parseInt(node.attributes.type),
					ts: this.tsToSeconds(node.attributes.ts),
					index: this.index++,
					cards: [],
				};
				this.state.push('choices');
				break;
			case 'ChosenEntities':
				this.chosen = {
					entity: parseInt(node.attributes.entity),
					playerID: parseInt(node.attributes.playerID),
					ts: this.tsToSeconds(node.attributes.ts),
					cards: [],
					index: this.index++,
				};
				this.state.push('chosenEntities');
				break;
		}
	}

	actionStateClose(node: EnrichedTag) {
		switch (node.name) {
			case 'Action':
			case 'Block':
				this.state.pop();
		}
	}

	blockState(node: EnrichedTag) {
		node.index = this.index++;
		this.actionState(node);
	}

	blockStateClose(node: EnrichedTag) {
		this.actionStateClose(node);
	}

	metaDataState(node: EnrichedTag) {
		node.index = this.index++;
		switch (node.name) {
			case 'Info':
				const info: Info = {
					entity: parseInt(node.attributes.id || node.attributes.entity),
					parent: this.metaData,
				};
				let infos: Info[] = this.metaData.info;
				infos.push(info);
				Object.assign(this.metaData, { info: infos });
				break;
		}
	}

	metaDataStateClose(node: EnrichedTag) {
		switch (node.name) {
			case 'MetaData':
				this.state.pop();
		}
	}

	chosenEntitiesState(node: EnrichedTag) {
		node.index = this.index++;
		switch (node.name) {
			case 'Choice':
				let cards: number[] = this.chosen.cards;
				cards.push(parseInt(node.attributes.entity));
				Object.assign(this.chosen, { cards });
		}
	}

	chosenEntitiesStateClose(node: EnrichedTag) {
		switch (node.name) {
			case 'ChosenEntities':
				this.state.pop();
				const item: ChosenEntityHistoryItem = new ChosenEntityHistoryItem(
					this.chosen,
					this.buildTimestamp(this.chosen.ts),
					node.index,
				);
				this.enqueueHistoryItem(item);
		}
	}

	optionsState(node: EnrichedTag) {
		node.index = this.index++;
		switch (node.name) {
			case 'Option':
				const option: Option = {
					entity: parseInt(node.attributes.entity),
					optionIndex: parseInt(node.attributes.index),
					error: parseInt(node.attributes.error),
					type: parseInt(node.attributes.type),
					parentIndex: this.stack[this.stack.length - 2].index,
					index: this.index++,
				};
				let options: Option[] = this.stack[this.stack.length - 2].options || [];
				options.push(option);
				this.stack[this.stack.length - 2].options = options;
		}
	}

	optionsStateClose(node: EnrichedTag) {
		switch (node.name) {
			case 'Options':
				this.state.pop();
				const ts = this.tsToSeconds(node.attributes.ts);
				const item: OptionsHistoryItem = new OptionsHistoryItem(node, this.buildTimestamp(ts), node.index);
				this.enqueueHistoryItem(item);
		}
	}

	entityState(node: EnrichedTag) {
		node.index = this.index++;
		switch (node.name) {
			case 'Tag':
				const newTags: { [tagName: string]: number } = {
					...this.entityDefinition.tags,
					[GameTag[parseInt(node.attributes.tag)]]: parseInt(node.attributes.value),
				};
				Object.assign(this.entityDefinition, { tags: newTags });
		}
	}

	entityStateClose(node: EnrichedTag) {
		const ts = node.attributes.ts ? this.tsToSeconds(node.attributes.ts) : null;
		switch (node.name) {
			case 'GameEntity':
				this.state.pop();
				const gameItem: GameHistoryItem = Object.assign(
					new GameHistoryItem(this.entityDefinition, this.buildTimestamp(ts), node.index),
					{
						buildNumber: this.buildNumber,
						formatType: this.formatType,
						gameType: this.gameType,
						scenarioID: this.scenarioID,
					} as GameHistoryItem,
				);

				this.enqueueHistoryItem(gameItem);
				this.entityDefinition = { tags: {} };
				break;
			case 'Player':
				this.state.pop();
				const playerItem: PlayerHistoryItem = new PlayerHistoryItem(
					this.entityDefinition,
					this.accountHi,
					this.accountLo,
					this.isMainPlayer,
					this.buildTimestamp(ts),
					node.index,
				);
				this.enqueueHistoryItem(playerItem);
				this.entityDefinition = { tags: {} };
				break;
			case 'FullEntity':
				this.state.pop();
				const fullEntityItem: FullEntityHistoryItem = new FullEntityHistoryItem(
					this.entityDefinition,
					this.buildTimestamp(ts),
					node.index,
				);
				this.enqueueHistoryItem(fullEntityItem);
				this.entityDefinition = { tags: {} };
				break;
			case 'ShowEntity':
				this.state.pop();
				const showEntityItem: ShowEntityHistoryItem = new ShowEntityHistoryItem(
					this.entityDefinition,
					this.buildTimestamp(ts),
					node.index,
				);
				this.enqueueHistoryItem(showEntityItem);
				this.entityDefinition = { tags: {} };
				break;
			case 'ChangeEntity':
				this.state.pop();
				const changeEntityItem: ChangeEntityHistoryItem = new ChangeEntityHistoryItem(
					this.entityDefinition,
					this.buildTimestamp(ts),
					node.index,
				);
				this.enqueueHistoryItem(changeEntityItem);
				this.entityDefinition = { tags: {} };
				break;
		}
	}

	choicesState(node: EnrichedTag) {
		node.index = this.index++;
		switch (node.name) {
			case 'Choice':
				let cards = this.choices.cards || [];
				cards.push(parseInt(node.attributes.entity));
				Object.assign(this.choices, { cards });
		}
	}

	choicesStateClose(node: EnrichedTag) {
		switch (node.name) {
			case 'Choices':
				this.state.pop();
				const choicesItem: ChoicesHistoryItem = new ChoicesHistoryItem(
					this.choices,
					this.buildTimestamp(this.choices.ts),
					node.index,
				);
				this.enqueueHistoryItem(choicesItem);
		}
	}

	private buildTimestamp(ts?: number): number {
		ts = ts || this.timestamp;
		this.timestamp = ts;
		return this.timestamp;
	}

	private enqueueHistoryItem(item: HistoryItem) {
		if (item.timestamp === undefined) {
			console.error("History item doesn't have timestamp", item);
			throw new Error("History item doesn't have timestamp" + item);
		}
		this.history.push(item);
	}

	private reset() {
		this.stack = [];
		this.state = ['root'];
		this.index = 0;
		this.initialTimestamp = undefined;
		this.history = [];
		this.entityDefinition = {
			tags: {},
		};
		this.choices = undefined;
		this.chosen = undefined;
		this.metaData = undefined;
		this.timestamp = undefined;
	}

	private tsToSeconds(ts: string): number {
		if (!ts) {
			return undefined;
		}
		// Format of timestamp is HH:mm:ss.SSSSSSSSS
		const tsWithoutMillis = ts.split('.')[0];
		const split = tsWithoutMillis.split(':');
		const tsInSeconds: number = parseInt(split[2]) + 60 * parseInt(split[1]) + 3600 * parseInt(split[0]);
		return tsInSeconds - (this.initialTimestamp || 0);
	}
}
