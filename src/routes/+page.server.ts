import * as v from 'valibot';
import { FormSchema } from './schema';
import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) {
		return {
			loggedIn: true,
			name: locals.user.name,
			url: locals.user.url
		};
	}

	return {
		loggedIn: false
	};
};

export const actions = {
	createPR: async ({ request, locals }) => {
		const formData = await request.formData();
		const result = v.safeParse(FormSchema, Object.fromEntries(formData.entries()));

		if (!result.success) {
			return fail(400, {
				success: false,
				message: 'Validation failed, did you fill out all required fields correctly?'
			});
		}

		if (!locals.user) {
			return fail(401, {
				success: false,
				message: 'You must be logged into GitHub to open a Pull Request!'
			});
		}

		const BASE_URL = 'https://api.github.com';
		const BASE_BRANCH = 'main';
		const REPO_OWNER = 'hfcRed';
		const REPO_NAME = 'PR-Testing';
		const FILE_PATH = 'homemade.ts';
		const USERNAME = locals.user.name;
		const SHORT_NAME = result.output.shorthandName;
		const DISPLAY_NAME = result.output.displayName;
		const CREATOR = result.output.creator;

		if (
			result.output.gif.name !== `${SHORT_NAME}.gif` ||
			result.output.png.name !== `${SHORT_NAME}.png` ||
			result.output.avif.name !== `${SHORT_NAME}.avif`
		) {
			return fail(400, {
				success: false,
				message: 'File names must match the badge shorthand name!'
			});
		}

		const headers = {
			Authorization: `Bearer ${locals.user.token}`,
			Accept: 'application/vnd.github.v3+json',
			'Content-Type': 'application/json'
		};

		const prCheck = await fetch(
			`${BASE_URL}/repos/${REPO_OWNER}/${REPO_NAME}/pulls?head=${USERNAME}:${SHORT_NAME}`,
			{
				method: 'GET',
				headers
			}
		);
		const prCheckJson = await prCheck.json();

		if (prCheckJson.length > 0) {
			return fail(400, {
				success: false,
				message: 'Pull request already exists! Use the "Update PR" option instead.'
			});
		}

		const badges = await fetch(
			`${BASE_URL}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}?ref=${BASE_BRANCH}`,
			{
				method: 'GET',
				headers
			}
		);
		const badgesJson = await badges.json();
		const badgesText = atob(badgesJson.content);
		const arrayMatch =
			badgesText.match(/export const homemadeBadges: BadgeInfo\[\] = \[([\s\S]*?)\];/) || '';
		const arrayText = `[${arrayMatch[1]}]`;
		const jsonCompatible = arrayText
			.replace(/^\s*\/\/.*$/gm, '')
			.replace(/,(\s*[\]}])/g, '$1')
			.replace(/(\{|,)\s*(\w+)\s*:/g, '$1 "$2":');

		const badgeList = JSON.parse(jsonCompatible);

		const exists = badgeList.some((badge: { fileName: string }) => badge.fileName === SHORT_NAME);

		if (exists) {
			return fail(400, {
				success: false,
				message: 'Badge shorthand name already exists!'
			});
		}

		const creator = await fetch(`${CREATOR}?_data=features%2Fuser-page%2Froutes%2Fu.%24identifier`);
		const creatorJson = await creator.json();

		const lastBracketIndex = badgesText.lastIndexOf('];');
		const newBadge = {
			displayName: DISPLAY_NAME,
			fileName: SHORT_NAME,
			authorDiscordId: creatorJson.user.discordId
		};
		const newBadgeEntry = `        {
        	displayName: "${newBadge.displayName}",
        	fileName: "${newBadge.fileName}",
        	authorDiscordId: "${newBadge.authorDiscordId}",
    	},\n`;
		const updatedBadgesText =
			badgesText.slice(0, lastBracketIndex) + newBadgeEntry + badgesText.slice(lastBracketIndex);

		const repos = await fetch(`${BASE_URL}/users/${USERNAME}/repos`, {
			method: 'GET',
			headers
		});
		const reposJson = await repos.json();

		const hasRepo = reposJson.some((repo: { name: string }) => repo.name === REPO_NAME);

		if (!hasRepo) {
			await fetch(`${BASE_URL}/repos/${REPO_OWNER}/${REPO_NAME}/forks`, {
				method: 'POST',
				headers
			});

			await new Promise((resolve) => setTimeout(resolve, 5000));
		}

		const branchRef = await fetch(
			`${BASE_URL}/repos/${REPO_OWNER}/${REPO_NAME}/git/refs/heads/${BASE_BRANCH}`,
			{
				method: 'GET',
				headers
			}
		);
		const branchRefJson = await branchRef.json();

		await fetch(`${BASE_URL}/repos/${USERNAME}/${REPO_NAME}/git/refs`, {
			method: 'POST',
			headers,
			body: JSON.stringify({
				ref: `refs/heads/${SHORT_NAME}`,
				sha: branchRefJson.object.sha
			})
		});

		const forkBadges = await fetch(
			`${BASE_URL}/repos/${USERNAME}/${REPO_NAME}/contents/${FILE_PATH}?ref=${SHORT_NAME}`,
			{
				method: 'GET',
				headers
			}
		);
		const forkBadgesJson = await forkBadges.json();

		await fetch(`${BASE_URL}/repos/${USERNAME}/${REPO_NAME}/contents/${FILE_PATH}`, {
			method: 'PUT',
			headers,
			body: JSON.stringify({
				message: `Update json file`,
				branch: SHORT_NAME,
				content: btoa(updatedBadgesText),
				sha: forkBadgesJson.sha
			})
		});

		await uploadFile(
			`${BASE_URL}/repos/${USERNAME}/${REPO_NAME}/contents/${SHORT_NAME}.gif`,
			SHORT_NAME,
			headers,
			result.output.gif
		);
		await uploadFile(
			`${BASE_URL}/repos/${USERNAME}/${REPO_NAME}/contents/${SHORT_NAME}.png`,
			SHORT_NAME,
			headers,
			result.output.png
		);
		await uploadFile(
			`${BASE_URL}/repos/${USERNAME}/${REPO_NAME}/contents/${SHORT_NAME}.avif`,
			SHORT_NAME,
			headers,
			result.output.avif
		);

		const pr = await fetch(`${BASE_URL}/repos/${REPO_OWNER}/${REPO_NAME}/pulls`, {
			method: 'POST',
			headers,
			body: JSON.stringify({
				title: `Add badge for ${DISPLAY_NAME}`,
				head: `${USERNAME}:${SHORT_NAME}`,
				base: BASE_BRANCH,
				body: `This PR adds the badge for the tournament ${DISPLAY_NAME}. \n\n**Creator:**\n${CREATOR}${result.output.notes ? `\n\n**Notes:**\n${result.output.notes}` : ''}\n\n###### PR created automatically via Badge Uploader`
			})
		});
		const prJson = await pr.json();

		return {
			success: true,
			message: prJson.html_url
		};
	}
} satisfies Actions;

async function fileToBase64(file: File) {
	const arrayBuffer = await file.arrayBuffer();
	const bytes = new Uint8Array(arrayBuffer);
	const binary = bytes.reduce((acc, byte) => acc + String.fromCharCode(byte), '');
	return btoa(binary);
}

async function uploadFile(fullPath: string, branch: string, headers: HeadersInit, file: File) {
	const base64Content = await fileToBase64(file);

	const fileCheck = await fetch(`${fullPath}?ref=${branch}`, {
		method: 'GET',
		headers
	});
	const fileCheckJson = await fileCheck.json();

	return fetch(fullPath, {
		method: 'PUT',
		headers,
		body: JSON.stringify({
			message: `Add file ${file.name}`,
			branch,
			content: base64Content,
			sha: fileCheckJson?.sha || undefined
		})
	});
}
