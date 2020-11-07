import { MonoType, Expr, TypeVar } from '../src/index';
import { standardCtx } from './utilities';
import diff from 'jest-diff';

declare global {
    namespace jest {
        interface Matchers<R> {
            toHaveType(expectedType: MonoType): R;
            toHaveInvalidType(): R;
        }
    }
}

expect.extend({
    toHaveType(actualExpr: Expr, expectedType: MonoType) {
        let actualType: MonoType;
        try {
            actualType = actualExpr.infer(standardCtx)[0]
        } catch (e) {
            return {
                message: () => `expected ${JSON.stringify(actualExpr)} to have valid type but got error ${JSON.stringify(e)}`,
                pass: false,
            }
        }

        const options = { comment: 'type equality', isNot: this.isNot, promise: this.promise };

        const alphaEqv: { [actualName: string]: string } = {};
        const alphaEqivalenceTester: jest.EqualityTester = (actual: any, expected: any) => {
            if (actual instanceof TypeVar && expected instanceof TypeVar) {
                if (actual.name in alphaEqv) {
                    return expected.name == alphaEqv[actual.name];
                } else {
                    alphaEqv[actual.name] = expected.name;
                    return true;
                }
            }

            return undefined;
        };
        const pass = this.equals(actualType, expectedType, [alphaEqivalenceTester]);

        const message = pass
        ? () =>
            this.utils.matcherHint('toHaveType', 'expr', 'type', options) +
            '\n\n' +
            `Expected: not ${this.utils.printExpected(expectedType)}\n` +
            `Received: ${this.utils.printReceived(actualType)}`
        : () => {
            const diffString = diff(expectedType, actualType, {
                expand: this.expand,
            });
            return (
                this.utils.matcherHint('toHaveType', 'expr', 'type', options) +
                '\n\n' +
                (diffString && diffString.includes('- Expect')
                    ? `Difference:\n\n${diffString}`
                    : `Expected: ${this.utils.printExpected(expectedType)}\n` +
                    `Received: ${this.utils.printReceived(actualType)}`)
            );
        };

        return { actual: actualType, message, pass };

        if (this.equals(actualType, expectedType)) {
            return {
                message: () => `expected ${actualType.toString()} not to have type ${expectedType.toString()}`,
                pass: true,
            }
        } else {
            return {
                message: () => `expected ${actualType.toString()} to have type ${expectedType.toString()}`,
                pass: true,
            }
        }
    },
    toHaveInvalidType(actualExpr: Expr) {
        let actualType: MonoType;
        try {
            actualType = actualExpr.infer(standardCtx)[0]
        } catch (e) {
            return {
                message: () => `expected ${JSON.stringify(actualExpr)} to have valid type but got error ${JSON.stringify(e)}`,
                pass: true,
            }
        }

        return {
            message: () => `expected ${JSON.stringify(actualExpr)} to have invalid type but got type ${actualType.toString()}`,
            pass: false,
        }
    }
});