// AI and Heuristic Processing Module for Smart Document Studio

const BASE_URL = '/api';

export async function convertRawText(text, templateTheme = 'default') {
  try {
    const res = await fetch(`${BASE_URL}/ai/convert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, theme: templateTheme })
    });
    if (!res.ok) throw new Error('API conversion failed');
    return await res.json(); // { html, title }
  } catch (err) {
    console.warn('API text converter failed. Falling back to local JS converter.', err);
    return localConvertRawText(text);
  }
}

export async function enhanceText(text, mode, apiKey = '', provider = 'openai') {
  // If user provides a key, they can run real AI completions
  // We can pass the key in the payload. The FastAPI backend will handle it, 
  // or fall back to local rule-based completions.
  try {
    const res = await fetch(`${BASE_URL}/ai/enhance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, mode, api_key: apiKey, provider })
    });
    if (!res.ok) throw new Error('API enhancement failed');
    const data = await res.json();
    return data.text;
  } catch (err) {
    console.warn('API text enhancer failed. Falling back to local JS rewriter.', err);
    return localEnhanceText(text, mode);
  }
}

// Client-Side Citation Generator
export function generateCitationString(format, data) {
  const author = data.author || 'Doe, J.';
  const year = data.year || '2026';
  const title = data.title || 'Untitled Work';
  const publisher = data.publisher || 'Tech Press';
  const url = data.url || '';
  
  if (format === 'apa') {
    return `${author} (${year}). <em>${title}</em>. ${publisher}.${url ? ` Retrieved from ${url}` : ''}`;
  } else if (format === 'mla') {
    return `${author}. <em>${title}</em>. ${publisher}, ${year}.${url ? ` ${url}.` : ''}`;
  } else if (format === 'chicago') {
    return `${author}. ${year}. <em>${title}</em>. ${publisher}.${url ? ` ${url}.` : ''}`;
  }
  return `${author}. "${title}," ${year}.`;
}

// Client-Side Table of Contents Generator
export function generateTableOfContents(headings) {
  if (!headings || headings.length === 0) {
    return '<p class="text-slate-400 italic">No headings found to generate Table of Contents.</p>';
  }
  
  let html = '<div class="toc-container p-4 bg-slate-50 border rounded-lg my-6" contenteditable="false">';
  html += '<h3 class="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wider">Table of Contents</h3>';
  html += '<ul class="space-y-1 text-xs">';
  
  headings.forEach(h => {
    const level = parseInt(h.tagName.substring(1));
    const text = h.textContent.trim();
    const anchor = h.id || text.toLowerCase().replace(/[^\w]/g, '-');
    h.id = anchor; // Ensure target has id
    
    const padding = (level - 1) * 16;
    html += `<li style="padding-left: ${padding}px;" class="flex items-center justify-between group">
      <a href="#${anchor}" class="text-brand-500 hover:underline font-medium">${text}</a>
      <span class="border-b border-dotted border-slate-300 flex-1 mx-2 mt-2 h-0"></span>
      <span class="text-slate-400">Page ${h.pageNumber || 1}</span>
    </li>`;
  });
  
  html += '</ul></div>';
  return html;
}

// Client-side syllable counter for Flesch-Kincaid Readability
function countSyllables(word) {
  word = word.toLowerCase();
  if (word.length <= 3) return 1;
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');
  const syllables = word.match(/[aeiouy]{1,2}/g);
  return syllables ? syllables.length : 1;
}

// Client-Side Readability and Analytics calculator
export function analyzeDocumentText(htmlContent) {
  // Strip tags to get plain text
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;
  const plainText = tempDiv.textContent || tempDiv.innerText || '';
  
  const charCount = plainText.length;
  const words = plainText.trim().split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;
  
  // Sentences guess
  const sentences = plainText.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const sentenceCount = sentences.length || 1;
  
  // Syllables count
  let syllableCount = 0;
  words.forEach(w => {
    syllableCount += countSyllables(w.replace(/[^\w]/g, ''));
  });
  
  // Flesch Reading Ease Formula
  // 206.835 - 1.015 * (words/sentences) - 84.6 * (syllables/words)
  let readabilityScore = 100;
  if (wordCount > 0) {
    readabilityScore = 206.835 - 1.015 * (wordCount / sentenceCount) - 84.6 * (syllableCount / wordCount);
    readabilityScore = Math.max(0, Math.min(100, Math.round(readabilityScore)));
  }
  
  // Readability Interpretation
  let gradeLevel = 'Easy';
  if (readabilityScore < 30) gradeLevel = 'Academic (Very Hard)';
  else if (readabilityScore < 50) gradeLevel = 'College Level (Hard)';
  else if (readabilityScore < 60) gradeLevel = 'High School (Fairly Hard)';
  else if (readabilityScore < 70) gradeLevel = 'Plain English (Medium)';
  else if (readabilityScore < 80) gradeLevel = 'Conversational (Easy)';
  else gradeLevel = 'Elementary (Very Easy)';
  
  // Estimated Reading time: Avg 200 WPM
  const readingTime = Math.max(1, Math.round(wordCount / 200));
  
  return {
    wordCount,
    charCount,
    sentenceCount,
    readabilityScore,
    gradeLevel,
    readingTime
  };
}

// Client-Side Fallback Converter (same logic as Backend for completeness/offline resilience)
function localConvertRawText(rawText) {
  if (!rawText.trim()) return { html: '', title: 'Untitled Document' };
  
  const lines = rawText.split('\n').map(l => l.trimRight());
  let title = 'Untitled Document';
  const firstNonEmpty = lines.find(l => l.trim().length > 0);
  if (firstNonEmpty) {
    title = firstNonEmpty.replace(/^#+\s*/, '').trim().substring(0, 50);
  }
  
  const htmlOut = [];
  let inList = false;
  let listType = null;
  let inTable = false;
  let tableHeaders = [];
  let tableRows = [];
  let inCode = false;
  let codeBlock = [];
  
  let i = 0;
  while (i < lines.length) {
    let line = lines[i];
    let stripped = line.trim();
    
    if (stripped.startsWith('```')) {
      if (inCode) {
        inCode = false;
        htmlOut.append(`<pre><code>${codeBlock.join('<br>')}</code></pre>`);
        codeBlock = [];
      } else {
        inCode = true;
      }
      i++;
      continue;
    }
    
    if (inCode) {
      codeBlock.push(line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'));
      i++;
      continue;
    }
    
    if (stripped.startsWith('|') && stripped.endsWith('|')) {
      const cells = stripped.split('|').map(c => c.trim()).filter((c, idx, arr) => idx > 0 && idx < arr.length - 1);
      if (!inTable) {
        let nextIsDivider = false;
        if (i + 1 < lines.length) {
          const nextStr = lines[i+1].trim();
          if (nextStr.startsWith('|') && nextStr.replace(/[|\-\s:.]/g, '').length === 0) {
            nextIsDivider = true;
          }
        }
        if (nextIsDivider) {
          inTable = true;
          tableHeaders = cells;
          i += 2;
          continue;
        }
      } else {
        tableRows.push(cells);
        i++;
        continue;
      }
    } else if (inTable) {
      let tHtml = '<table><thead><tr>';
      tableHeaders.forEach(h => { tHtml += `<th>${h}</th>`; });
      tHtml += '</tr></thead><tbody>';
      tableRows.forEach(row => {
        tHtml += '<tr>';
        row.forEach(c => { tHtml += `<td>${c}</td>`; });
        tHtml += '</tr>';
      });
      tHtml += '</tbody></table>';
      htmlOut.push(tHtml);
      inTable = false;
      tableHeaders = [];
      tableRows = [];
      continue;
    }
    
    const ulMatch = stripped.match(/^[\*\-\+]\s+(.*)$/);
    const olMatch = stripped.match(/^(\d+)\.\s+(.*)$/);
    
    if (ulMatch) {
      if (!inList) {
        inList = true;
        listType = 'ul';
        htmlOut.push('<ul>');
      } else if (listType === 'ol') {
        htmlOut.push('</ol><ul>');
        listType = 'ul';
      }
      htmlOut.push(`<li>${ulMatch[1]}</li>`);
      i++;
      continue;
    } else if (olMatch) {
      if (!inList) {
        inList = true;
        listType = 'ol';
        htmlOut.push('<ol>');
      } else if (listType === 'ul') {
        htmlOut.push('</ul><ol>');
        listType = 'ol';
      }
      htmlOut.push(`<li>${olMatch[2]}</li>`);
      i++;
      continue;
    } else {
      if (inList) {
        htmlOut.push(listType === 'ul' ? '</ul>' : '</ol>');
        inList = false;
      }
    }
    
    const headingMatch = stripped.match(/^(#+)\s+(.*)$/);
    if (headingMatch) {
      const lvl = Math.min(6, headingMatch[1].length);
      htmlOut.push(`<h${lvl}>${headingMatch[2]}</h${lvl}>`);
      i++;
      continue;
    }
    
    const quoteMatch = stripped.match(/^>\s*(.*)$/);
    if (quoteMatch) {
      let qLines = [quoteMatch[1]];
      while (i + 1 < lines.length && lines[i+1].trim().startsWith('>')) {
        i++;
        qLines.push(lines[i].trim().substring(1).trim());
      }
      htmlOut.push(`<blockquote><p>${qLines.join(' ')}</p></blockquote>`);
      i++;
      continue;
    }
    
    if (stripped === '---' || stripped === '***' || stripped === '___') {
      htmlOut.push('<hr>');
      i++;
      continue;
    }
    
    if (stripped) {
      let styled = stripped
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>');
      htmlOut.push(`<p>${styled}</p>`);
    }
    i++;
  }
  
  if (inList) htmlOut.push(listType === 'ul' ? '</ul>' : '</ol>');
  if (inTable) {
    let tHtml = '<table><thead><tr>';
    tableHeaders.forEach(h => { tHtml += `<th>${h}</th>`; });
    tHtml += '</tr></thead><tbody>';
    tableRows.forEach(row => {
      tHtml += '<tr>';
      row.forEach(c => { tHtml += `<td>${c}</td>`; });
      tHtml += '</tr>';
    });
    tHtml += '</tbody></table>';
    htmlOut.push(tHtml);
  }
  
  return { html: htmlOut.join('\n'), title };
}

// Client-Side Fallback Enhancer
function localEnhanceText(text, mode) {
  const temp = document.createElement('div');
  temp.innerHTML = text;
  let raw = temp.textContent || temp.innerText || '';
  
  if (mode === 'grammar') {
    raw = raw.replace(/\bteh\b/g, 'the')
             .replace(/\bseperate\b/g, 'separate')
             .replace(/\brecieve\b/g, 'receive')
             .replace(/\bdont\b/g, "don't")
             .replace(/\bcant\b/g, "can't");
    return text.includes('<') ? `<p>${raw}</p>` : raw;
  }
  
  if (mode === 'professional') {
    return `Effective immediately, it is critical to observe that: ${raw.replace(/\bget\b/gi, 'acquire').replace(/\bmake\b/gi, 'generate')}`;
  }
  
  if (mode === 'academic') {
    return `Consequently, empirical evidence dictates that ${raw.replace(/\ba lot of\b/gi, 'a substantial volume of').replace(/\bvery\b/gi, 'significantly')}`;
  }
  
  if (mode === 'summarize') {
    return `Summary Point: ${raw.substring(0, 100)}...`;
  }
  
  if (mode === 'expand') {
    return `${raw} Furthermore, this element is highly essential to optimize efficiency in modern structural setups.`;
  }
  
  if (mode === 'shorten') {
    return `${raw.substring(0, Math.max(15, raw.length / 2))}...`;
  }
  
  return text;
}
