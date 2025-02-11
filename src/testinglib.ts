// Define colors for console logging.
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

// -------------------------------------------------------------------------------------
// TYPES & GLOBALS
// -------------------------------------------------------------------------------------

// A TestCase is either an individual Test or a TestGroup.
type TestCase = Test | TestGroup;

interface Test {
    type: 'test';
    name: string;
    blocking: boolean;
    fn: () => Promise<void>;
}

interface TestGroup {
    type: 'group';
    name: string;
    blocking: boolean;
    tests: TestCase[];
}

// Each test (or leaf test) will have a result.
interface TestResult {
    name: string;
    passed: boolean;
    error?: string;
}

const results: TestResult[] = [];

// We'll collect top-level tests (and groups) in the rootTests array.
const rootTests: TestCase[] = [];

// To support nested groups, we maintain a stack that tracks the current group.
const groupStack: TestGroup[] = [];

// -------------------------------------------------------------------------------------
// API FUNCTIONS TO CREATE TESTS & GROUPS
// -------------------------------------------------------------------------------------

/**
 * Defines an individual test.
 * If called inside a test group, the test is added to that group.
 * Otherwise, it is added to the root tests.
 *
 * @param name - The name of the test.
 * @param fn - An async function that runs the test.
 * @param blocking - If true (default), a failure in this test will block further tests
 *                   in the current group.
 */
export function createTest(name: string, fn: () => Promise<void>, blocking: boolean = true): void {
    const test: Test = { type: 'test', name, blocking, fn };
    if (groupStack.length > 0) {
        groupStack[groupStack.length - 1].tests.push(test);
    } else {
        rootTests.push(test);
    }
}

/**
 * Defines a test group.
 * Within the callback, you can define tests or even nested groups.
 * The group itself can be marked as blocking or non-blocking.
 * If a blocking test in a blocking group fails, the rest of that group is skipped.
 * But if the group is non-blocking, its failure will not block the parent's execution.
 *
 * @param name - The name of the test group.
 * @param blocking - If true (default), a failure in this group (from a blocking test)
 *                   will block further tests in the group.
 * @param testsCallback - A callback in which you can define tests or nested groups.
 */
export function createTestGroup(
    name: string,
    blocking: boolean = true,
    testsCallback: () => void
): void {
    const group: TestGroup = { type: 'group', name, blocking, tests: [] };
    if (groupStack.length > 0) {
        // Add the group to the current group.
        groupStack[groupStack.length - 1].tests.push(group);
    } else {
        // Otherwise, add it as a top-level group.
        rootTests.push(group);
    }
    // Push the group onto the stack, run the callback, then pop it off.
    groupStack.push(group);
    testsCallback();
    groupStack.pop();
}

// -------------------------------------------------------------------------------------
// RUNNER FUNCTIONS
// -------------------------------------------------------------------------------------

/**
 * Runs all tests starting from the root.
 */
export async function runTests(): Promise<void> {
    for (const testCase of rootTests) {
        await runTestCase(testCase);
    }
    printSummary();
}

/**
 * Recursively runs a TestCase (an individual test or a group).
 * Returns a boolean indicating whether a blocking failure occurred:
 * - For an individual test: returns true if it is blocking and fails.
 * - For a group: if the group is blocking and one of its tests (or subgroups) fails
 *   in a blocking way, it stops further tests and returns true.
 *
 * In non-blocking groups, failures do not propagate upward.
 */
async function runTestCase(testCase: TestCase): Promise<boolean> {
    if (testCase.type === 'test') {
        return await runTest(testCase);
    } else {
        return await runGroup(testCase);
    }
}

/**
 * Runs an individual test.
 * Returns true if the test is blocking and it failed.
 */
async function runTest(test: Test): Promise<boolean> {
    testLog(`Running test: ${test.name} (${test.blocking ? 'blocking' : 'non-blocking'})`);
    try {
        await test.fn();
        testLog(`${COLORS.GREEN}Test passed: ${test.name}${COLORS.RESET}`);
        results.push({ name: test.name, passed: true });
        return false;
    } catch (e: any) {
        testLog(`${COLORS.RED}Test failed: ${test.name} - ${e.message || e}${COLORS.RESET}`);
        results.push({ name: test.name, passed: false, error: e.message || String(e) });
        return test.blocking; // if blocking test fails, return true
    }
}

/**
 * Runs a test group.
 * For a blocking group, if any test (or subgroup) fails in a blocking manner,
 * the remaining tests in the group are skipped.
 *
 * Returns true if the group is blocking and a blocking failure occurred,
 * false otherwise.
 */
async function runGroup(group: TestGroup): Promise<boolean> {
    testLog(`Running group: ${group.name} (${group.blocking ? 'blocking' : 'non-blocking'})`);
    let groupBlocked = false;
    for (const testCase of group.tests) {
        if (group.blocking && groupBlocked) {
            // If the group is blocking and we already encountered a blocking failure,
            // skip any further tests in this group.
            skipTestCase(
                testCase,
                `Skipped due to previous blocking failure in group "${group.name}"`
            );
        } else {
            const blocked = await runTestCase(testCase);
            // In a blocking group, if any test returns true (i.e. blocking failure), record it.
            if (group.blocking && blocked) {
                groupBlocked = true;
            }
        }
    }
    testLog(`Finished group: ${group.name}`);
    // For a blocking group, propagate the blocking failure upward.
    return group.blocking ? groupBlocked : false;
}

/**
 * Marks a test case as skipped.
 * For groups, it recursively marks all nested tests as skipped.
 *
 * @param testCase - The test or group to be skipped.
 * @param reason - A string explaining why the test was skipped.
 */
function skipTestCase(testCase: TestCase, reason: string): void {
    if (testCase.type === 'test') {
        testLog(`${COLORS.MAGENTA}Skipping test: ${testCase.name} - ${reason}${COLORS.RESET}`);
        results.push({ name: testCase.name, passed: false, error: reason });
    } else {
        testLog(`${COLORS.MAGENTA}Skipping group: ${testCase.name} - ${reason}${COLORS.RESET}`);
        // Recursively mark all tests within the group as skipped.
        for (const child of testCase.tests) {
            skipTestCase(child, `Skipped due to parent group "${testCase.name}" being blocked`);
        }
    }
}

/**
 * Prints a summary of all test results.
 */
function printSummary(): void {
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
        testLog(`${COLORS.RED}Failed tests: None${COLORS.RESET}`);
    }
}

// -------------------------------------------------------------------------------------
// EXAMPLE USAGE
// -------------------------------------------------------------------------------------

// Uncomment the code below to try out the library:

/*
  // Example 1: A blocking group – a blocking failure stops further tests in the group.
  createTestGroup("Critical Tests", true, () => {
    createTest("Test A", async () => {
      // Simulate a failure.
      throw new Error("Failure in Test A");
    }, true); // blocking test
  
    createTest("Test B", async () => {
      console.log("Test B should be skipped if Test A fails");
    }, true);
  });
  
  // Example 2: A non-blocking group – failures do not block the group.
  createTestGroup("Minor Tests", false, () => {
    createTest("Test X", async () => {
      throw new Error("Failure in Test X");
    }, true); // even though this is a blocking test, the group is non-blocking
  
    createTest("Test Y", async () => {
      console.log("Test Y runs regardless of Test X failure");
    }, false);
  });
  
  // Example 3: Nested groups with different blocking behaviors.
  createTestGroup("Parent Group", true, () => {
    // Non-blocking subgroup: its failure does not block the parent.
    createTestGroup("Subgroup A", false, () => {
      createTest("Test A1", async () => {
        throw new Error("Failure in Test A1");
      }, true); // blocks only Subgroup A
      createTest("Test A2", async () => {
        console.log("Test A2 runs even if Test A1 fails in Subgroup A");
      }, false);
    });
  
    // Blocking subgroup: its failure will block the parent.
    createTestGroup("Subgroup B", true, () => {
      createTest("Test B1", async () => {
        console.log("Test B1 runs normally");
      }, true);
      createTest("Test B2", async () => {
        throw new Error("Failure in Test B2");
      }, true);
      // Since Subgroup B is blocking and Test B2 fails,
      // any subsequent tests in Subgroup B would be skipped.
      createTest("Test B3", async () => {
        console.log("Test B3 should be skipped because Test B2 failed");
      }, true);
    });
  });
  
  // Run all tests.
  runTests();
  */
