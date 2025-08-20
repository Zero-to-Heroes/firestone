export const createSlug = (text: string): string => {
	if (!text) return '';
	
	return text
		.toLowerCase()
		.trim()
		// Replace spaces and special characters with hyphens
		.replace(/[\s\W-]+/g, '-')
		// Remove leading/trailing hyphens
		.replace(/^-+|-+$/g, '')
		// Replace multiple consecutive hyphens with single hyphen
		.replace(/-+/g, '-');
};

export const slugToText = (slug: string): string => {
	if (!slug) return '';
	
	return slug
		.split('-')
		.map(word => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');
};

export const matchSlugToName = (slug: string, names: string[]): string | null => {
	if (!slug || !names?.length) return null;
	
	// Try exact match first
	const exactMatch = names.find(name => createSlug(name) === slug);
	if (exactMatch) return exactMatch;
	
	// Try partial match
	const partialMatch = names.find(name => 
		createSlug(name).includes(slug) || slug.includes(createSlug(name))
	);
	
	return partialMatch || null;
};