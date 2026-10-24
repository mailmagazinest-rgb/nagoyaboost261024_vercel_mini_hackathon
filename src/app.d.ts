declare global {
	namespace App {
		interface Locals {
			/** Cookie で発行した匿名ユーザーID。おみくじ記録のキーに使う。 */
			userId: string;
		}
	}
}

export {};
