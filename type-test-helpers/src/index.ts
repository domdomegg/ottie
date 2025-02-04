import {
	TypeVar, type MonoType, type Expr, isTypeInferenceError,
} from 'language';
import {expect} from 'vitest';
import {diff} from '@vitest/utils/diff';

declare global {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace vitest {
		// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
		interface Assertion<R> {
			toHaveType(expectedType: MonoType): R;
			toHaveInvalidType(): R;
		}
	}
}

const extendWithInfer = (infer: (e: Expr) => MonoType) => {
	expect.extend({
		toHaveType(actualExpr: Expr, expectedType: MonoType) {
			let actualType: MonoType;
			try {
				actualType = infer(actualExpr);
			} catch (e) {
				if (isTypeInferenceError(e)) {
					return {
						message: () => `expected expression to have valid type but got error ${this.utils.printReceived(e)}`,
						pass: false,
					};
				}

				throw e;
			}

			const options = {comment: 'type equality', isNot: this.isNot, promise: this.promise};

			const alphaEqv: Record<string, string> = {};
			const alphaEqivalenceTester = (actual: any, expected: any) => {
				if (actual instanceof TypeVar && expected instanceof TypeVar) {
					if (actual.name in alphaEqv) {
						return expected.name === alphaEqv[actual.name];
					}

					if (Object.values(alphaEqv).includes(expected.name)) {
						return false;
					}

					alphaEqv[actual.name] = expected.name;
					return true;
				}

				return undefined;
			};

			const pass = this.equals(actualType, expectedType, [alphaEqivalenceTester]);

			const message = pass
				? () =>
					`${this.utils.matcherHint('toHaveType', 'expr', 'type', options)
					}\n\n`
					+ `Expected: not ${this.utils.printExpected(expectedType)}\n`
					+ `Received: ${this.utils.printReceived(actualType)}`
				: () => {
					const diffString = diff(expectedType, actualType, {expand: this.expand});
					return (
						`${this.utils.matcherHint('toHaveType', 'expr', 'type', options)
						}\n\n${
							diffString?.includes('- Expect')
								? `Difference:\n\n${diffString}`
								: `Expected: ${this.utils.printExpected(expectedType)}\n`
									+ `Received: ${this.utils.printReceived(actualType)}`}`
					);
				};

			return {actual: actualType, message, pass};
		},
		toHaveInvalidType(actualExpr: Expr) {
			let actualType: MonoType;
			try {
				actualType = infer(actualExpr);
			} catch (e) {
				return {
					message: () => `expected expression to have valid type but got error ${this.utils.printReceived(e)}`,
					pass: true,
				};
			}

			return {
				message: () => `expected expression to have invalid type but got type ${actualType.toString()}`,
				pass: false,
			};
		},
	});
};

export default extendWithInfer;
