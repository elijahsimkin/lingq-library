import * as dotenv from 'dotenv';
import { Lesson } from '../src/LingQ';
import LingqAPI from '../src/index.js';
import { inspect } from 'util';
import { COLORS, createTest, createTestGroup, runTests } from './testinglib.js';

dotenv.config();

// Load config
const config = {
    langCode: process.env.LANG_CODE,
    lessonCode: process.env.LESSON_CODE,
    csrfToken: process.env.CSRF_TOKEN,
    sessionId: process.env.SESSION_ID,
};

// Instantiate API client
const lingQ: LingqAPI = new LingqAPI(
    config.langCode!,
    parseInt(config.lessonCode!),
    config.csrfToken!,
    config.sessionId!
);

createTestGroup('Lesson Operations', true, () => {
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

        createTestGroup('Lesson Modification Tests', false, () => {
            const lessonId = lessonCreationDetails.id;

            createTest('Lesson Get', async () => {
                const lesson: Lesson = await lingQ.lessonGet(lessonId);
                console.log('Lesson:', lesson.id);
            });

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
            
            createTestGroup('Sentence Operations', false, () => {

                createTest('Sentence Create', async () => {
                    const response = await lingQ.sentenceCreate(1, 'New test sentence', false);
                    console.log(await response.json());

                    if (!response.ok) {
                        throw new Error('Sentence creation failed');
                    }
                    console.log('Sentence Create Response:', response.status);
                }, true);
                createTestGroup('Sentence Modification Tests', false, () => {
                    createTest('Sentence Text Update', async () => {
                        const response = await lingQ.sentenceTextUpdate(1, 'Updated test sentence');
                        if (!response.ok) {
                            throw new Error('Sentence text update failed');
                        }
                        
                    });
    
                    createTest('Sentence Timestamp Update', async () => {
                        const response = await lingQ.sentenceTimestampUpdate(1, [10, 20]);
                        if (!response.ok) {
                            throw new Error('Sentence timestamp update failed');
                        }
                    });
    
                    createTest('Sentence Break', async () => {
                        const response = await lingQ.sentenceBreak(1);
                        if (!response.ok) {
                            throw new Error('Sentence break failed');
                        }
                        console.log('Sentence Break Response:', response.status);
                    });
                });

                createTest('Sentence Delete', async () => {
                    const response = await lingQ.sentenceDelete(1);
                    if (!response.ok) {
                        throw new Error('Sentence delete failed');
                    }
                }, true);

            });

            createTest('Lesson Delete', async () => {
                const response = await lingQ.lessonDelete(lessonId);
                if (!response.ok) {
                    throw new Error('Failed to delete lesson');
                }

                createTest('Lesson Get After Delete', async () => {
                    try {
                        await lingQ.lessonGet(lessonId);
                        throw new Error('Lesson was not deleted');
                    } catch (e) {
                        console.log(
                            'Lesson deletion confirmed:',
                            `${COLORS.MAGENTA}${e}${COLORS.RESET}`
                        );
                    }
                });
            });
        });
    });
});

// RUN TESTS
runTests();
