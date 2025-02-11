import * as dotenv from 'dotenv';
import { Lesson } from './LingQ';
import LingqAPI from './index.js';
import { inspect } from 'util';

dotenv.config();

// Load config
const config = {
    langCode: process.env.LANG_CODE,
    lessonCode: process.env.LESSON_CODE,
    csrfToken: process.env.CSRF_TOKEN,
    sessionId: process.env.SESSION_ID,
};

interface Test {
    name: string;
    fn: () => Promise<void>;
}

const tests: Test[] = [];
const results: { name: string; passed: boolean; error?: string }[] = [];
let globalFailure = false;

const COLORS = {
    RESET: '\x1b[0m',
    RED: '\x1b[31m',
    GREEN: '\x1b[32m',
    CYAN: '\x1b[36m',
    MAGENTA: '\x1b[35m',
};

function testLog(message: string) {
    console.log(`${COLORS.CYAN}[TEST] ${message}${COLORS.RESET}`);
}

/**
 * Creates a test with the given name. Any nested tests are added to the global tests array.
 */
function createTest(name: string, testFn: () => Promise<any>) {
    tests.push({
        name,
        fn: async () => {
            testLog(`Running test: ${name}`);
            try {
                await testFn();
                testLog(`${COLORS.GREEN}Test: ${name} passed${COLORS.RESET}`);
                results.push({ name, passed: true });
            } catch (e: any) {
                testLog(`${COLORS.RED}Test: ${name} failed - ${e.message || e}${COLORS.RESET}`);
                results.push({ name, passed: false, error: e.message || String(e) });
                globalFailure = true;
            }
        },
    });
}

/**
 * Runs tests sequentially. If a test fails, all subsequent tests are skipped.
 * A final summary is printed with error messages for failing tests.
 */
async function runTests(tests: Test[]) {
    while (tests.length > 0) {
        const currentTest = tests.shift()!;
        if (globalFailure) {
            testLog(
                `${COLORS.RED}Skipping test: ${currentTest.name} due to previous failure.${COLORS.RESET}`
            );
            results.push({
                name: currentTest.name,
                passed: false,
                error: 'Skipped due to previous failure',
            });
            continue;
        }
        await currentTest.fn();
    }
    // Print summary
    testLog('===== TEST SUMMARY =====');
    const passedTests = results.filter((r) => r.passed);
    const failedTests = results.filter((r) => !r.passed);
    testLog(
        `${COLORS.GREEN}Passed tests: ${passedTests.map((r) => r.name).join(', ') || 'None'}${
            COLORS.RESET
        }`
    );
    if (failedTests.length > 0) {
        testLog(`${COLORS.RED}Failed tests:${COLORS.RESET}`);
        failedTests.forEach((test) => {
            testLog(`${COLORS.RED}${test.name}: ${test.error}${COLORS.RESET}`);
        });
    } else {
        testLog(`${COLORS.RED}Failed tests: ❌${COLORS.RESET}`);
    }
}

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
        description: 's',
        groups: [],
        hasPrice: false,
        isProtected: false,
        isHidden: true,
        language: 'he',
        status: 'private',
        tags: [],
        text: 's',
        title: 's',
        translations: [],
        notes: '',
        save: true,
    });

    // Output actual content (no color coding)
    console.log('Lesson Creation Details:', lessonCreationDetails.id);

    // Nested test: relies on lessonCreationDetails being available
    createTest('Lesson Get', async () => {
        const lessonId = lessonCreationDetails.id;
        const lesson: Lesson = await lingQ.lessonGet(lessonId);
        console.log('Lesson:', lesson.id);

        createTest('Lesson Delete', async () => {
            const response = await lingQ.lessonDelete(lessonId);

            console.log(inspect(response, { depth: null, colors: true }));
            if (!response.ok) {
                console.log("Failed to delete lesson:", response);
                
                throw new Error('Failed to delete lesson');
            }

            

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
runTests(tests);
