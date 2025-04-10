export interface BadgeInfo {
	displayName: string;
	fileName: string;
	authorDiscordId: string;
}

export async function parseBadgeList(badgesText: string): Promise<BadgeInfo[]> {
	const arrayMatch = badgesText.match(
		/export const homemadeBadges: BadgeInfo\[\] = \[([\s\S]*?)\];/
	) || ['', ''];
	const arrayText = `[${arrayMatch[1]}]`;
	const jsonCompatible = arrayText
		.replace(/^\s*\/\/.*$/gm, '')
		.replace(/,(\s*[\]}])/g, '$1')
		.replace(/(\{|,)\s*(\w+)\s*:/g, '$1 "$2":');

	return JSON.parse(jsonCompatible);
}

export function createBadgeEntry(badge: BadgeInfo): string {
	return `\t{\n\t\tdisplayName: "${badge.displayName}",\n\t\tfileName: "${badge.fileName}",\n\t\tauthorDiscordId: "${badge.authorDiscordId}",\n\t},\n`;
}

export function addBadgeToFile(badgesText: string, badgeEntry: string): string {
	const lastBracketIndex = badgesText.lastIndexOf('];');
	return badgesText.slice(0, lastBracketIndex) + badgeEntry + badgesText.slice(lastBracketIndex);
}

export function replaceBadgeInFile(
	badgesText: string,
	oldShortName: string,
	badgeEntry: string
): string {
	const regex = new RegExp(`\\s*\\{[^{]*?fileName:\\s*["']${oldShortName}["'][^}]*?\\},?\\n?`);
	const matchResult = badgesText.match(regex);

	if (!matchResult || matchResult.length === 0) {
		throw new Error('Could not locate the badge entry to update');
	}

	return badgesText.replace(matchResult[0], '\n' + badgeEntry);
}

export async function fetchCreatorDiscordId(creatorUrl: string): Promise<string> {
	const creator = await fetch(
		`${creatorUrl}?_data=features%2Fuser-page%2Froutes%2Fu.%24identifier`
	);
	const creatorJson = await creator.json();
	return creatorJson.user.discordId;
}

export function checkBadgeNameExists(badgeList: BadgeInfo[], shortName: string): boolean {
	return badgeList.some((badge) => badge.fileName === shortName);
}
