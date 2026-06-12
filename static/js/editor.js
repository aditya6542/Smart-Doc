// TipTap Rich Text Editor Configuration and Handler

import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import FontFamily from '@tiptap/extension-font-family';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Placeholder from '@tiptap/extension-placeholder';

let editor = null;

export function getEditorInstance() {
  return editor;
}

export function initEditor(targetEl, onChange, onSelection) {
  if (editor) {
    editor.destroy();
  }

  editor = new Editor({
    element: targetEl,
    extensions: [
      StarterKit.configure({
        // Configure default elements
        bulletList: { keepMarks: true },
        orderedList: { keepMarks: true }
      }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      FontFamily,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'text-brand-500 hover:underline cursor-pointer' }
      }),
      Image.configure({
        inline: true,
        HTMLAttributes: { class: 'mx-auto max-w-full rounded-lg my-4' }
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: { class: 'border-collapse border border-slate-300 w-full my-4' }
      }),
      TableRow,
      TableCell,
      TableHeader,
      TaskList,
      TaskItem.configure({
        nested: true,
        HTMLAttributes: { class: 'flex items-start gap-2 my-1' }
      }),
      Placeholder.configure({
        placeholder: 'Type plain text or load a template to begin writing...'
      })
    ],
    content: '<p></p>',
    onUpdate({ editor }) {
      if (onChange) onChange(editor.getHTML(), editor.getJSON());
      updateFloatingMenus();
      simulatePageBreaks();
    },
    onSelectionUpdate({ editor }) {
      if (onSelection) onSelection(editor);
      updateFloatingMenus();
    }
  });

  setupToolbarListeners();
  return editor;
}

// Custom Font Size Applier using textStyle span inline styling
export function setFontSize(size) {
  if (!editor) return;
  editor.chain().focus().setMark('textStyle', { fontSize: size }).run();
  
  // Custom execution to apply inline style tag on current textStyle mark
  const { state, dispatch } = editor.view;
  const { from, to } = state.selection;
  state.doc.nodesBetween(from, to, (node, pos) => {
    // Add font size styles to DOM elements
  });
}

// Setup listeners for toolbar buttons
function setupToolbarListeners() {
  const binds = [
    { id: 'tbUndo', action: () => editor.chain().focus().undo().run() },
    { id: 'tbRedo', action: () => editor.chain().focus().redo().run() },
    { id: 'tbBold', action: () => editor.chain().focus().toggleBold().run() },
    { id: 'tbItalic', action: () => editor.chain().focus().toggleItalic().run() },
    { id: 'tbUnderline', action: () => editor.chain().focus().toggleUnderline().run() },
    { id: 'tbStrike', action: () => editor.chain().focus().toggleStrike().run() },
    { id: 'tbAlignLeft', action: () => editor.chain().focus().setTextAlign('left').run() },
    { id: 'tbAlignCenter', action: () => editor.chain().focus().setTextAlign('center').run() },
    { id: 'tbAlignRight', action: () => editor.chain().focus().setTextAlign('right').run() },
    { id: 'tbAlignJustify', action: () => editor.chain().focus().setTextAlign('justify').run() },
    { id: 'tbBulletList', action: () => editor.chain().focus().toggleBulletList().run() },
    { id: 'tbOrderedList', action: () => editor.chain().focus().toggleOrderedList().run() },
    { id: 'tbTaskList', action: () => editor.chain().focus().toggleTaskList().run() },
    { id: 'tbOutdent', action: () => editor.chain().focus().lift('listItem').run() },
    { id: 'tbIndent', action: () => editor.chain().focus().sink('listItem').run() },
    { id: 'tbAddDivider', action: () => editor.chain().focus().setHorizontalRule().run() },
    
    // Table insertions
    { id: 'tbAddTable', action: () => {
      window.dispatchEvent(new CustomEvent('open-table-modal'));
    }},
    { id: 'tblAddColBefore', action: () => editor.chain().focus().addColumnBefore().run() },
    { id: 'tblAddColAfter', action: () => editor.chain().focus().addColumnAfter().run() },
    { id: 'tblDelCol', action: () => editor.chain().focus().deleteColumn().run() },
    { id: 'tblAddRowBefore', action: () => editor.chain().focus().addRowBefore().run() },
    { id: 'tblAddRowAfter', action: () => editor.chain().focus().addRowAfter().run() },
    { id: 'tblDelRow', action: () => editor.chain().focus().deleteRow().run() },
    { id: 'tblDelete', action: () => editor.chain().focus().deleteTable().run() }
  ];

  binds.forEach(b => {
    const el = document.getElementById(b.id);
    if (el) {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        if (editor) b.action();
      });
    }
  });

  // Fonts Family dropdown listener
  const fontDropdown = document.getElementById('tbFontFamily');
  if (fontDropdown) {
    fontDropdown.addEventListener('change', () => {
      const font = fontDropdown.value;
      editor.chain().focus().setFontFamily(font).run();
    });
  }

  // Font Size dropdown
  const sizeDropdown = document.getElementById('tbFontSize');
  if (sizeDropdown) {
    sizeDropdown.addEventListener('change', () => {
      const size = sizeDropdown.value;
      // Inject inline font size via stylesheet markup on target node
      editor.chain().focus().setMark('textStyle', { fontSize: size }).run();
      
      // Update DOM selection styling directly
      const activeMark = editor.state.schema.marks.textStyle;
      if (activeMark) {
        editor.view.focus();
        document.execCommand('fontSize', false, '3'); // standard fallback
        const spans = editor.view.dom.querySelectorAll('span');
        spans.forEach(span => {
          if (span.style.fontSize === '' && span.getAttribute('size') === '3') {
            span.removeAttribute('size');
            span.style.fontSize = size;
          }
        });
      }
    });
  }

  // Text Color Picker click trigger
  const colorBtn = document.getElementById('tbColorBtn');
  const colorPicker = document.getElementById('tbColorPicker');
  if (colorBtn && colorPicker) {
    colorBtn.addEventListener('click', () => colorPicker.click());
    colorPicker.addEventListener('input', () => {
      const color = colorPicker.value;
      editor.chain().focus().setColor(color).run();
    });
  }

  // Text Highlight color picker click trigger
  const highlightBtn = document.getElementById('tbHighlightBtn');
  const highlightPicker = document.getElementById('tbHighlightPicker');
  if (highlightBtn && highlightPicker) {
    highlightBtn.addEventListener('click', () => highlightPicker.click());
    highlightPicker.addEventListener('input', () => {
      const color = highlightPicker.value;
      editor.chain().focus().setHighlight({ color: color }).run();
    });
  }

  // Link Insertion Dialog
  const linkBtn = document.getElementById('tbAddLink');
  if (linkBtn) {
    linkBtn.addEventListener('click', () => {
      const prevUrl = editor.getAttributes('link').href;
      const url = prompt('Enter Hyperlink URL:', prevUrl || 'https://');
      if (url === null) return;
      if (url === '') {
        editor.chain().focus().extendMarkRange('link').unsetLink().run();
      } else {
        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
      }
    });
  }

  // Image Insertion Dialog
  const imgBtn = document.getElementById('tbAddImage');
  if (imgBtn) {
    imgBtn.addEventListener('click', () => {
      const url = prompt('Enter Image URL:', 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800');
      if (url) {
        editor.chain().focus().setImage({ src: url }).run();
      }
    });
  }
}

// Show/Hide Floating Bubble Menus depending on context
function updateFloatingMenus() {
  if (!editor || !editor.view) return;

  const { state } = editor;
  const { selection } = state;
  const { from, to, empty } = selection;

  // 1. Table Operations Floating menu
  const tableMenu = document.getElementById('tableBubbleMenu');
  const isTableActive = editor.isActive('table');
  
  if (isTableActive && tableMenu) {
    tableMenu.classList.remove('hidden');
    // Align menu over selected table cell node
    const node = editor.view.domAtPos(from).node;
    const cellEl = node.nodeType === Node.TEXT_NODE ? node.parentNode.closest('td, th') : node.closest('td, th');
    if (cellEl) {
      const rect = cellEl.getBoundingClientRect();
      const viewportRect = document.getElementById('editorViewport').getBoundingClientRect();
      const scrollEl = document.getElementById('editorViewport');
      
      tableMenu.style.top = `${scrollEl.scrollTop + rect.top - viewportRect.top - tableMenu.offsetHeight - 6}px`;
      tableMenu.style.left = `${scrollEl.scrollLeft + rect.left - viewportRect.left + (rect.width/2) - (tableMenu.offsetWidth/2)}px`;
    }
  } else if (tableMenu) {
    tableMenu.classList.add('hidden');
  }

  // 2. AI Enhancements Popover Menu (when text is highlighted)
  const aiMenu = document.getElementById('aiTextBubbleMenu');
  
  if (!empty && (to - from > 2) && aiMenu && !isTableActive) {
    aiMenu.classList.remove('hidden');
    
    // Get selection client rect coordinates
    const range = window.getSelection().getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const viewportRect = document.getElementById('editorViewport').getBoundingClientRect();
    const scrollEl = document.getElementById('editorViewport');
    
    aiMenu.style.top = `${scrollEl.scrollTop + rect.top - viewportRect.top - aiMenu.offsetHeight - 10}px`;
    aiMenu.style.left = `${scrollEl.scrollLeft + rect.left - viewportRect.left + (rect.width/2) - (aiMenu.offsetWidth/2)}px`;
  } else if (aiMenu) {
    aiMenu.classList.add('hidden');
  }
}

// Page Break Indicators Simulation
// Scans editor nodes, computes visual page heights, overlays dashed breaks
export function simulatePageBreaks() {
  const pageContainer = document.getElementById('editorPage');
  if (!pageContainer) return;
  
  // Clear old page breaks
  pageContainer.querySelectorAll('.page-break-line').forEach(el => el.remove());
  
  const contentHeight = pageContainer.scrollHeight;
  const isLandscape = pageContainer.classList.contains('landscape');
  
  // Height of A4 page in pixels (excluding margins space vertically for visualization)
  // ~1050px standard height for portrait, ~720px for landscape at 96 DPI
  const pagePixHeight = isLandscape ? 720 : 1050;
  
  if (contentHeight > pagePixHeight) {
    const children = Array.from(pageContainer.querySelector('.ProseMirror').childNodes);
    let currentHeight = 0;
    
    children.forEach(child => {
      if (child.nodeType !== Node.ELEMENT_NODE) return;
      
      const rect = child.getBoundingClientRect();
      currentHeight += rect.height;
      
      // If element height wraps past page boundary, insert virtual break indicator
      if (currentHeight >= pagePixHeight) {
        const breakEl = document.createElement('div');
        breakEl.className = 'page-break-line';
        breakEl.setAttribute('contenteditable', 'false');
        
        // Insert break before or after node depending on proximity
        child.parentNode.insertBefore(breakEl, child.nextSibling);
        currentHeight = 0; // reset counter for next page
      }
    });
  }
}
