import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { BASE_BRANCH, REPO_OWNER, REPO_NAME } from '$lib/server/github/constants';
import {
	createGitHubHeaders,
	checkPullRequest,
	fetchBadgesFile,
	updateBadgesFile,
	uploadFile,
	deleteFile,
	createForkOrSyncExisting,
	createBranch,
	createPullRequest,
	getPullRequestDetails,
	getUserData,
	mergeBaseBranchIntoFeatureBranch
} from '$lib/server/github/helpers';
import {
	fetchCreatorDiscordId,
	checkBadgeNameExists,
	insertNewBadge,
	type BadgeInfo
} from '$lib/server/github/badges';
import {
	validateCreateRequest,
	validateUpdateRequest,
	checkUserAuthentication
} from '$lib/server/validation/validation';

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
		try {
			const result = await validateCreateRequest(request);
			if (!result.success) return result.error;

			const user = checkUserAuthentication(locals);
			if (!user.success) return user.error;

			const { shorthandName, displayName, creator, notes, gif, png, avif } = result.output;
			const username = locals.user.name;
			const headers = createGitHubHeaders(locals.user.token);

			const prCheckJson = await checkPullRequest(username, shorthandName, headers);

			if (prCheckJson.length > 0) {
				return fail(400, {
					success: false,
					for: 'create',
					message:
						'Pull Request already exists! If this is your Pull Request, use the "Update Existing" option instead.'
				});
			}

			const badgesFile = await fetchBadgesFile(REPO_OWNER, BASE_BRANCH, headers);
			const badgesJson = JSON.parse(atob(badgesFile.content));

			if (checkBadgeNameExists(badgesJson, shorthandName)) {
				return fail(400, {
					success: false,
					for: 'create',
					message: 'Badge shorthand name already exists!'
				});
			}

			const discordId = await fetchCreatorDiscordId(creator);

			const newBadge: BadgeInfo = {
				displayName: displayName,
				authorDiscordId: discordId
			};

			const newBadgeJson = insertNewBadge(badgesJson, shorthandName, newBadge);
			const newBadgeFile = JSON.stringify(newBadgeJson, null, '\t') + '\n';

			await createForkOrSyncExisting(username, headers);
			await createBranch(username, shorthandName, headers);
			await mergeBaseBranchIntoFeatureBranch(username, shorthandName, headers);

			const forkBadgesJson = await fetchBadgesFile(username, shorthandName, headers);
			await updateBadgesFile(username, shorthandName, newBadgeFile, forkBadgesJson.sha, headers);

			await uploadFile(username, `${shorthandName}.gif`, shorthandName, headers, gif);
			await uploadFile(username, `${shorthandName}.png`, shorthandName, headers, png);
			await uploadFile(username, `${shorthandName}.avif`, shorthandName, headers, avif);

			const prJson = await createPullRequest(
				username,
				shorthandName,
				displayName,
				creator,
				notes,
				headers
			);

			if (prJson.status === '422') {
				return fail(400, {
					success: false,
					for: 'create',
					message: 'Failed to create Pull Request!'
				});
			}

			return {
				success: true,
				for: 'create',
				message: prJson.html_url
			};
		} catch (error) {
			console.error('Error creating PR: ', error);
			return fail(500, {
				success: false,
				for: 'create',
				message: 'Server error occurred while creating the Pull Request!'
			});
		}
	},

	updatePR: async ({ request, locals }) => {
		try {
			const result = await validateUpdateRequest(request);
			if (!result.success) return result.error;

			const user = checkUserAuthentication(locals);
			if (!user.success) return user.error;

			const { shorthandName, displayName, creator, gif, png, avif, updateType, updateName, prUrl } =
				result.output;

			const username = locals.user.name;
			const headers = createGitHubHeaders(locals.user.token);

			const prJson = await getPullRequestDetails(prUrl, headers);

			if (prJson.status === '404') {
				return fail(400, {
					success: false,
					for: 'update',
					message: 'Pull Request not found!'
				});
			}

			if (prJson.state !== 'open') {
				return fail(400, {
					success: false,
					for: 'update',
					message: 'Pull Request is not open!'
				});
			}

			if (prJson.base.repo.full_name !== `${REPO_OWNER}/${REPO_NAME}`) {
				return fail(400, {
					success: false,
					for: 'update',
					message: 'Pull Request is not from the correct repository!'
				});
			}

			const userJson = await getUserData(headers);

			if (prJson.user.login !== userJson.login) {
				return fail(400, {
					success: false,
					for: 'update',
					message: 'You are not the owner of this Pull Request!'
				});
			}

			const branchName = prJson.head.ref;

			await createForkOrSyncExisting(username, headers);
			await mergeBaseBranchIntoFeatureBranch(username, branchName, headers);

			const badgesFile = await fetchBadgesFile(username, branchName, headers);
			const badgesJson = JSON.parse(atob(badgesFile.content));

			if (updateName !== shorthandName && checkBadgeNameExists(badgesJson, shorthandName)) {
				return fail(400, {
					success: false,
					for: 'update',
					message: 'New badge shorthand name already exists!'
				});
			}

			if (updateType === 'existing') {
				if (!updateName) {
					return fail(400, {
						success: false,
						for: 'update',
						message: 'Please provide the name of the badge you want to update!'
					});
				}

				if (!checkBadgeNameExists(badgesJson, updateName)) {
					return fail(400, {
						success: false,
						for: 'update',
						message: 'Old badge shorthand name does not exist!'
					});
				}

				delete badgesJson[updateName];

				await deleteFile(username, `${updateName}.gif`, branchName, headers);
				await deleteFile(username, `${updateName}.png`, branchName, headers);
				await deleteFile(username, `${updateName}.avif`, branchName, headers);
			}

			const discordId = await fetchCreatorDiscordId(creator);

			const newBadge: BadgeInfo = {
				displayName: displayName,
				authorDiscordId: discordId
			};

			const newBadgeJson = insertNewBadge(badgesJson, shorthandName, newBadge);
			const newBadgeFile = JSON.stringify(newBadgeJson, null, '\t') + '\n';

			await updateBadgesFile(username, branchName, newBadgeFile, badgesFile.sha, headers);

			await uploadFile(username, `${shorthandName}.gif`, branchName, headers, gif);
			await uploadFile(username, `${shorthandName}.png`, branchName, headers, png);
			await uploadFile(username, `${shorthandName}.avif`, branchName, headers, avif);

			return {
				success: true,
				for: 'update',
				message: prJson.html_url
			};
		} catch (error) {
			console.error('Error updating PR: ', error);
			return fail(500, {
				success: false,
				for: 'update',
				message: 'Server error occurred while updating the Pull Request!'
			});
		}
	}
} satisfies Actions;
