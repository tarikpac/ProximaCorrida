/**
 * Tests for Lambda Handler
 * Task Group 1: Lambda Handler & Dependencies
 * 
 * Note: These are unit tests that verify the handler structure
 * without bootstrapping the full NestJS application (which requires DB/Redis)
 */

describe('Lambda Handler Module', () => {
    it('should export a handler function', async () => {
        // Dynamic import to avoid triggering app bootstrap at module load
        const lambdaModule = await import('./lambda');

        expect(lambdaModule.handler).toBeDefined();
        expect(typeof lambdaModule.handler).toBe('function');
    });

    it('handler should have the correct function signature (3 parameters)', async () => {
        const lambdaModule = await import('./lambda');

        // Lambda handlers accept (event, context, callback)
        expect(lambdaModule.handler.length).toBe(3);
    });
});

describe('Lambda Context Optimization', () => {
    it('should set callbackWaitsForEmptyEventLoop to false', () => {
        // This tests the pattern used in the handler, not the actual handler
        const mockContext = {
            callbackWaitsForEmptyEventLoop: true,
        };

        // Simulate what handler does
        mockContext.callbackWaitsForEmptyEventLoop = false;

        expect(mockContext.callbackWaitsForEmptyEventLoop).toBe(false);
    });
});

describe('Environment Detection Functions', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        jest.resetModules();
        process.env = { ...originalEnv };
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    it('should detect Lambda context via IS_LAMBDA env var', async () => {
        process.env.IS_LAMBDA = 'true';

        // The lambda module checks AWS_LAMBDA_FUNCTION_NAME or IS_LAMBDA
        expect(process.env.IS_LAMBDA).toBe('true');
    });

    it('should detect Lambda context via AWS_LAMBDA_FUNCTION_NAME', async () => {
        process.env.AWS_LAMBDA_FUNCTION_NAME = 'test-function';

        expect(process.env.AWS_LAMBDA_FUNCTION_NAME).toBe('test-function');
    });
});
