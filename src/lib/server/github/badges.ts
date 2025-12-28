export interface BadgeInfo {
	displayName: string;
	authorDiscordId: string;
}

export async function fetchCreatorDiscordId(creatorUrl: string) {
	const creatorId = creatorUrl.split('/').pop();
	const creator = await fetch(`https://sendou.ink/api/user/${creatorId}/ids`);

	const creatorJson = await creator.json();
	return creatorJson.discordId;
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
