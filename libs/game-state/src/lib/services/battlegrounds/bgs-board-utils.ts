import { Entity } from '@firestone-hs/hs-replay-xml-parser/dist/public-api';
import { GameTag } from '@firestone-hs/reference-data';

export const buildEntities = (logEntities: readonly any[]): readonly Entity[] => {
	return logEntities.map((entity) => buildEntity(entity));
};

export const buildEntity = (logEntity): Entity => {
	return {
		cardID: logEntity.CardId as string,
		id: logEntity.Entity as number,
		tags: buildTags(logEntity.Tags),
	} as Entity;
};

export const buildTags = (tags: { Name: number; Value: number }[]): { [tagName: string]: number } => {
	return tags.reduce(
		(acc, tag) => {
			acc[GameTag[tag.Name]] = tag.Value;
			return acc;
		},
		{} as { [tagName: string]: number },
	);
};
