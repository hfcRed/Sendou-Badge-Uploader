import { CLIENT_ID, CLIENT_SECRET } from '$env/static/private';
import { BASE_URL, BASE_BRANCH, REPO_OWNER, REPO_NAME, FILE_PATH, DIRECTORY } from './constants';

export interface GitHubApiHeaders {
	Authorization: string;
	Accept: string;
	'Content-Type': string;
	'User-Agent': string;
	[key: string]: string;
}

export function createGitHubHeaders(token: string) {
	return {
		Authorization: `Bearer ${token}`,
		Accept: 'application/vnd.github.v3+json',
		'Content-Type': 'application/json',
		'User-Agent': 'Badge Uploader'
	};
}

export async function validateAccessToken(token: string) {
	const response = await fetch(`${BASE_URL}/applications/${CLIENT_ID}/token`, {
		method: 'POST',
		headers: {
			...createGitHubHeaders(token),
			Authorization: `Basic ${btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)}`
		},
		body: JSON.stringify({
			access_token: token
		})
	});
	return response.ok;
}

export async function deleteAuthorization(token: string) {
	const response = await fetch(`${BASE_URL}/applications/${CLIENT_ID}/grant`, {
		method: 'DELETE',
		headers: {
			...createGitHubHeaders(token),
			Authorization: `Basic ${btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)}`
		},
		body: JSON.stringify({
			access_token: token
		})
	});

	return response.ok;
}

export async function fetchBadgesFile(username: string, branch: string, headers: GitHubApiHeaders) {
	const response = await fetch(
		`${BASE_URL}/repos/${username}/${REPO_NAME}/contents/${FILE_PATH}?ref=${branch}`,
		{
			method: 'GET',
			headers
		}
	);
	return response.json();
}

export async function updateBadgesFile(
	username: string,
	branch: string,
	content: string,
	sha: string,
	headers: GitHubApiHeaders
) {
	return fetch(`${BASE_URL}/repos/${username}/${REPO_NAME}/contents/${FILE_PATH}`, {
		method: 'PUT',
		headers,
		body: JSON.stringify({
			message: `Update homemade.ts file`,
			branch: branch,
			content: btoa(content),
			sha: sha
		})
	});
}

export async function fileToBase64(file: File) {
	const arrayBuffer = await file.arrayBuffer();
	const bytes = new Uint8Array(arrayBuffer);
	const binary = bytes.reduce((acc, byte) => acc + String.fromCharCode(byte), '');
	return btoa(binary);
}

export async function uploadFile(
	username: string,
	fileName: string,
	branch: string,
	headers: GitHubApiHeaders,
	file: File
) {
	const fullPath = `${BASE_URL}/repos/${username}/${REPO_NAME}/contents/${DIRECTORY}/${fileName}`;
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

export async function deleteFile(
	username: string,
	fileName: string,
	branch: string,
	headers: GitHubApiHeaders
) {
	const fullPath = `${BASE_URL}/repos/${username}/${REPO_NAME}/contents/${DIRECTORY}/${fileName}`;
	const fileCheck = await fetch(`${fullPath}?ref=${branch}`, {
		method: 'GET',
		headers
	});
	const fileCheckJson = await fileCheck.json();

	return fetch(fullPath, {
		method: 'DELETE',
		headers,
		body: JSON.stringify({
			message: `Delete file ${fileName}`,
			branch,
			sha: fileCheckJson?.sha || undefined
		})
	});
}

export async function checkPullRequest(
	username: string,
	branchName: string,
	headers: GitHubApiHeaders
) {
	const response = await fetch(
		`${BASE_URL}/repos/${REPO_OWNER}/${REPO_NAME}/pulls?head=${username}:${branchName}`,
		{
			method: 'GET',
			headers
		}
	);
	return response.json();
}

export async function getPullRequestDetails(prUrl: string, headers: GitHubApiHeaders) {
	const prId = prUrl.split('/').pop();
	const response = await fetch(`${BASE_URL}/repos/${REPO_OWNER}/${REPO_NAME}/pulls/${prId}`, {
		method: 'GET',
		headers
	});
	return response.json();
}

export async function createBranch(
	username: string,
	branchName: string,
	headers: GitHubApiHeaders
) {
	const branchRef = await fetch(
		`${BASE_URL}/repos/${REPO_OWNER}/${REPO_NAME}/git/refs/heads/${BASE_BRANCH}`,
		{
			method: 'GET',
			headers
		}
	);
	const branchRefJson = await branchRef.json();
	console.log(branchRefJson);

	const test = await fetch(`${BASE_URL}/repos/${username}/${REPO_NAME}/git/refs`, {
		method: 'POST',
		headers,
		body: JSON.stringify({
			ref: `refs/heads/${branchName}`,
			sha: branchRefJson.object.sha
		})
	});

	console.log(await test.json());
}

export async function createForkIfNeeded(username: string, headers: GitHubApiHeaders) {
	const repos = await fetch(`${BASE_URL}/users/${username}/repos`, {
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
}

export async function createPullRequest(
	username: string,
	branchName: string,
	displayName: string,
	creator: string,
	notes: string | undefined,
	headers: GitHubApiHeaders
) {
	const response = await fetch(`${BASE_URL}/repos/${REPO_OWNER}/${REPO_NAME}/pulls`, {
		method: 'POST',
		headers,
		body: JSON.stringify({
			title: `Add badge for ${displayName}`,
			head: `${username}:${branchName}`,
			base: BASE_BRANCH,
			body: `This PR adds the badge for the tournament ${displayName}. \n\n**Creator:**\n${creator}${notes ? `\n\n**Notes:**\n${notes}` : ''}\n\n###### PR created automatically via Badge Uploader`
		})
	});
	return response.json();
}

export async function getUserData(headers: GitHubApiHeaders) {
	const response = await fetch(`${BASE_URL}/user`, {
		method: 'GET',
		headers
	});
	return response.json();
}
