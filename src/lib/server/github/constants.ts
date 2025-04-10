import { CLIENT_ID, CLIENT_SECRET } from '$env/static/private';
import { GitHub } from 'arctic';

const dev = import.meta.env.DEV;

export const BASE_URL = 'https://api.github.com';
export const BASE_BRANCH = dev ? 'main' : 'rewrite';
export const REPO_OWNER = dev ? 'hfcRed' : 'Sendou';
export const REPO_NAME = dev ? 'PR-Testing' : 'sendou.ink';
export const FILE_PATH = dev ? 'homemade.ts' : 'app/features/badges/homemade.ts';

const CALLBACK_URL = dev
	? 'http://localhost:5173/login/callback'
	: 'https://sendou-badge-uploader.pages.dev/login/callback';

export const githubClient = new GitHub(CLIENT_ID, CLIENT_SECRET, CALLBACK_URL);

export interface GithubLogin {
	token: string;
	name: string;
	url: string;
}
