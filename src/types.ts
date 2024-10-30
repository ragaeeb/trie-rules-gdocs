export type Change = {
    replaceAllText: {
        containsText: {
            matchCase: boolean;
            text: string;
        };
        replaceText: string;
    };
};
