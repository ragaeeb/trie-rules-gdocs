import { docs_v1, google } from 'googleapis';
import logSymbols from 'log-symbols';
import process from 'node:process';
import { TrieNode } from 'trie-rules';

import { Change } from './types';
import { formatParagraphBody } from './utils/formatting';
import { authorize } from './utils/googleApi';
import logger from './utils/logger';
import { getTrie } from './utils/trie';

const applyFormattingToDocument = async (documentId: string, docs: docs_v1.Docs, trie: TrieNode): Promise<Change[]> => {
    const document = await docs.documents.get({ documentId });

    logger.info(`${logSymbols.success} Google Doc: ${documentId} fetched`);

    const requests: Change[] = [];

    document.data.body?.content?.forEach((element: any) => {
        requests.push(...formatParagraphBody(element, trie));
    });

    Object.entries(document.data.footnotes || {}).forEach(([, footnote]) => {
        footnote?.content?.forEach((element: any) => {
            requests.push(...formatParagraphBody(element, trie));
        });
    });

    return requests;
};

const saveChangesToDoc = async (documentId: string, docs: docs_v1.Docs, changes: Change[]) => {
    if (changes.length > 0) {
        await docs.documents.batchUpdate({
            documentId,
            requestBody: { requests: changes },
        });
        logger.info(`${logSymbols.success} Document updated successfully with ${changes.length} changes.`);
    } else {
        logger.info(`${logSymbols.warning} No changes made.`);
    }
};

const formatDocument = async (documentId: string, { saveChanges = true } = {}) => {
    try {
        const [trie, authClient] = await Promise.all([getTrie(process.env.API_PATH_RULES as string), authorize()]);
        const docs: docs_v1.Docs = google.docs({ auth: authClient, version: 'v1' });
        const now = Date.now();
        const changes = await applyFormattingToDocument(documentId, docs, trie);
        logger.info(`Formatting took: ${(Date.now() - now) / 1000} seconds`);
        await saveChangesToDoc(documentId, docs, saveChanges ? changes : []);
    } catch (err) {
        logger.error(err);
    }
};

formatDocument(process.env.DOCUMENT_ID as string, { saveChanges: true });
