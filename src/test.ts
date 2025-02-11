import * as dotenv from 'dotenv';
import { Lesson } from './LingQ';
import LingqAPI from './index.js';
import { inspect } from 'util';
import { COLORS, createTest, runTests } from './testinglib.js';

dotenv.config();

// Load config
const config = {
    langCode: process.env.LANG_CODE,
    lessonCode: process.env.LESSON_CODE,
    csrfToken: process.env.CSRF_TOKEN,
    sessionId: process.env.SESSION_ID,
};



// ========================
// TESTS DEFINED BELOW
// ========================

const lingQ: LingqAPI = new LingqAPI(
    config.langCode!,
    parseInt(config.lessonCode!),
    config.csrfToken!,
    config.sessionId!
);

createTest('Lesson Create', async () => {
    const lessonCreationDetails = await lingQ.lessonCreate({
        description: 'Test lesson',
        groups: [],
        hasPrice: false,
        isProtected: false,
        isHidden: true,
        language: 'he',
        status: 'private',
        tags: [],
        text: 'Initial text',
        title: 'Test Lesson',
        translations: [],
        notes: '',
        save: true,
    });

    console.log('Lesson Creation Details:', lessonCreationDetails.id);

    createTest('Lesson Get', async () => {
        const lessonId = lessonCreationDetails.id;
        const lesson: Lesson = await lingQ.lessonGet(lessonId);
        console.log('Lesson:', lesson.id);

        // Test: Lesson Words Get
        createTest('Lesson Words Get', async () => {
            const words = await lingQ.lessonWordsGet();
            if (
                !words ||
                typeof words !== 'object' ||
                !words.cards ||
                !words.words ||
                typeof words.cards !== 'object' ||
                typeof words.words !== 'object'
            ) {
                throw new Error('Invalid structure for lesson words');
            }
            console.log('Lesson Words Get:', inspect(words, { depth: null, colors: true }));
        });

        // Test: Sentence Create
        createTest('Sentence Create', async () => {
            const response = await lingQ.sentenceCreate(1, "New test sentence", false);
            console.log(await response.json());
            
            if (!response.ok) {
                throw new Error('Sentence creation failed');
            }
            console.log('Sentence Create Response:', response.status);
        });

        // Test: Sentence Text Update
        createTest('Sentence Text Update', async () => {
            const response = await lingQ.sentenceTextUpdate(1, "Updated test sentence");
            if (!response.ok) {
                throw new Error('Sentence text update failed');
            }
            console.log('Sentence Text Update Response:', response.status);
        });

        // Test: Sentence Timestamp Update
        createTest('Sentence Timestamp Update', async () => {
            const response = await lingQ.sentenceTimestampUpdate(1, [10, 20]);
            if (!response.ok) {
                throw new Error('Sentence timestamp update failed');
            }
            console.log('Sentence Timestamp Update Response:', response.status);
        });

        // Test: Sentence Break
        createTest('Sentence Break', async () => {
            const response = await lingQ.sentenceBreak(1);
            if (!response.ok) {
                throw new Error('Sentence break failed');
            }
            console.log('Sentence Break Response:', response.status);
        });

        // Test: Sentence Delete
        createTest('Sentence Delete', async () => {
            const response = await lingQ.sentenceDelete(1);
            if (!response.ok) {
                throw new Error('Sentence delete failed');
            }
            console.log('Sentence Delete Response:', response.status);
        });

        // Finally, delete the test lesson.
        createTest('Lesson Delete', async () => {
            const response = await lingQ.lessonDelete(lessonId);
            console.log('Lesson Delete Response:', inspect(response, { depth: null, colors: true }));
            if (!response.ok) {
                throw new Error('Failed to delete lesson');
            }

            // Confirm deletion
            createTest('Lesson Get After Delete', async () => {
                try {
                    await lingQ.lessonGet(lessonId);
                    throw new Error('Lesson was not deleted');
                } catch (e) {
                    console.log('Lesson deletion confirmed:', `${COLORS.MAGENTA}${e}${COLORS.RESET}`);
                }
            });
        });
    });
});


// RUN TESTS
runTests();
