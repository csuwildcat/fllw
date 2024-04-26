
import { css, unsafeCSS } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';

import { Viewer } from 'bytemd'
import gfm from '@bytemd/plugin-gfm'
import math from '@bytemd/plugin-math'
import breaks from '@bytemd/plugin-breaks'
import gemoji from '@bytemd/plugin-gemoji'
import mermaid from './mermaid-plugin'
import highlight from '@bytemd/plugin-highlight'

import BaseStyles from 'bytemd/dist/index.css' with { type: 'css' };
import MathStyles from 'katex/dist/katex.css' with { type: 'css' };
import HighlightStyles from 'highlight.js/styles/atom-one-dark.css' with { type: 'css' };
import GithubStyles from 'github-markdown-css/github-markdown.css' with { type: 'css' };

export const styles = css`${unsafeCSS([
  BaseStyles,
  MathStyles,
  HighlightStyles,
  GithubStyles,
  `
    .markdown-body {
      font-family: unset;
      background: none;
    }
  `
].join(''))}`

export const plugins = [
  gfm(),
  math({
    katexOptions: { output: 'html' }, // https://github.com/KaTeX/KaTeX/issues/2796
  }),
  breaks(),
  gemoji(),
  mermaid(),
  highlight()
]

export function render(markdown){
  const div = document.createElement('div');
  new Viewer({
    target: div,
    props: {
      value: markdown,
      plugins: plugins
    }
  })
  return div.firstElementChild;
}
