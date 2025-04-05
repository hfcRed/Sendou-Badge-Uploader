import * as v from 'valibot';
import { CreateSchema, UpdateSchema } from './schema';
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
		const result = v.safeParse(CreateSchema, Object.fromEntries(formData.entries()));

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

		// Check if there is already a pull request with the same branch name
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
				message:
					'Pull Request already exists! If this is your Pull Request, use the "Update Existing" option instead.'
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
		const newBadgeEntry = `\t{\n\t\tdisplayName: "${newBadge.displayName}",\n\t\tfileName: "${newBadge.fileName}",\n\t\tauthorDiscordId: "${newBadge.authorDiscordId}",\n\t},\n`;
		const updatedBadgesText =
			badgesText.slice(0, lastBracketIndex) + newBadgeEntry + badgesText.slice(lastBracketIndex);

		// Get all repos and create a fork if it doesnt exist
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

		// Get reference for the source branch
		const branchRef = await fetch(
			`${BASE_URL}/repos/${REPO_OWNER}/${REPO_NAME}/git/refs/heads/${BASE_BRANCH}`,
			{
				method: 'GET',
				headers
			}
		);
		const branchRefJson = await branchRef.json();

		// Create a new branch in the forked repo from the source branch
		await fetch(`${BASE_URL}/repos/${USERNAME}/${REPO_NAME}/git/refs`, {
			method: 'POST',
			headers,
			body: JSON.stringify({
				ref: `refs/heads/${SHORT_NAME}`,
				sha: branchRefJson.object.sha
			})
		});

		// Get the forked repos homemade.ts file
		const forkBadges = await fetch(
			`${BASE_URL}/repos/${USERNAME}/${REPO_NAME}/contents/${FILE_PATH}?ref=${SHORT_NAME}`,
			{
				method: 'GET',
				headers
			}
		);
		const forkBadgesJson = await forkBadges.json();

		// Update the forked repos homemade.ts file with the new badge
		await fetch(`${BASE_URL}/repos/${USERNAME}/${REPO_NAME}/contents/${FILE_PATH}`, {
			method: 'PUT',
			headers,
			body: JSON.stringify({
				message: `Update homemade.ts file`,
				branch: SHORT_NAME,
				content: btoa(updatedBadgesText),
				sha: forkBadgesJson.sha
			})
		});

		// Upload all the image files to the forked repo
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

		// Create a pull request from the forked repo to the original repo
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
	},
	updatePR: async ({ request, locals }) => {
		const formData = await request.formData();
		const result = v.safeParse(UpdateSchema, Object.fromEntries(formData.entries()));

		if (!result.success) {
			return fail(400, {
				success: false,
				message: 'Validation failed, did you fill out all required fields correctly?'
			});
		}

		if (result.output.updateType === 'existing' && !result.output.updateName) {
			return fail(400, {
				success: false,
				message: 'Please provide the name of the badge you want to update!'
			});
		}

		if (!locals.user) {
			return fail(401, {
				success: false,
				message: 'You must be logged into GitHub to update a Pull Request!'
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

		// Check if the pull request actually exists
		const pr = await fetch(
			`${BASE_URL}/repos/${REPO_OWNER}/${REPO_NAME}/pulls/${result.output.prUrl.split('/').pop()}`,
			{
				method: 'GET',
				headers
			}
		);
		const prJson = await pr.json();

		if (prJson.status === '404') {
			return fail(400, {
				success: false,
				message: 'Pull request not found!'
			});
		}

		if (prJson.state !== 'open') {
			return fail(400, {
				success: false,
				message: 'Pull request is not open!'
			});
		}

		if (prJson.base.repo.full_name !== `${REPO_OWNER}/${REPO_NAME}`) {
			return fail(400, {
				success: false,
				message: 'Pull request is not from the correct repository!'
			});
		}

		const userData = await fetch(`${BASE_URL}/user`, {
			method: 'GET',
			headers
		});
		const userJson = await userData.json();

		if (prJson.user.login !== userJson.login) {
			return fail(400, {
				success: false,
				message: 'You are not the owner of this pull request!'
			});
		}

		const branchName = prJson.head.ref;

		if (result.output.updateType === 'existing') {
			const badges = await fetch(
				`${BASE_URL}/repos/${USERNAME}/${REPO_NAME}/contents/${FILE_PATH}?ref=${branchName}`,
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
					message: 'New badge shorthand name already exists!'
				});
			}

			const updateNameExists = badgeList.some(
				(badge: { fileName: string }) => badge.fileName === result.output.updateName
			);

			if (!updateNameExists) {
				return fail(400, {
					success: false,
					message: 'Old badge shorthand name does not exist!'
				});
			}

			const creator = await fetch(
				`${CREATOR}?_data=features%2Fuser-page%2Froutes%2Fu.%24identifier`
			);
			const creatorJson = await creator.json();

			const regex = new RegExp(
				`\\s*\\{[^{]*?fileName:\\s*["']${result.output.updateName}["'][^}]*?\\},?\\n?`
			);
			const newBadge = {
				displayName: DISPLAY_NAME,
				fileName: SHORT_NAME,
				authorDiscordId: creatorJson.user.discordId
			};
			const newBadgeEntry = `\n\t{\n\t\tdisplayName: "${newBadge.displayName}",\n\t\tfileName: "${newBadge.fileName}",\n\t\tauthorDiscordId: "${newBadge.authorDiscordId}",\n\t},\n`;

			const matchResult = badgesText.match(regex);
			if (!matchResult || matchResult.length === 0) {
				return fail(400, {
					success: false,
					message: 'Could not locate the badge entry to update'
				});
			}

			const updatedBadgesText = badgesText.replace(matchResult[0], newBadgeEntry);

			// Get the forked repos homemade.ts file
			const forkBadges = await fetch(
				`${BASE_URL}/repos/${USERNAME}/${REPO_NAME}/contents/${FILE_PATH}?ref=${branchName}`,
				{
					method: 'GET',
					headers
				}
			);
			const forkBadgesJson = await forkBadges.json();

			// Update the forked repos homemade.ts file with the new badge
			await fetch(`${BASE_URL}/repos/${USERNAME}/${REPO_NAME}/contents/${FILE_PATH}`, {
				method: 'PUT',
				headers,
				body: JSON.stringify({
					message: `Update homemade.ts file`,
					branch: branchName,
					content: btoa(updatedBadgesText),
					sha: forkBadgesJson.sha
				})
			});

			await deleteFile(
				`${BASE_URL}/repos/${USERNAME}/${REPO_NAME}/contents/${result.output.updateName}.gif`,
				branchName,
				headers
			);
			await deleteFile(
				`${BASE_URL}/repos/${USERNAME}/${REPO_NAME}/contents/${result.output.updateName}.png`,
				branchName,
				headers
			);
			await deleteFile(
				`${BASE_URL}/repos/${USERNAME}/${REPO_NAME}/contents/${result.output.updateName}.avif`,
				branchName,
				headers
			);
			await uploadFile(
				`${BASE_URL}/repos/${USERNAME}/${REPO_NAME}/contents/${SHORT_NAME}.gif`,
				branchName,
				headers,
				result.output.gif
			);
			await uploadFile(
				`${BASE_URL}/repos/${USERNAME}/${REPO_NAME}/contents/${SHORT_NAME}.png`,
				branchName,
				headers,
				result.output.png
			);
			await uploadFile(
				`${BASE_URL}/repos/${USERNAME}/${REPO_NAME}/contents/${SHORT_NAME}.avif`,
				branchName,
				headers,
				result.output.avif
			);
		}
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

async function deleteFile(fullPath: string, branch: string, headers: HeadersInit) {
	const fileCheck = await fetch(`${fullPath}?ref=${branch}`, {
		method: 'GET',
		headers
	});
	const fileCheckJson = await fileCheck.json();

	return fetch(fullPath, {
		method: 'DELETE',
		headers,
		body: JSON.stringify({
			message: `Delete file ${fullPath.split('/').pop()}`,
			branch,
			sha: fileCheckJson?.sha || undefined
		})
	});
}
