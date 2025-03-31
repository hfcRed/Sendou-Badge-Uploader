import { GitHub } from 'arctic';
import { CLIENT_ID, CLIENT_SECRET } from '$env/static/private';

export const github = new GitHub(CLIENT_ID, CLIENT_SECRET, 'http://localhost:5173/login/callback');

export type Login = {
	token: string;
	name: string;
	url: string;
};
