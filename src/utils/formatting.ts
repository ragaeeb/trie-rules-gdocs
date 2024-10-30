import { normalizeArabicPrefixesToAl, normalizeDoubleApostrophes, replaceSalutationsWithSymbol } from 'bitaboom';
import picocolors from 'picocolors';
import { searchAndReplace, TrieNode } from 'trie-rules';

import { Change } from '../types';
import logger from './logger';

export const formatParagraphBody = (element: any, trie: TrieNode): Change[] => {
    const changes: Change[] = [];

    if (element.paragraph) {
        let paragraphText = '';

        for (const el of element.paragraph.elements) {
            const textRun = el.textRun;

            if (textRun && textRun.textStyle && textRun.textStyle.link) {
                logger.warn(`Skipping link: ${textRun.content}`);
                continue;
            }

            if (textRun && textRun.content) {
                paragraphText += textRun.content;
            }
        }

        const modifiedText = normalizeDoubleApostrophes(
            normalizeArabicPrefixesToAl(searchAndReplace(trie, replaceSalutationsWithSymbol(paragraphText))),
        );

        if (modifiedText.trim() !== paragraphText.trim()) {
            logger.trace(`${picocolors.dim(paragraphText)} -> ${picocolors.italic(modifiedText)}`);

            changes.push({
                replaceAllText: {
                    containsText: { matchCase: true, text: paragraphText },
                    replaceText: modifiedText,
                },
            });
        }
    }

    return changes;
};
