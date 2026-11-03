import test from 'node:test';
import assert from 'node:assert/strict';
import {
  autolink,
  code,
  fixSuggestion,
  formatPath,
  plainText,
} from '../src/render/format.js';

test('plainText 处理会破坏 markdown/HTML 的字符与换行', () => {
  assert.equal(plainText('a<b>c|d`e\nf'), 'a‹b›c｜d\'e f');
  assert.equal(plainText(null), '');
  assert.equal(plainText(123), '123');
});

test('code 生成行内代码，并保留版本范围里的尖括号', () => {
  assert.equal(code('lodash'), '`lodash`');
  assert.equal(code('<4.17.21'), '`<4.17.21`');
  assert.equal(code(''), '');
  assert.equal(code(undefined), '');
});

test('autolink 只对 http(s) 地址生效', () => {
  assert.equal(autolink('https://example.com/a(b)'), '<https://example.com/a(b)>');
  assert.equal(autolink('not a url'), 'not a url');
});

test('formatPath 拼回工程绝对路径', () => {
  assert.equal(formatPath('node_modules/lodash', '/demo/'), '/demo/node_modules/lodash');
  assert.equal(formatPath('.', '/demo'), '/demo');
  assert.equal(formatPath('node_modules/lodash', null), 'node_modules/lodash');
});

test('fixSuggestion 覆盖有修复、无修复、跨大版本', () => {
  assert.equal(
    fixSuggestion({ name: 'lodash', version: '4.17.21', isSemVerMajor: false }),
    '升级到 lodash@4.17.21'
  );
  assert.match(
    fixSuggestion({ name: 'ejs', version: '4.0.0', isSemVerMajor: true }),
    /跨大版本/
  );
  assert.equal(fixSuggestion(false), '暂无可用修复');
  assert.equal(fixSuggestion(null), '暂无可用修复');
  assert.equal(fixSuggestion(true), '可用 `npm audit fix` 修复');
});
