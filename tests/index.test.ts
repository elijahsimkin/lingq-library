import { describe, expect, it } from "vitest";
import LingQ from '../src/index';
import * as dotenv from 'dotenv';

dotenv.config();

const config = {
	langCode: process.env.LANG_CODE,
	lessonCode: process.env.LESSON_CODE,
	csrfToken: process.env.CSRF_TOKEN,
	sessionId: process.env.SESSION_ID
}

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

