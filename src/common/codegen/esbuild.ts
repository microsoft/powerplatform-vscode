/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */


import { formatMessages, Loader, PartialMessage, Plugin } from 'esbuild-wasm';
import { builtinModules } from './builtin-modules';
import { BrowserNPM } from "./BrowserNpm";

class Logger {
  lines: Set<string>;

  constructor() {
    this.lines = new Set();
  }

  log(message: string) {
    this.lines.add(message);
  }

  clear() {
    this.lines.clear();
  }
}

export const logger = new Logger();

export const PROJECT_ROOT = '/project/';

// https://esbuild.github.io/api/#resolve-extensions
const RESOLVE_EXTENSIONS = ['.tsx', '.ts', '.jsx', '.js', '.css', '.json'];
//const buildCache = new Map<string, string>();
export function resolvePlugin(npmManager: BrowserNPM): Plugin {
  return {
    name: 'resolve',
    setup(build) {
      // External modules
      const external = [...(build.initialOptions.external || []), ...builtinModules];

      const isExternal = (id: string) => {
        function match(it: string): boolean {
          if (it === id) {
            return true;
          } // import 'foo' & external: ['foo']
          if (id.startsWith(`${it}/`)) {
            return true;
          } // import 'foo/bar.js' & external: ['foo']
          return false;
        }
        return external.find(match);
      };

      build.onStart(() => {
        logger.clear();
      });

      build.onEnd(() => {
        logger.clear();
      });

      build.onResolve({ filter: /.*/ }, async (args) => {
        if (args.path.startsWith(PROJECT_ROOT)) {
          return {
            path: args.path,
          };
        }

        if (isExternal(args.path)) {
          return { external: true, path: args.path };
        }

        return null;
      });

      build.onResolve({ filter: /.*/ }, async (args) => {
        const resolvedPath = await npmManager.resolveModulePath(args.path, args.importer || '');
        if (resolvedPath) {
          return { path: resolvedPath, namespace: 'opfsNamespace' };
        }
        return null;
      });

      build.onLoad({ filter: /.*/, namespace: 'opfsNamespace' }, async (args) => {
        const fileBlob = npmManager.readModuleFile(args.path);
        if (!fileBlob) {
          return { errors: [{ text: `Module not found: ${args.path}` }] };
        }
        const fileText = await fileBlob.text();
        return { contents: fileText, loader: inferLoader(args.path) };
      });
    },
  };
}

export function extname(path: string): string {
  const m = /(\.[a-zA-Z0-9]+)$/.exec(path);
  return m ? m[1] : '';
}

function inferLoader(p: string): Loader {
  const ext = extname(p);
  if (RESOLVE_EXTENSIONS.includes(ext)) {
    return ext.slice(1) as Loader;
  }
  if (ext === '.mjs' || ext === '.cjs') {
    return 'js';
  }
  return 'text';
}

export function formatBuildErrors(errors: PartialMessage[]) {
  return formatMessages(errors, { kind: 'error' }).then((res) => res.join('\n\n'));
}
