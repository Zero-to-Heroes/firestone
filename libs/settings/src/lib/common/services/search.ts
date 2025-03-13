/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Section, SectionReference, Setting, SettingButton, SettingNode } from '../models/settings.types';

export const filterSettings = (root: SettingNode, searchString: string | null): SettingNode => {
	if (!searchString?.length) {
		return root;
	}

	const result: SettingNode = {
		...root,
		children: root.children!.map((child) => filterNode(child, searchString)).filter((c) => !!c) as SettingNode[],
	};
	return result;
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
	const filteredSettings = section.settings!.filter((setting) => settingMatches(setting, searchString));
	const result: Section = {
		...section,
		settings: sectionMatches ? section.settings : filteredSettings,
	};
	return result;
};

const settingMatches = (setting: Setting | SettingButton, searchString: string): boolean => {
	return (
		setting.label?.toLocaleLowerCase().includes(searchString.toLocaleLowerCase()) ||
		setting.keywords?.some((keyword) => keyword.toLocaleLowerCase().includes(searchString.toLocaleLowerCase())) ||
		false
	);
};

const isSectionReference = (section: Section | SectionReference): section is SectionReference => {
	return (section as SectionReference).componentType !== undefined;
};
