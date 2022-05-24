// imports mocha for the browser, defining the `mocha` global.
require("mocha/mocha");

export function run(): Promise<void> {

	return new Promise((c, e) => {
		mocha.setup({
			ui: "tdd",
			reporter: undefined
		});

		// bundles all files in the current directory matching `*.test`
		const importAll: (param: __WebpackModuleApi.RequireContext) => void = (r: __WebpackModuleApi.RequireContext) => r.keys().forEach(r);
		importAll(require.context(".", true, /\.test$/));

		try {
			mocha.run(failures => {
				if (failures > 0) {
					e(new Error(`${failures} tests failed.`));
				} else {
					c();
				}
			});
		} catch (err) {
			console.error(err);
			e(err);
		}
	});
}
