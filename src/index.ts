import typia from 'typia';
import { Lesson } from './LingQ';
import { inspect } from 'util';

// index.ts
type LanguageCode = string; // expand later to be just those languages that are supported
type LessonStatus = string; // expand later to be just those statuses that are supported
type ParamsLessonCreate = {
    description: string;
    groups: unknown[];
    hasPrice: boolean;
    isProtected: boolean;
    isHidden: boolean;
    language: LanguageCode;
    status: LessonStatus;
    tags: unknown[];
    text: string;
    title: string;
    translations: unknown[];
    notes: string;
    save: boolean;
};
type LessonStats = {
    listenTimes: number,
    readTimes: number,
    cardsCreated: number
}
type LessonCreateReturnType = {
    id: number,
    contentId: number,
    collectionId: number,
    collectionTitle: string,
    url: string;
    originalUrl: null,
    imageUrl: string,
    originalImageUrl: string,
    providerImageUrl: string, 
    title: string,
    description: string,
    duration: number,
    audioUrl: string | null,
    audioPending: boolean,
    giveRoseUrl: string,
    wordCount: number,
    uniqueWordCount: number,
    pubDate: string, // "2025-02-10" form
    sharedDate: null | unknown, // unknown how other data comes out
    sharedById: number,
    sharedByName: string,
    sharedByRole: "librarian" | string, // unknown how other data comes out
    external_type: null | unknown,
    type: "lesson" | unknown,
    status: "I" | unknown,
    pos: number,
    price: number,
    lessonURL: string;
}
type LessonCardHint = {
    approved: boolean;
    creator_id: number;
    deteced_locale: unknown; // null in personal example
    flagged: boolean;
    id: number;
    is_google_translate: boolean;
    locale: string; // some kind of language code
    popularity: number;
    term_id: number;
    text: string; // the translation
    word_id: number;
}
type LessonWordHint = {
    flagged: boolean;
    id: number;
    is_google_translate: boolean; // if the hint comes from GT
    popularity: number;
    text: string;
}
type LessonWord = {
    hints: LessonWordHint[];
    importance: number;
    status: string; // "known is one status"
    tags: unknown[];
    text: string;
}
type LessonCard = {
    extended_status: number;
    fragment: string;
    gTags: unknown[];
    hints: LessonCardHint[]; // used typically for translations
    importance: number;
    notes: string;
    pk: number;
    srs_due_date: string; // unknown if this follows a format. example is 2038-09-15T19:01:31.255199 as of 2/9/2025
    status: number;
    term: string;
    transliteration: unknown; // some kind of object
    words: string[]; // if it is a phrase
    writings: string[]; // the difference between this and words is unknown as of now
}
type LessonWordsGetReturnValue = {
    cards: {
        [key: number]: LessonCard; // significance of key value unknown. non-sequential.
    },
    words: {
        [key: number]: LessonWord; 
    }
}
export default class LingqAPI {
    private languageCode: LanguageCode;
    private lessonCode: number;
    private csrfToken: string;
    private sessionId: string;

    private static VERSION = 'Web/5.3.46'; // update this or you will be rejected
    private commonHeaders: {
        'Accept': string;
        'Priority': string;
        'Sec-CH-UA': string;
        'Sec-CH-UA-Mobile': string;
        'Sec-CH-UA-Platform': string;
        'Sec-Fetch-Dest': string;
        'Sec-Fetch-Mode': string;
        'Sec-Fetch-Site': string;
        'X-Lingq-App': typeof LingqAPI.VERSION;
        'Referer': string;
        'Referrer-Policy': string;
        'Cookie'?: string;
        'Content-Type'?: string;
        'X-CSRFToken'?: string;
    }; // the headers that every request uses.

    constructor(
        languageCode: LanguageCode,
        lessonCode: number,
        csrfToken: string,
        sessionId: string
    ) {
        this.languageCode = languageCode;
        this.lessonCode = lessonCode;
        this.csrfToken = csrfToken;
        this.sessionId = sessionId;

        this.commonHeaders = {
            'Accept': 'application/json',
            'Priority': 'u=1, i',
            'Sec-CH-UA': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
            'Sec-CH-UA-Mobile': '?0',
            'Sec-CH-UA-Platform': '"macOS"',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-origin',
            'X-Lingq-App': LingqAPI.VERSION,
            'Referer': `https://www.lingq.com/en/learn/${this.languageCode}/web/editor/${this.lessonCode}`,
            'Referrer-Policy': 'strict-origin-when-cross-origin',
        };
    }

    private buildHeaders({ isPost = false, includeCsrf = false }) {
        const headers = { ...this.commonHeaders };
        headers['Cookie'] = `csrftoken=${this.csrfToken}; wwwlingqcomsa=${this.sessionId};`;

        if (isPost) {
            headers['Content-Type'] = 'application/json';
        }

        if (includeCsrf) {
            headers['X-CSRFToken'] = this.csrfToken;
        }

        return headers;
    }
    // ========================
    // LESSON
    // ========================
    async lessonGet(lessonCode?: number): Promise<Lesson> {
        this.lessonCode = lessonCode ?? this.lessonCode; // switch to the new lesson if possible

        const response = await fetch(`${this._baseURL()}/editor/`, {
            method: 'GET',
            headers: this.buildHeaders({ isPost: false }),
        });
        if (!response.ok)
            throw new Error("Lesson doesn't exist.");
        
        const lesson: Lesson = await response.json();
        
        typia.assert<Lesson>(lesson); // Throws an error if the response is invalid

        return lesson;
    }

    /**
     *
     * @param lessonParams
     * @returns nothing
     * NOTE: This switches the the API to the newly created lesson.
     */
    async lessonCreate(lessonParams: ParamsLessonCreate): Promise<LessonCreateReturnType> {
        /**
         * 
         */
        // returns nothing
        const response = await fetch(
            `https://www.lingq.com/api/v3/${this.languageCode}/lessons/import/`,
            {
                method: 'POST',
                headers: this.buildHeaders({ isPost: true, includeCsrf: true }),
                body: JSON.stringify(lessonParams),
            }
        );
        console.log({response});
        
        if (!response.ok) {
            throw new Error(`Failed to create lesson: ${response}`);
        }

        const lessonCreationDetails: LessonCreateReturnType = await response.json();

        typia.assert<LessonCreateReturnType>(lessonCreationDetails); // Throws an error if the response is invalid

        return lessonCreationDetails;
    }
    async lessonDelete(lessonId: number): Promise<Response> {
        return fetch(`https://www.lingq.com/api/v2/contexts/7198304/lesson/`, { // the context indicates which webpack function it's using I think
            headers: this.buildHeaders({ isPost: true, includeCsrf: true }),
            body: JSON.stringify({ lesson: lessonId }),
            method: 'DELETE',
        });
    }
    /**
     * 
     * @param incrementAmount how many more times the user has read it
     * @param automatic whether it is automatic or manual. Manual may not earn the user points they otherwise achieved / have unintended side-effects.
     * @param app Optional parameter if you want to convey the source to be different than the web.
     */
    async lessonStatsReadTimeIncrement(incrementAmount: number, automatic = true, app = 'web'): Promise<LessonStats> {
        const url = `https://www.lingq.com//api/v2/${this.languageCode}/lesson-stats/${this.lessonCode}/`;
        const init = {
            method: 'PATCH',
            headers: this.buildHeaders({ isPost: true, includeCsrf: true }),
            body: JSON.stringify({
                automatic,
                readTimes: incrementAmount,
                app,
                action: 'increment'
            }),
        }
        const response = await fetch(url, init);;
        if (!response.ok) throw new Error('Failed to increment read time');
        const lessonStats: LessonStats = await response.json();
        typia.assert<LessonStats>(lessonStats); // Throws an error if the response is invalid
        return lessonStats;
    }

    async lessonBookmarkCreate() {
        const url = `https://www.lingq.com/api/v3/${this.languageCode}/lessons/${this.lessonCode}/bookmark/`;
        
    }

    async lessonWordsGet(): Promise<LessonWordsGetReturnValue> {
        const response = await fetch(
            `https://www.lingq.com/api/v3/${this.languageCode}/lessons/${this.lessonCode}/words/`,
            {
                method: 'GET',
                headers: this.buildHeaders({ isPost: false }),
            }
        );

        const words: LessonWordsGetReturnValue = await response.json();

        typia.assert<LessonWordsGetReturnValue>(words); // Throws an error if the response is invalid

        return words;
    }
    // ========================
    // SENTENCES
    // ========================
    async sentenceTimestampUpdate(index: number, timestamp: [number, number]) {
        return await this._postSentences({
            action: 'update',
            timestamp,
            index,
            lone: false,
        });
    }
    /**
     *
     * @param index starting at 1
     * @param text
     * @returns
     */
    async sentenceTextUpdate(index: number, text: string) {
        return await this._postSentences({
            action: 'update',
            text,
            index,
            lone: false,
        });
    }

    /**
     *
     * @param index the index you want the new sentence to have, displacing the current one forwards
     * @param text
     * @param after if you want the new sentence to be after the current one. The default is false.
     * @returns
     */
    async sentenceCreate(index: number, text: string, after = false) {
        // after=false means that the new sentence will be @ index
        return await this._postSentences({
            after: after,
            text: text,
            lone: false,
            index: index,
            action: 'create',
        });
    }

    async sentenceDelete(index: number) {
        return await this._postSentences({
            index: index,
            action: 'delete',
        }); // the api returns no body for delete requests.
    }
    async sentenceBreak(index: number) {
        return await this._postSentences({
            action: 'break',
            index,
        });
    }
    // ========================
    // HELPERS
    // ========================
    private _baseURL() {
        return `https://www.lingq.com/api/v3/${this.languageCode}/lessons/${this.lessonCode}`;
    }
    private _sentencesURL() {
        return `${this._baseURL()}/sentences/`;
    }
    private async _postSentences(body: any) {
        const sentences = this._sentencesURL();
        const init = {
            method: 'POST',
            headers: this.buildHeaders({ isPost: true, includeCsrf: true }),
            body: JSON.stringify(body),
        };

        const response = await fetch(sentences, init);

        return response;
    }
    // ========================
    // USER
    // ========================
    
}
