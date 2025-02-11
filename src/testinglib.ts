interface Test {
    name: string;
    fn: () => Promise<void>;
}

const tests: Test[] = [];
const results: { name: string; passed: boolean; error?: string }[] = [];
let globalFailure = false;

export const COLORS = {
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
export function createTest(name: string, testFn: () => Promise<any>) {
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
export async function runTests() {
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