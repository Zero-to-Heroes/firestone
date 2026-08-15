import { BlockType } from '@firestone-hs/reference-data';
import { MetaDataType } from './enums';
import { Action, MetaData, Node, NodeType } from './models';

/** PLAY paid with health or armor instead of (or in addition to) mana. */
export const actionPaidWithAlternateCost = (action: Action): boolean =>
	action.Data.some(
		(d) =>
			d instanceof MetaData &&
			(d.Meta === (MetaDataType.SPEND_HEALTH as number) || d.Meta === (MetaDataType.SPEND_ARMOR as number)),
	);

export const findPlayAction = (node: Node | null | undefined): Action | null => {
	let current: Node | null | undefined = node;
	while (current) {
		if (current.Type === NodeType.Action && (current.Object as Action).Type === (BlockType.PLAY as number)) {
			return current.Object as Action;
		}
		current = current.Parent;
	}
	return null;
};

export const nodePlayPaidWithAlternateCost = (node: Node | null | undefined): boolean => {
	const play = findPlayAction(node);
	return play != null && actionPaidWithAlternateCost(play);
};
