import { CLIENT_ID, CLIENT_SECRET } from '$env/static/private';
import { GitHub } from 'arctic';

export interface GithubLogin {
	token: string;
	name: string;
	url: string;
}

const dev = import.meta.env.DEV;

const CALLBACK_URL = dev
	? 'http://localhost:5173/login/callback'
	: 'https://sendou-badge-uploader.hfcred.workers.dev/login/callback';

export const BASE_URL = 'https://api.github.com';
export const BASE_BRANCH = dev ? 'main' : 'main';
export const REPO_OWNER = dev ? 'hfcRed' : 'sendou-ink';
export const REPO_NAME = dev ? 'PR-Testing' : 'sendou.ink';
export const FILE_PATH = dev ? 'homemade.json' : 'app/features/badges/homemade.json';
export const DIRECTORY = dev ? 'badges' : 'public/static-assets/badges';

export const githubClient = new GitHub(CLIENT_ID, CLIENT_SECRET, CALLBACK_URL);
