export interface BadgeInfo {
	displayName: string;
	authorDiscordId: string;
}

export async function fetchCreatorDiscordId(creatorUrl: string) {
	const creator = await fetch(
		`${creatorUrl}?_data=features%2Fuser-page%2Froutes%2Fu.%24identifier`
	);
	const creatorJson = await creator.json();
	return creatorJson.user.discordId;
}

export function checkBadgeNameExists(badgesJson: { string: BadgeInfo }, shortName: string) {
	return Object.keys(badgesJson).some((key) => {
		return key === shortName;
	});
}

export function insertNewBadge(
	badgesJson: Record<string, BadgeInfo>,
	shorthandName: string,
	newBadge: BadgeInfo
) {
	const newJson = { ...badgesJson, [shorthandName]: newBadge };

	return Object.keys(newJson)
		.sort((a, b) => a.localeCompare(b.toLowerCase()))
		.reduce(
			(acc, key) => {
				acc[key] = newJson[key];
				return acc;
			},
			{} as Record<string, BadgeInfo>
		);
}
