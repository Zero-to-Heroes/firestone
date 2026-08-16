/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Section, SectionReference, Setting, SettingButton, SettingNode } from '@firestone/settings/services';

export interface SettingsFilter {
	readonly searchString?: string | null;
	readonly newOnly?: boolean;
	readonly spotlightPrefFields?: ReadonlySet<string>;
	readonly spotlightNodeIds?: ReadonlySet<string>;
}

export const filterSettings = (root: SettingNode, filter: SettingsFilter | string | null): SettingNode => {
	const normalized: SettingsFilter = typeof filter === 'string' ? { searchString: filter } : (filter ?? {});

	let result = root;
	if (normalized.searchString?.length) {
		result = filterBySearch(result, normalized.searchString);
	}
	if (normalized.newOnly) {
		result = filterByNew(
			result,
			normalized.spotlightPrefFields ?? new Set(),
			normalized.spotlightNodeIds ?? new Set(),
		) ?? { ...root, children: [], sections: [] };
	}
	return result;
};

const filterBySearch = (root: SettingNode, searchString: string): SettingNode => {
	return {
		...root,
		children: root.children!.map((child) => filterNode(child, searchString)).filter((c) => !!c) as SettingNode[],
	};
};

const filterNode = (node: SettingNode, searchString: string): SettingNode | null => {
	const titleMatches = node.name?.toLocaleLowerCase().includes(searchString.toLocaleLowerCase());
	const result: SettingNode = titleMatches
		? node
		: {
				...node,
				sections: node.sections
					?.map((section) => filterSection(section, searchString))
					.filter((s) => !!s?.settings?.length)
					.filter((s) => !!s) as (Section | SectionReference)[],
				children: (node.children?.map((child) => filterNode(child, searchString)).filter((c) => !!c) ??
					[]) as SettingNode[],
			};

	if (!result?.sections?.length && !result.children?.length && !titleMatches) {
		return null;
	}

	return result;
};

const filterSection = (section: Section | SectionReference, searchString: string): Section | null => {
	if (isSectionReference(section)) {
		return null;
	}

	const sectionMatches =
		section.title?.toLocaleLowerCase().includes(searchString.toLocaleLowerCase()) ||
		section.keywords?.some((keyword) => keyword.toLocaleLowerCase().includes(searchString.toLocaleLowerCase()));
	const filteredSettings = section.settings?.filter((setting) => settingMatches(setting, searchString)) ?? [];
	const result: Section = {
		...section,
		settings: sectionMatches ? section.settings : filteredSettings,
	};
	return result;
};

const settingMatches = (setting: Setting | SettingButton, searchString: string): boolean => {
	return (
		setting.label?.toLocaleLowerCase().includes(searchString.toLocaleLowerCase()) ||
		setting.keywords
			?.filter((k) => !!k)
			?.some((keyword) => keyword.toLocaleLowerCase().includes(searchString.toLocaleLowerCase())) ||
		false
	);
};

const filterByNew = (
	node: SettingNode,
	prefFields: ReadonlySet<string>,
	nodeIds: ReadonlySet<string>,
): SettingNode | null => {
	const children = (node.children?.map((child) => filterByNew(child, prefFields, nodeIds)).filter((c) => !!c) ??
		[]) as SettingNode[];
	const nodeIsSpotlighted = nodeIds.has(node.id);

	let sections = node.sections;
	if (!nodeIsSpotlighted && node.sections) {
		sections = node.sections
			.map((section) => filterSectionByNew(section, prefFields))
			.filter((section) => !!section?.settings?.length) as (Section | SectionReference)[];
	}

	if (!sections?.length && !children.length && !nodeIsSpotlighted) {
		return null;
	}

	return {
		...node,
		sections: sections ?? node.sections,
		children,
	};
};

const filterSectionByNew = (section: Section | SectionReference, prefFields: ReadonlySet<string>): Section | null => {
	if (isSectionReference(section)) {
		return null;
	}
	const settings = section.settings?.filter((setting) => settingHasSpotlight(setting, prefFields)) ?? [];
	return {
		...section,
		settings,
	};
};

const settingHasSpotlight = (setting: Setting | SettingButton, prefFields: ReadonlySet<string>): boolean => {
	return isStandardSetting(setting) && prefFields.has(setting.field);
};

const isStandardSetting = (setting: Setting | SettingButton): setting is Setting => {
	return (setting as Setting).field !== undefined;
};

export const isSectionReference = (section: Section | SectionReference): section is SectionReference => {
	return (section as SectionReference).componentType !== undefined;
};

export const nodeHasSpotlight = (
	node: SettingNode,
	prefFields: ReadonlySet<string>,
	nodeIds: ReadonlySet<string>,
): boolean => {
	if (nodeIds.has(node.id)) {
		return true;
	}
	if (
		node.sections?.some(
			(section) =>
				!isSectionReference(section) &&
				section.settings?.some((setting) => settingHasSpotlight(setting, prefFields)),
		)
	) {
		return true;
	}
	return node.children?.some((child) => nodeHasSpotlight(child, prefFields, nodeIds)) ?? false;
};

export const collectPrefFieldsFromNode = (node: SettingNode): readonly string[] => {
	const fields: string[] = [];
	for (const section of node.sections ?? []) {
		if (isSectionReference(section)) {
			continue;
		}
		for (const setting of section.settings ?? []) {
			if (isStandardSetting(setting)) {
				fields.push(setting.field);
			}
		}
	}
	return fields;
};

export const findFirstSelectableNode = (node: SettingNode | null): SettingNode | null => {
	if (!node) {
		return null;
	}
	if (node.sections?.length) {
		return node;
	}
	for (const child of node.children ?? []) {
		const found = findFirstSelectableNode(child);
		if (found) {
			return found;
		}
	}
	return null;
};
