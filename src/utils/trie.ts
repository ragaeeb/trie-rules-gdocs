import logSymbols from 'log-symbols';
import fetch from 'node-fetch';
import { buildTrie, TrieNode } from 'trie-rules';

import logger from './logger';

export const getTrie = async (rulesEndpoint: string): Promise<TrieNode> => {
    logger.info(`${logSymbols.info} Download rules...`);

    const response = await fetch(rulesEndpoint);
    const data = await response.json();

    const trie = buildTrie(data.searchReplaceRules);

    logger.info(`${logSymbols.success} ${data.searchReplaceRules.length} rules processed`);

    return trie;
};
