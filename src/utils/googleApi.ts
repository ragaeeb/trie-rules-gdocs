import { Credentials, OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';
import logSymbols from 'log-symbols';
import { existsSync, promises as fs } from 'node:fs';
import process from 'node:process';
import { createInterface } from 'readline/promises';

import logger from './logger';

export const getTokens = async (client: OAuth2Client, path: string): Promise<Credentials> => {
    if (existsSync(path)) {
        return JSON.parse(await fs.readFile(process.env.TOKEN_PATH as string, 'utf8'));
    }

    const authUrl = client.generateAuthUrl({
        access_type: 'offline',
        scope: ['https://www.googleapis.com/auth/documents'],
    });

    logger.info(`${logSymbols.info} Authorize this app by visiting this URL: ${authUrl}`);

    const rl = createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    const code = await rl.question(`${logSymbols.info} Enter the code from that page here: `);

    rl.close();

    const { tokens } = await client.getToken(code);
    await fs.writeFile(path, JSON.stringify(tokens));

    logger.info(`${logSymbols.success} Token stored to: ${path}`);

    return tokens;
};

export const authorize = async (): Promise<OAuth2Client> => {
    const credentials = JSON.parse(await fs.readFile(process.env.CREDENTIALS_PATH as string, 'utf8'));
    const { client_id, client_secret, redirect_uris } = credentials.installed;
    const client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    const tokens = await getTokens(client, process.env.TOKEN_PATH as string);
    client.setCredentials(tokens);

    return client;
};
