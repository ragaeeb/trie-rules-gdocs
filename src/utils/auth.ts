import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';
import logSymbols from 'log-symbols';
import fs from 'node:fs';
import process from 'node:process';
import { createInterface } from 'readline/promises';

const SCOPES = ['https://www.googleapis.com/auth/documents'];
const CREDENTIALS_PATH = './credentials.json'; // Path to your OAuth2 credentials file
const TOKEN_PATH = './token.json'; // Path to store the access token

import logger from './logger';

// Load credentials and initialize OAuth2Client
export const authorize = async (): Promise<OAuth2Client> => {
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
    const { client_id, client_secret, redirect_uris } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    // Load token if it exists
    if (fs.existsSync(TOKEN_PATH)) {
        const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
        oAuth2Client.setCredentials(token);
        return oAuth2Client;
    }

    // Get new token if no previous token exists
    const authUrl = oAuth2Client.generateAuthUrl({ access_type: 'offline', scope: SCOPES });
    logger.info(`${logSymbols.info} Authorize this app by visiting this URL: ${authUrl}`);

    const rl = createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    const code = await rl.question(`${logSymbols.info} Enter the code from that page here: `);

    rl.close();

    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
    logger.info(`${logSymbols.success} Token stored to: ${TOKEN_PATH}`);

    return oAuth2Client;
};
