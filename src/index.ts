// index.ts
type LanguageCode = string; // expand later to be just those languages that are supported

export default class LingqAPI {
	private languageCode: LanguageCode;
	private lessonCode: number;
	private csrfToken: string;
	private sessionId: string;

	private static VERSION = 'Web/5.3.38'; // update this or you will be rejected
	private commonHeaders: {
		'Accept': 	 string,
		'Priority':  string,
		'Sec-CH-UA': string,
		'Sec-CH-UA-Mobile': string,
		'Sec-CH-UA-Platform': string,
		'Sec-Fetch-Dest': string,
		'Sec-Fetch-Mode': string,
		'Sec-Fetch-Site': string,
		'X-Lingq-App': typeof LingqAPI.VERSION,
		'Referer': string;
		'Referrer-Policy': string;
		'Cookie'?: string
		'Content-Type'?: string,
		'X-CSRFToken'?: string,
	};  // the headers that every request uses.
	


    constructor(languageCode: LanguageCode, lessonCode: number, csrfToken: string, sessionId: string) {
        this.languageCode = languageCode;
        this.lessonCode = lessonCode;
        this.csrfToken = csrfToken;
        this.sessionId = sessionId;

		this.commonHeaders = 	{
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

    buildHeaders({ isPost = false, includeCsrf = false }) {
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

    async getLesson() {
        const response = await fetch(`${this._baseURL()}/editor/`, {
            method: 'GET',
            headers: this.buildHeaders({ isPost: false }),
        });
        return response.json();
    }

    _baseURL () {
        return `https://www.lingq.com/api/v3/${this.languageCode}/lessons/${this.lessonCode}`;
    }
    _sentencesURL() {
        return `${this._baseURL()}/sentences/`
    }
    async _postSentences(body: any) {
        const sentences = this._sentencesURL();
        const init = {
            method: 'POST',
            headers: this.buildHeaders({ isPost: true, includeCsrf: true }),
            body: JSON.stringify(body),
        };
        
        const response = await fetch(sentences, init);
        
        return response;
    }
    async updateSentenceTimestamp(index: number, timestamp: [number, number]) {
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
    async updateSentenceText(index: number, text: string) {
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
    async createSentence(index: number, text: string, after = false) {
        // after=false means that the new sentence will be @ index
        return await this._postSentences({
            after: after,
            text: text,
            lone: false,
            index: index,
            action: 'create',
        });
    }

    async deleteSentence(index: number) {
        return await this._postSentences({
            index: index,
            action: 'delete',
        }) // the api returns no body for delete requests.
    }
    async breakSentence(index: number) {
        return await this._postSentences({
            action: 'break',
            index,
        });
    }
}