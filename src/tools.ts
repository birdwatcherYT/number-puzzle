
// ミリ秒間待機する
function sleep(ms: number) {
	return new Promise(resolve => setTimeout(resolve, ms));
}
export { sleep };
