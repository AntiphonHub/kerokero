const fs = require('fs');

function patchCodeFrame(filePath) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(
    /options\.color = options\.color \? 'always' : 'never';/g,
    "options.color = options.color ? 'Error' : 'None';"
  );
  if (!content.includes('try {')) {
    content = content.replace(
      'return (0, _swc.getBindingsSync)().codeFrameColumns(file, location, options);',
      'try { return (0, _swc.getBindingsSync)().codeFrameColumns(file, location, options) || ""; } catch { return ""; }'
    );
    content = content.replace(
      'return getBindingsSync().codeFrameColumns(file, location, options);',
      'try { return getBindingsSync().codeFrameColumns(file, location, options) || ""; } catch { return ""; }'
    );
  }
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Patched', filePath);
}

patchCodeFrame('node_modules/next/dist/shared/lib/errors/code-frame.js');
patchCodeFrame('node_modules/next/dist/esm/shared/lib/errors/code-frame.js');

const swcPath = 'node_modules/next/dist/build/swc/index.js';
if (fs.existsSync(swcPath)) {
  let swc = fs.readFileSync(swcPath, 'utf8');
  if (!swc.includes('// PATCHED_CODE_FRAME')) {
    swc = swc.replace(
      'return rawBindings.codeFrameColumns(Buffer.from(source), location, options);',
      `// PATCHED_CODE_FRAME
            try {
                let opt = options;
                if (opt && typeof opt.color === 'boolean') {
                    opt = { ...opt, color: opt.color ? 'Error' : 'None' };
                }
                return rawBindings.codeFrameColumns(Buffer.from(source), location, opt);
            } catch {
                return '';
            }`
    );
    swc = swc.replace(
      'return bindings.codeFrameColumns(source, location, options) ?? undefined;',
      `// PATCHED_CODE_FRAME
                try {
                    let opt = options;
                    if (opt && typeof opt.color === 'boolean') {
                        opt = { ...opt, color: opt.color ? 'Error' : 'None' };
                    }
                    return bindings.codeFrameColumns(source, location, opt) ?? undefined;
                } catch {
                    return undefined;
                }`
    );
    fs.writeFileSync(swcPath, swc, 'utf8');
    console.log('Patched swc/index.js');
  }
}
