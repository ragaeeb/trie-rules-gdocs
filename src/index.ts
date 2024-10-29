import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';
import logSymbols from 'log-symbols';
import process from 'node:process';
import fetch from 'node-fetch';
import { buildTrie } from 'trie-rules';

import { authorize } from './utils/auth';
import { Changes, formatParagraphBody } from './utils/formatting';
import logger from './utils/logger';

const DOCUMENT_ID = process.env.DOCUMENT_ID;

const processDocument = async (authClient: OAuth2Client) => {
    logger.info(`${logSymbols.info} Download rules...`);

    const response = await fetch(process.env.API_PATH_RULES);
    const data = await response.json();

    const trie = buildTrie(data.searchReplaceRules);

    logger.info(`${logSymbols.success} ${data.searchReplaceRules.length} rules processed`);

    const docs = google.docs({ auth: authClient, version: 'v1' });
    const document = await docs.documents.get({ documentId: DOCUMENT_ID });

    logger.info(`${logSymbols.success} Google Doc: ${DOCUMENT_ID} fetched`);

    const requests: Array<Changes> = [];

    // Iterate over each paragraph element in the document
    document.data.body?.content?.forEach((element: any) => {
        requests.push(...formatParagraphBody(element, trie));
    });

    const footerCount = document.data.footnotes ? Object.keys(document.data.footnotes).length : 0;
    logger.info(`footerCount: ${footerCount}`);
    for (let i = 0; i < footerCount; i++) {
        const footerId = Object.keys(document.data.footnotes || {})[i];
        const footnote = (document.data.footnotes || {})[footerId];

        footnote?.content?.forEach((element: any) => {
            requests.push(...formatParagraphBody(element, trie));
        });
    }

    if (requests.length > 0) {
        await docs.documents.batchUpdate({
            documentId: DOCUMENT_ID,
            requestBody: { requests },
        });
        logger.info(`${logSymbols.success} Document updated successfully with ${requests.length} changes.`);
    } else {
        logger.info(`${logSymbols.warning} No changes made.`);
    }
};

authorize()
    .then((authClient) => processDocument(authClient))
    .catch(logger.error);
