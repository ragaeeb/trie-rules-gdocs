import { describe, expect, it, mock } from 'bun:test';
import { buildTrie, MatchType } from 'trie-rules';

import { formatParagraphBody } from './formatting';

describe('formatting', () => {
    it('should format the element', () => {
        const trie = buildTrie([{ options: { match: MatchType.Whole }, sources: ['hadith'], target: 'hadīth' }]);

        const actual = formatParagraphBody(
            { paragraph: { elements: [{ textRun: { content: 'The hadith of Al-Dhahabi' } }] } },
            trie,
        );

        expect(actual).toEqual([
            {
                replaceAllText: {
                    containsText: { matchCase: true, text: 'The hadith of Al-Dhahabi' },
                    replaceText: 'The hadīth of al-Dhahabi',
                },
            },
        ]);
    });

    it('should skip links', () => {
        const trie = buildTrie([{ options: { match: MatchType.Whole }, sources: ['hadith'], target: 'hadīth' }]);

        const actual = formatParagraphBody(
            {
                paragraph: {
                    elements: [
                        { textRun: { content: 'The ʿulamāʾʾ are scholars' } },
                        { textRun: { textStyle: { link: 'link' } } },
                    ],
                },
            },
            trie,
        );

        expect(actual).toEqual([
            {
                replaceAllText: {
                    containsText: { matchCase: true, text: 'The ʿulamāʾʾ are scholars' },
                    replaceText: 'The ʿulamāʾ are scholars',
                },
            },
        ]);
    });
});
