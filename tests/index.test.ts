import { describe, expect, it, beforeAll } from "vitest";
import LingQ from '../src/index';
import * as dotenv from 'dotenv';

dotenv.config();

// Load config
const config = {
	langCode: process.env.LANG_CODE,
	lessonCode: process.env.LESSON_CODE,
	csrfToken: process.env.CSRF_TOKEN,
	sessionId: process.env.SESSION_ID
};

// Ensure all required env variables are set
const isConfigLoaded = Object.values(config).every(value => value);

describe('Check env/config', () => {
	it('should have a langCode', () => {
		expect(config.langCode).toBeDefined();
	});
	it('should have a lessonCode', () => {
		expect(config.lessonCode).toBeDefined();
	});
	it('should have a csrfToken', () => {
		expect(config.csrfToken).toBeDefined();
	});
	it('should have a sessionId', () => {
		expect(config.sessionId).toBeDefined();
	});
});

// Only run tests if config is valid
describe('LingQ', () => {
	beforeAll(() => {
		if (!isConfigLoaded) {
			throw new Error("Missing environment variables. Aborting tests.");
		}
	});

	it('should function', async () => {
		const lingQ = new LingQ(config.langCode!, parseInt(config.lessonCode!), config.csrfToken!, config.sessionId!);
		const res = await lingQ.getLesson();
		expect(res).toBeDefined();
	});
});
