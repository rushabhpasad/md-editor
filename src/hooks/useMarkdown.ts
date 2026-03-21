import { useState, useEffect } from 'react';
import { marked } from 'marked';
import hljs from 'highlight.js';

marked.setOptions({ gfm: true, breaks: true });

function buildRenderer(filePath: string | null) {
  const renderer = new marked.Renderer();

  renderer.code = ({ text, lang }) => {
    const language = lang && hljs.getLanguage(lang) ? lang : 'plaintext';
    const highlighted = hljs.highlight(text, { language }).value;
    return `<pre><code class="hljs language-${language}">${highlighted}</code></pre>`;
  };

  renderer.image = ({ href, text, title }) => {
    let src = href || '';
    // Resolve relative paths against the currently open file's directory
    if (filePath && src && !/^(https?:|data:|\/|file:)/.test(src)) {
      const dir = filePath.replace(/[/\\][^/\\]+$/, '');
      src = `file://${dir}/${src}`;
    }
    const titleAttr = title ? ` title="${title}"` : '';
    return `<img src="${src}" alt="${text}"${titleAttr} style="max-width:100%">`;
  };

  return renderer;
}

export function useMarkdown(content: string, filePath: string | null): string {
  const [html, setHtml] = useState(() => {
    try {
      return marked.parse(content, { renderer: buildRenderer(filePath) }) as string;
    } catch {
      return '';
    }
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        setHtml(marked.parse(content, { renderer: buildRenderer(filePath) }) as string);
      } catch {
        setHtml('<p>Error rendering markdown</p>');
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [content, filePath]);

  return html;
}
