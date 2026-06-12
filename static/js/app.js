// Main App Controller and State Coordinator for Smart Document Studio

import { 
  getDocuments, getDocument, saveDocument, deleteDocument, 
  duplicateDocument, getDocumentVersions, restoreDocumentVersion,
  clearAllDocuments
} from './db.js';
import { TEMPLATES, TEMPLATE_CATEGORIES, getTemplateById } from './templates.js';
import { initEditor, getEditorInstance, simulatePageBreaks } from './editor.js';
import { 
  convertRawText, enhanceText, generateCitationString, 
  generateTableOfContents, analyzeDocumentText 
} from './ai.js';
import { 
  exportToPDFCanvas, exportToPDFText, exportToDOCX, 
  exportToHTML, exportToMarkdown, exportToTXT 
} from './exporter.js';
import { 
  updateWatermark, getCoverPageHTML, SignatureDrawer, createQRCodeImage 
} from './branding.js';
import { 
  renderCommentsFeed, acceptAllSuggestions, rejectAllSuggestions, 
  handleSuggestionHighlights 
} from './collaboration.js';

// Application State
let currentDoc = null;
let allDocs = [];
let zoomLevel = 100;
let isDarkTheme = false;
let sigDrawer = null;
let autoSaveTimer = null;

// Initial Setup on DOM Content Loaded
document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

async function initApp() {
  // Initialize Lucide Icons
  lucide.createIcons();
  
  // Theme check
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
    isDarkTheme = true;
    document.getElementById('themeIcon').setAttribute('data-lucide', 'sun');
  }
  
  // Initialize Editor on the page element
  initEditor(document.querySelector('.ProseMirror') || document.getElementById('editorPage'), onEditorChange, onEditorSelection);
  
  // Set up Signature Canvas Drawer
  const sigCanvas = document.getElementById('sigCanvas');
  if (sigCanvas) {
    sigDrawer = new SignatureDrawer(sigCanvas);
  }

  // Load and Render Templates Library
  renderTemplatesLibrary();

  // Load Documents from Database/LocalStorage
  await loadDocumentsList();

  // Register Global Event Listeners
  registerEventListeners();

  // Start autosave ticker
  startAutoSaveTimer();
  
  // Initialize drag & drop support
  setupDragAndDrop();
}

// Fetch documents and render dashboard
async function loadDocumentsList() {
  try {
    allDocs = await getDocuments();
    renderDocsGrid();
    renderSidebarRecentDocs();
    updateDashboardStats();
  } catch (err) {
    console.error('Error loading documents list', err);
  }
}

// Render Templates in Dashboard & Modals
function renderTemplatesLibrary() {
  const grid = document.getElementById('recentTemplatesGrid');
  const modalGrid = document.getElementById('modalTemplatesGrid');
  const catNav = document.getElementById('templateModalCategories');
  
  if (!grid || !modalGrid) return;
  
  // Render quick presets on dashboard
  grid.innerHTML = '';
  // Show first 6 templates
  TEMPLATES.slice(0, 6).forEach(temp => {
    const card = document.createElement('div');
    card.className = 'glass-card p-4 hover:border-brand-500 hover:shadow-md cursor-pointer transition-all flex flex-col justify-between h-40 text-left';
    card.innerHTML = `
      <div>
        <div class="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-900/20 text-brand-500 flex items-center justify-center mb-3">
          <i data-lucide="file-text" class="w-4.5 h-4.5"></i>
        </div>
        <h4 class="text-xs font-bold text-slate-800 dark:text-white line-clamp-1">${temp.name}</h4>
        <p class="text-[10px] text-slate-400 mt-1 line-clamp-2">${temp.description}</p>
      </div>
      <span class="text-[9px] text-brand-500 font-bold uppercase tracking-wider mt-2 block">Use Preset</span>
    `;
    card.addEventListener('click', () => createNewDocumentFromTemplate(temp.id));
    grid.appendChild(card);
  });

  // Render categories for modal sidebar
  if (catNav) {
    catNav.innerHTML = `<button class="modal-cat-btn active text-xs font-semibold px-4 py-2 bg-brand-50 text-brand-500 dark:bg-brand-900/20 rounded-lg text-left" data-category="all">All Presets</button>`;
    TEMPLATE_CATEGORIES.forEach(cat => {
      catNav.innerHTML += `<button class="modal-cat-btn text-xs font-semibold px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg text-left text-slate-600 dark:text-slate-400" data-category="${cat.id}">${cat.name}</button>`;
    });
    
    // Category click listeners
    catNav.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', (e) => {
        catNav.querySelectorAll('button').forEach(b => b.className = 'modal-cat-btn text-xs font-semibold px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg text-left text-slate-600 dark:text-slate-400');
        btn.className = 'modal-cat-btn active text-xs font-semibold px-4 py-2 bg-brand-50 text-brand-500 dark:bg-brand-900/20 rounded-lg text-left';
        renderModalTemplatesGrid(btn.dataset.category);
      });
    });
  }
  
  renderModalTemplatesGrid('all');
  lucide.createIcons();
}

function renderModalTemplatesGrid(category) {
  const modalGrid = document.getElementById('modalTemplatesGrid');
  if (!modalGrid) return;
  modalGrid.innerHTML = '';
  
  const filtered = category === 'all' ? TEMPLATES : TEMPLATES.filter(t => t.category === category);
  
  filtered.forEach(temp => {
    const card = document.createElement('div');
    card.className = 'border border-slate-100 dark:border-slate-800 hover:border-brand-500 bg-white/50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-900 p-4 rounded-xl cursor-pointer transition-all flex flex-col justify-between h-40 text-left hover:shadow-md';
    card.innerHTML = `
      <div>
        <h4 class="text-xs font-bold text-slate-800 dark:text-white">${temp.name}</h4>
        <p class="text-[10px] text-slate-400 mt-2 line-clamp-3">${temp.description}</p>
      </div>
      <div class="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/50">
        <span class="text-[9px] text-slate-400 uppercase font-semibold">${temp.category}</span>
        <span class="text-[9px] text-brand-500 font-bold uppercase tracking-wider flex items-center gap-0.5">Create <i data-lucide="arrow-right" class="w-3 h-3"></i></span>
      </div>
    `;
    card.addEventListener('click', () => {
      createNewDocumentFromTemplate(temp.id);
      closeModal('modalTemplates');
    });
    modalGrid.appendChild(card);
  });
  
  lucide.createIcons();
}

// Render Dashboard Grid Library
function renderDocsGrid() {
  const container = document.getElementById('documentsGrid');
  if (!container) return;
  container.innerHTML = '';
  
  if (allDocs.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-16 text-center text-slate-400">
        <i data-lucide="folder-open" class="w-12 h-12 mx-auto mb-3 text-slate-300"></i>
        <p class="text-sm font-semibold">Your Studio is Empty</p>
        <span class="text-xs text-slate-400">Create a new document or quick-convert text to begin!</span>
      </div>
    `;
    lucide.createIcons();
    return;
  }
  
  allDocs.forEach(doc => {
    const card = document.createElement('div');
    card.className = 'glass-card hover:border-brand-300 transition-all duration-200 flex flex-col justify-between relative group text-left';
    
    const date = new Date(doc.updated_at);
    const dateStr = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    
    card.innerHTML = `
      <div class="p-5 cursor-pointer" onclick="window.loadStudioDoc('${doc.id}')">
        <!-- Icon & Dropdown -->
        <div class="flex items-center justify-between mb-4">
          <div class="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-900/20 text-brand-500 flex items-center justify-center">
            <i data-lucide="file-text" class="w-5 h-5"></i>
          </div>
          
          <!-- Actions Menu Dropdown -->
          <div class="relative inline-block text-left" onclick="event.stopPropagation()">
            <button class="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600" onclick="window.toggleCardMenu(event, '${doc.id}')">
              <i data-lucide="more-vertical" class="w-4.5 h-4.5"></i>
            </button>
            <div id="cardMenu_${doc.id}" class="hidden absolute right-0 mt-1 w-36 glass shadow-lg rounded-xl py-1 z-30 border border-slate-200/50">
              <button class="w-full text-left px-3 py-1.5 text-xs hover:bg-brand-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center gap-1.5" onclick="window.duplicateStudioDoc('${doc.id}')"><i data-lucide="copy" class="w-3.5 h-3.5"></i> Duplicate</button>
              <button class="w-full text-left px-3 py-1.5 text-xs hover:bg-brand-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center gap-1.5" onclick="window.renameStudioDoc('${doc.id}')"><i data-lucide="edit-3" class="w-3.5 h-3.5"></i> Rename</button>
              <button class="w-full text-left px-3 py-1.5 text-xs hover:bg-red-50 text-red-500 flex items-center gap-1.5" onclick="window.deleteStudioDoc('${doc.id}')"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i> Delete</button>
            </div>
          </div>
        </div>
        
        <h4 class="text-sm font-bold text-slate-800 dark:text-white mb-1 line-clamp-1">${doc.title}</h4>
        <p class="text-[10px] text-slate-400 mb-2">${doc.word_count || 0} words • ${doc.pageSize || 'A4'} ${doc.orientation || 'portrait'}</p>
      </div>
      <div class="px-5 py-3 border-t border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/10 rounded-b-xl flex items-center justify-between text-[10px] text-slate-400">
        <span>Modified ${dateStr}</span>
        <i data-lucide="arrow-right" class="w-3 h-3 text-transparent group-hover:text-brand-500 transition-all"></i>
      </div>
    `;
    
    container.appendChild(card);
  });
  
  lucide.createIcons();
}

// Populate Sidebar Document List
function renderSidebarRecentDocs() {
  const container = document.getElementById('sidebarDocList');
  if (!container) return;
  container.innerHTML = '';
  
  const clearBtn = document.getElementById('btnClearAllDocs');
  if (clearBtn) {
    if (allDocs.length > 0) {
      clearBtn.classList.remove('hidden');
    } else {
      clearBtn.classList.add('hidden');
    }
  }
  
  if (allDocs.length === 0) {
    container.innerHTML = `<p class="text-[10px] text-slate-400 dark:text-slate-500 px-2 py-1">No documents saved.</p>`;
    return;
  }
  
  allDocs.slice(0, 10).forEach(doc => {
    const activeClass = currentDoc && currentDoc.id === doc.id ? 'bg-brand-50 text-brand-500 dark:bg-brand-900/20' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40';
    const item = document.createElement('button');
    item.className = `w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg text-left transition-all ${activeClass}`;
    item.innerHTML = `
      <i data-lucide="file" class="w-4 h-4 shrink-0 text-slate-400"></i>
      <span class="truncate flex-1">${doc.title}</span>
    `;
    item.addEventListener('click', () => loadStudioDocument(doc.id));
    container.appendChild(item);
  });
  
  lucide.createIcons();
}

function updateDashboardStats() {
  const statDocs = document.getElementById('statTotalDocs');
  const statWords = document.getElementById('statTotalWords');
  if (statDocs) statDocs.textContent = allDocs.length;
  
  if (statWords) {
    const totalWords = allDocs.reduce((acc, doc) => acc + (doc.word_count || 0), 0);
    // abbreviate if huge
    statWords.textContent = totalWords > 1000 ? (totalWords / 1000).toFixed(1) + 'k' : totalWords;
  }
}

// Document actions from grid
window.toggleCardMenu = (event, docId) => {
  const menus = document.querySelectorAll('[id^="cardMenu_"]');
  menus.forEach(m => {
    if (m.id !== `cardMenu_${docId}`) m.classList.add('hidden');
  });
  const menu = document.getElementById(`cardMenu_${docId}`);
  if (menu) menu.classList.toggle('hidden');
};

window.loadStudioDoc = (id) => {
  loadStudioDocument(id);
};

window.duplicateStudioDoc = async (id) => {
  try {
    await duplicateDocument(id);
    await loadDocumentsList();
  } catch (err) {
    alert('Failed to duplicate document.');
  }
};

window.renameStudioDoc = async (id) => {
  const newName = prompt('Enter new document name:');
  if (newName && newName.trim()) {
    try {
      const doc = await getDocument(id);
      doc.title = newName.trim();
      await saveDocument(doc);
      await loadDocumentsList();
    } catch (err) {
      alert('Failed to rename document.');
    }
  }
};

window.deleteStudioDoc = async (id) => {
  if (confirm('Are you sure you want to delete this document? This cannot be undone.')) {
    try {
      await deleteDocument(id);
      if (currentDoc && currentDoc.id === id) {
        currentDoc = null;
        openView('viewDashboard');
      }
      await loadDocumentsList();
    } catch (err) {
      alert('Failed to delete document.');
    }
  }
};

// Document Creation & Load Workflow
async function createNewDocumentFromTemplate(templateId) {
  const temp = getTemplateById(templateId);
  const newId = Math.random().toString(36).substring(2, 15);
  
  let initialContent = '<p></p>';
  let initialStyles = {};
  let title = 'Untitled Document';
  
  if (temp) {
    initialContent = temp.content;
    initialStyles = temp.styles;
    title = `New ${temp.name}`;
  }

  const newDoc = {
    id: newId,
    title: title,
    content: initialContent,
    raw_text: '',
    styles: initialStyles,
    comments: [],
    versions: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  try {
    const saved = await saveDocument(newDoc, true, 'Template Initialized');
    await loadDocumentsList();
    loadStudioDocument(saved.id);
  } catch (err) {
    console.error('Failed to create new document', err);
    alert('Failed to create document.');
  }
}

async function loadStudioDocument(id) {
  try {
    currentDoc = await getDocument(id);
    openView('viewEditor');
    
    // Set title input
    const titleInput = document.getElementById('docTitleInput');
    if (titleInput) titleInput.value = currentDoc.title;
    
    // Set Editor Content in TipTap
    const editor = getEditorInstance();
    if (editor) {
      editor.commands.setContent(currentDoc.content);
    }
    
    // Apply layout theme and styles
    applyStylesToCanvas(currentDoc.styles);
    
    // Load comments
    renderComments();
    
    // Load versions list
    renderVersions();
    
    // Update word & reading metrics
    updateStatsText(currentDoc.content);
    
    // Update share link
    const shareInput = document.getElementById('shareLinkInput');
    if (shareInput) {
      shareInput.value = `${window.location.origin}/share/${currentDoc.id}`;
    }

    // Refresh sidebar highlights
    renderSidebarRecentDocs();
  } catch (err) {
    console.error('Failed to load document', err);
    alert('Error loading document.');
  }
}

// Save document changes
async function saveActiveDocument(createVersion = false, versionTitle = 'Auto-saved version') {
  if (!currentDoc) return;
  
  const editor = getEditorInstance();
  if (!editor) return;
  
  const statusEl = document.getElementById('saveStatus');
  if (statusEl) {
    statusEl.innerHTML = `<i data-lucide="loader" class="w-3.5 h-3.5 animate-spin"></i><span>Saving...</span>`;
    lucide.createIcons();
  }
  
  currentDoc.content = editor.getHTML();
  
  try {
    const updated = await saveDocument(currentDoc, createVersion, versionTitle);
    currentDoc.versions = updated.versions;
    currentDoc.updated_at = updated.updated_at;
    
    if (statusEl) {
      statusEl.innerHTML = `<i data-lucide="cloud-check" class="w-3.5 h-3.5 text-emerald-500"></i><span class="text-emerald-500">Saved</span>`;
      lucide.createIcons();
    }
    
    // Reload lists silently
    allDocs = await getDocuments();
    updateDashboardStats();
    renderSidebarRecentDocs();
    renderVersions();
  } catch (err) {
    console.error('Autosave error', err);
    if (statusEl) {
      statusEl.innerHTML = `<i data-lucide="alert-triangle" class="w-3.5 h-3.5 text-red-500"></i><span class="text-red-500">Offline (Draft)</span>`;
      lucide.createIcons();
    }
  }
}

// Styles configuration on Page canvas
function applyStylesToCanvas(styles) {
  if (!styles) return;
  
  const page = document.getElementById('editorPage');
  if (!page) return;
  
  // Theme layout class
  page.className = 'page-container'; // reset
  page.classList.add(`theme-${styles.themeColor || 'default'}`);
  
  // Custom font family overrides
  page.style.fontFamily = styles.fontFamily || 'Inter';
  
  // Font Size
  page.style.fontSize = styles.fontSize || '16px';
  
  // Line spacing
  page.style.lineHeight = styles.lineSpacing || '1.5';
  
  // Margins
  if (styles.margins) {
    page.style.paddingTop = styles.margins.top || '1in';
    page.style.paddingBottom = styles.margins.bottom || '1in';
    page.style.paddingLeft = styles.margins.left || '1in';
    page.style.paddingRight = styles.margins.right || '1in';
  }
  
  // Page size & orientation classes
  page.classList.add(`pageSize-${styles.pageSize || 'A4'}`);
  if (styles.orientation === 'landscape') {
    page.classList.add('landscape');
  } else {
    page.classList.remove('landscape');
  }
  
  // Update Watermark overlay
  updateWatermark(page, styles.watermarkText || '', styles.watermarkOpacity || 0.08, styles.watermarkAngle || -45);
  
  // Page header & footer overlay divs
  let headerDiv = page.querySelector('.page-header');
  let footerDiv = page.querySelector('.page-footer');
  
  if (styles.headerText) {
    if (!headerDiv) {
      headerDiv = document.createElement('div');
      headerDiv.className = 'page-header';
      page.appendChild(headerDiv);
    }
    headerDiv.innerHTML = `<span>${styles.headerText}</span><span></span>`;
    // position header relative to top margin
    headerDiv.style.left = styles.margins?.left || '1in';
    headerDiv.style.right = styles.margins?.right || '1in';
  } else if (headerDiv) {
    headerDiv.remove();
  }
  
  if (styles.footerText || styles.pageNumbers) {
    if (!footerDiv) {
      footerDiv = document.createElement('div');
      footerDiv.className = 'page-footer';
      page.appendChild(footerDiv);
    }
    footerDiv.innerHTML = `<span>${styles.footerText || ''}</span><span>${styles.pageNumbers ? 'Page 1' : ''}</span>`;
    footerDiv.style.left = styles.margins?.left || '1in';
    footerDiv.style.right = styles.margins?.right || '1in';
  } else if (footerDiv) {
    footerDiv.remove();
  }
  
  // Sync the form controls in sidebar layout if side layout is visible
  syncSidebarControls(styles);
  
  simulatePageBreaks();
}

function syncSidebarControls(styles) {
  const sizeSelect = document.getElementById('pageSizeSelect');
  const orientSelect = document.getElementById('pageOrientationSelect');
  const marginSelect = document.getElementById('pageMarginSelect');
  const watermarkInput = document.getElementById('watermarkTextInput');
  const watermarkOpacity = document.getElementById('watermarkOpacitySlider');
  const watermarkAngle = document.getElementById('watermarkAngleInput');
  const headerInput = document.getElementById('headerTextInput');
  const footerInput = document.getElementById('footerTextInput');
  const pageNumCheck = document.getElementById('togglePageNumbers');
  
  if (sizeSelect) sizeSelect.value = styles.pageSize || 'A4';
  if (orientSelect) orientSelect.value = styles.orientation || 'portrait';
  if (watermarkInput) watermarkInput.value = styles.watermarkText || '';
  if (watermarkOpacity) watermarkOpacity.value = styles.watermarkOpacity || 0.08;
  if (watermarkAngle) watermarkAngle.value = styles.watermarkAngle || -45;
  if (headerInput) headerInput.value = styles.headerText || '';
  if (footerInput) footerInput.value = styles.footerText || '';
  if (pageNumCheck) pageNumCheck.checked = styles.pageNumbers !== false;
  
  // Set theme active style buttons
  document.querySelectorAll('.theme-select-btn').forEach(btn => {
    btn.className = 'theme-select-btn border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 p-2.5 rounded-lg text-xs font-bold text-left flex items-center justify-between';
    btn.querySelector('.text-brand-500')?.classList.add('text-transparent');
    
    if (btn.dataset.theme === styles.themeColor) {
      btn.classList.add('active', 'border-brand-500', 'bg-slate-50', 'dark:bg-slate-800');
      btn.querySelector('i')?.classList.remove('text-transparent');
      btn.querySelector('i')?.classList.add('text-brand-500');
    }
  });
}

// Editor update triggers
function onEditorChange(html, json) {
  updateStatsText(html);
  
  // Fire autosave check
  triggerAutoSaveDebounce();
}

function onEditorSelection(editor) {
  // Can trigger selection metadata sync
}

// Stats counter
function updateStatsText(html) {
  const analysis = analyzeDocumentText(html);
  
  const statsEl = document.getElementById('wordCharStats');
  if (statsEl) {
    statsEl.textContent = `${analysis.wordCount} words (${analysis.charCount} chars)`;
  }
  
  const readingEl = document.getElementById('readingTimeStat');
  if (readingEl) {
    readingEl.textContent = `${analysis.readingTime} min read`;
  }
  
  // Also update stats if AI panel is open
  const statReadability = document.getElementById('aiReadabilityMetric');
  if (statReadability) {
    statReadability.textContent = `Readability Ease: ${analysis.readabilityScore}/100 (${analysis.gradeLevel})`;
  }
  
  if (currentDoc) {
    currentDoc.word_count = analysis.wordCount;
  }
}

// Debounce autosave ticker
let autoSaveDebounceTimeout = null;
function triggerAutoSaveDebounce() {
  if (autoSaveDebounceTimeout) clearTimeout(autoSaveDebounceTimeout);
  autoSaveDebounceTimeout = setTimeout(() => {
    saveActiveDocument(false, 'Auto-saved version');
  }, 3000); // save after 3 seconds of idle writing
}

function startAutoSaveTimer() {
  // Fallback periodic save every 20 seconds
  autoSaveTimer = setInterval(() => {
    saveActiveDocument(false, 'Periodic Auto-save');
  }, 20000);
}

// Comments implementation
function renderComments() {
  if (!currentDoc) return;
  
  renderCommentsFeed(
    currentDoc.comments || [],
    resolveCommentHandler,
    highlightCommentTextHandler
  );
}

function resolveCommentHandler(commentId) {
  if (!currentDoc) return;
  currentDoc.comments = (currentDoc.comments || []).filter(c => c.commentId !== commentId);
  
  // Clean highlights from TipTap editor HTML
  const editor = getEditorInstance();
  if (editor) {
    let html = editor.getHTML();
    const temp = document.createElement('div');
    temp.innerHTML = html;
    
    temp.querySelectorAll(`span.comment-highlight[data-id="${commentId}"]`).forEach(span => {
      const parent = span.parentNode;
      while (span.firstChild) {
        parent.insertBefore(span.firstChild, span);
      }
      span.remove();
    });
    editor.commands.setContent(temp.innerHTML);
  }
  
  saveActiveDocument(false, 'Resolved comment');
  renderComments();
}

function highlightCommentTextHandler(commentId, isHighlight) {
  const editor = getEditorInstance();
  if (!editor) return;
  
  // Toggle border highlights inside the TipTap view element
  const span = editor.view.dom.querySelector(`span.comment-highlight[data-id="${commentId}"]`);
  if (span) {
    if (isHighlight) {
      span.style.backgroundColor = 'rgba(251, 191, 36, 0.45)';
      span.style.borderBottom = '2.5px solid #d97706';
    } else {
      span.style.backgroundColor = '';
      span.style.borderBottom = '';
    }
  }
}

// Version snapshots render list
function renderVersions() {
  const container = document.getElementById('versionHistoryList');
  if (!container) return;
  
  container.innerHTML = '';
  
  const versions = currentDoc?.versions || [];
  
  if (versions.length === 0) {
    container.innerHTML = `<p class="text-[10px] text-slate-400 dark:text-slate-500 italic p-1">No backups saved yet.</p>`;
    return;
  }
  
  versions.forEach(v => {
    const el = document.createElement('div');
    el.className = 'p-2 border border-slate-100 dark:border-slate-800 hover:border-brand-500 rounded-lg text-left text-xs bg-slate-50/50 hover:bg-white dark:hover:bg-slate-900 cursor-pointer transition-all flex items-center justify-between group';
    
    const time = new Date(v.timestamp);
    const timeStr = time.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }) + ' - ' + time.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    
    el.innerHTML = `
      <div>
        <p class="font-bold text-[11px] text-slate-700 dark:text-slate-200 line-clamp-1">${v.title}</p>
        <span class="text-[9px] text-slate-400">${timeStr}</span>
      </div>
      <button class="btn-restore-v hidden group-hover:block text-[9px] text-brand-500 font-extrabold uppercase" data-vid="${v.version_id}">Restore</button>
    `;
    
    el.addEventListener('click', () => {
      // preview or load version
    });
    
    el.querySelector('.btn-restore-v').addEventListener('click', (e) => {
      e.stopPropagation();
      restoreVersionHandler(v.version_id);
    });
    
    container.appendChild(el);
  });
}

async function restoreVersionHandler(vid) {
  if (confirm('Are you sure you want to restore the document to this state? Current unsaved work will be backed up as a new history node.')) {
    try {
      const restored = await restoreDocumentVersion(currentDoc.id, vid);
      currentDoc = restored;
      
      const editor = getEditorInstance();
      if (editor) {
        editor.commands.setContent(restored.content);
      }
      applyStylesToCanvas(restored.styles);
      renderComments();
      renderVersions();
      alert('Version restored successfully!');
    } catch (err) {
      alert('Failed to restore version.');
    }
  }
}

// Drag and drop setup for documents / images
function setupDragAndDrop() {
  const viewport = document.getElementById('editorViewport');
  const overlay = document.getElementById('dragOverOverlay');
  if (!viewport || !overlay) return;
  
  window.addEventListener('dragenter', (e) => {
    e.preventDefault();
    overlay.style.display = 'flex';
  });
  
  overlay.addEventListener('dragleave', (e) => {
    overlay.style.display = 'none';
  });
  
  viewport.addEventListener('dragover', (e) => {
    e.preventDefault();
  });
  
  viewport.addEventListener('drop', (e) => {
    e.preventDefault();
    overlay.style.display = 'none';
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const editor = getEditorInstance();
          if (editor) {
            editor.chain().focus().setImage({ src: event.target.result }).run();
          }
        };
        reader.readAsDataURL(file);
      } else {
        alert('Format not supported directly for drag-and-drop. Paste text blocks or upload images.');
      }
    }
  });
}

// UI Views Switching
function openView(viewName) {
  const viewDash = document.getElementById('viewDashboard');
  const viewEdit = document.getElementById('viewEditor');
  
  if (viewName === 'viewDashboard') {
    viewDash.classList.remove('hidden');
    viewEdit.classList.add('hidden');
    currentDoc = null;
    loadDocumentsList();
  } else if (viewName === 'viewEditor') {
    viewDash.classList.add('hidden');
    viewEdit.classList.remove('hidden');
  }
}

// Global Event Listeners mapping
function registerEventListeners() {
  // Theme toggler
  document.getElementById('themeToggle').addEventListener('click', () => {
    isDarkTheme = !isDarkTheme;
    if (isDarkTheme) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      document.getElementById('themeIcon').setAttribute('data-lucide', 'sun');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      document.getElementById('themeIcon').setAttribute('data-lucide', 'moon');
    }
    lucide.createIcons();
  });

  // Sidebar navigations
  document.getElementById('navDashboard').addEventListener('click', () => {
    openView('viewDashboard');
  });
  
  document.getElementById('navTemplates').addEventListener('click', () => {
    openModal('modalTemplates');
  });
  
  document.getElementById('navAPIKeys').addEventListener('click', () => {
    openModal('modalAPIConfig');
  });
  
  document.getElementById('btnNewDoc').addEventListener('click', () => {
    openModal('modalTemplates');
  });
  
  document.getElementById('btnViewAllTemplates').addEventListener('click', () => {
    openModal('modalTemplates');
  });

  // Modal close buttons
  document.getElementById('btnCloseTemplatesModal').addEventListener('click', () => closeModal('modalTemplates'));
  document.getElementById('btnCloseAPIModal').addEventListener('click', () => closeModal('modalAPIConfig'));
  document.getElementById('btnCancelAPIConfig').addEventListener('click', () => closeModal('modalAPIConfig'));
  document.getElementById('btnCloseSigModal').addEventListener('click', () => closeModal('modalSignature'));
  document.getElementById('btnCancelSig').addEventListener('click', () => closeModal('modalSignature'));
  document.getElementById('btnCloseQRModal').addEventListener('click', () => closeModal('modalQRCode'));
  document.getElementById('btnCancelQR').addEventListener('click', () => closeModal('modalQRCode'));
  document.getElementById('btnCloseShareModal').addEventListener('click', () => closeModal('modalShare'));
  document.getElementById('btnCancelShare').addEventListener('click', () => closeModal('modalShare'));

  // Save API Config keys
  document.getElementById('btnSaveAPIConfig').addEventListener('click', () => {
    const key = document.getElementById('inputAPIKey').value;
    const provider = document.getElementById('aiProviderSelect').value;
    localStorage.setItem('ai_api_key', key);
    localStorage.setItem('ai_provider', provider);
    closeModal('modalAPIConfig');
    alert('AI credentials configured successfully!');
  });
  
  // Load saved key in form
  const savedKey = localStorage.getItem('ai_api_key');
  if (savedKey) document.getElementById('inputAPIKey').value = savedKey;
  const savedProv = localStorage.getItem('ai_provider');
  if (savedProv) document.getElementById('aiProviderSelect').value = savedProv;

  // Back to dashboard
  document.getElementById('btnBackToDashboard').addEventListener('click', () => {
    // save document one final time
    saveActiveDocument(true, 'Saved prior to exiting editor');
    openView('viewDashboard');
  });

  // Rename inplace click handler
  document.getElementById('btnRenameDoc').addEventListener('click', () => {
    document.getElementById('docTitleInput').focus();
  });
  
  document.getElementById('docTitleInput').addEventListener('change', () => {
    if (currentDoc) {
      currentDoc.title = document.getElementById('docTitleInput').value.trim() || 'Untitled Document';
      saveActiveDocument(false, 'Rename document');
    }
  });

  // Zoom slider buttons
  document.getElementById('btnZoomIn').addEventListener('click', () => {
    if (zoomLevel < 150) {
      zoomLevel += 10;
      updateZoomLevel();
    }
  });
  
  document.getElementById('btnZoomOut').addEventListener('click', () => {
    if (zoomLevel > 50) {
      zoomLevel -= 10;
      updateZoomLevel();
    }
  });

  // Export dropdown toggler
  document.getElementById('btnExportMenu').addEventListener('click', (e) => {
    e.stopPropagation();
    document.getElementById('exportDropdown').classList.toggle('hidden');
  });
  
  document.addEventListener('click', () => {
    document.getElementById('exportDropdown')?.classList.add('hidden');
  });

  // Export actions bindings
  document.getElementById('exportPDF').addEventListener('click', () => {
    if (currentDoc) {
      // Find all page pages elements
      const pageElements = [document.getElementById('editorPage')]; // A4 page containers list
      exportToPDFCanvas(currentDoc.title, pageElements, currentDoc.styles);
    }
  });
  
  document.getElementById('exportDOCX').addEventListener('click', () => {
    if (currentDoc) {
      exportToDOCX(currentDoc.title, getEditorInstance().getHTML(), currentDoc.styles);
    }
  });
  
  document.getElementById('exportHTML').addEventListener('click', () => {
    if (currentDoc) {
      exportToHTML(currentDoc.title, getEditorInstance().getHTML(), currentDoc.styles);
    }
  });
  
  document.getElementById('exportMD').addEventListener('click', () => {
    if (currentDoc) {
      exportToMarkdown(currentDoc.title, getEditorInstance().getHTML());
    }
  });
  
  document.getElementById('exportTXT').addEventListener('click', () => {
    if (currentDoc) {
      exportToTXT(currentDoc.title, getEditorInstance().getHTML());
    }
  });

  // Sidebar Toggles
  document.getElementById('btnSidePanelToggle').addEventListener('click', () => {
    const p = document.getElementById('sidePanelLayout');
    p.classList.toggle('hidden');
    syncSidebarControls(currentDoc.styles);
    updateWorkspaceGrids();
  });
  
  document.getElementById('btnAIPanelToggle').addEventListener('click', () => {
    document.getElementById('sidePanelAI').classList.toggle('hidden');
    updateWorkspaceGrids();
  });
  
  document.getElementById('btnCommentPanelToggle').addEventListener('click', () => {
    document.getElementById('sidePanelComments').classList.toggle('hidden');
    updateWorkspaceGrids();
  });

  document.getElementById('btnCloseSideLayout').addEventListener('click', () => {
    document.getElementById('sidePanelLayout').classList.add('hidden');
    updateWorkspaceGrids();
  });
  
  document.getElementById('btnCloseSideAI').addEventListener('click', () => {
    document.getElementById('sidePanelAI').classList.add('hidden');
    updateWorkspaceGrids();
  });
  
  document.getElementById('btnCloseSideComments').addEventListener('click', () => {
    document.getElementById('sidePanelComments').classList.add('hidden');
    updateWorkspaceGrids();
  });

  // Share overlay bindings
  document.getElementById('btnOpenShare').addEventListener('click', () => {
    openModal('modalShare');
  });
  
  document.getElementById('btnCopyShareLink').addEventListener('click', () => {
    const input = document.getElementById('shareLinkInput');
    input.select();
    document.execCommand('copy');
    alert('Shareable link copied to clipboard!');
  });

  // Styles layouts Sidebar actions
  document.getElementById('pageSizeSelect').addEventListener('change', (e) => {
    if (currentDoc) {
      currentDoc.styles.pageSize = e.target.value;
      applyStylesToCanvas(currentDoc.styles);
      saveActiveDocument(false, 'Layout page size change');
    }
  });
  
  document.getElementById('pageOrientationSelect').addEventListener('change', (e) => {
    if (currentDoc) {
      currentDoc.styles.orientation = e.target.value;
      applyStylesToCanvas(currentDoc.styles);
      saveActiveDocument(false, 'Layout orientation change');
    }
  });

  document.getElementById('pageMarginSelect').addEventListener('change', (e) => {
    if (!currentDoc) return;
    const margin = e.target.value;
    let margins = { top: '1in', bottom: '1in', left: '1in', right: '1in' };
    
    if (margin === 'narrow') {
      margins = { top: '0.5in', bottom: '0.5in', left: '0.5in', right: '0.5in' };
    } else if (margin === 'wide') {
      margins = { top: '1.5in', bottom: '1.5in', left: '1.5in', right: '1.5in' };
    } else if (margin === 'custom') {
      const sizeVal = prompt('Enter custom margin size (e.g., 0.75in):', '0.75in');
      if (sizeVal) {
        margins = { top: sizeVal, bottom: sizeVal, left: sizeVal, right: sizeVal };
      }
    }
    
    currentDoc.styles.margins = margins;
    applyStylesToCanvas(currentDoc.styles);
    saveActiveDocument(false, 'Margin spacing changes');
  });

  // Watermarks form inputs
  document.getElementById('watermarkTextInput').addEventListener('input', (e) => {
    if (currentDoc) {
      currentDoc.styles.watermarkText = e.target.value;
      applyStylesToCanvas(currentDoc.styles);
      triggerAutoSaveDebounce();
    }
  });
  
  document.getElementById('watermarkOpacitySlider').addEventListener('input', (e) => {
    if (currentDoc) {
      currentDoc.styles.watermarkOpacity = parseFloat(e.target.value);
      applyStylesToCanvas(currentDoc.styles);
      triggerAutoSaveDebounce();
    }
  });

  document.getElementById('watermarkAngleInput').addEventListener('input', (e) => {
    if (currentDoc) {
      currentDoc.styles.watermarkAngle = parseInt(e.target.value) || -45;
      applyStylesToCanvas(currentDoc.styles);
      triggerAutoSaveDebounce();
    }
  });

  // Headers and Footers Sidebar
  document.getElementById('headerTextInput').addEventListener('input', (e) => {
    if (currentDoc) {
      currentDoc.styles.headerText = e.target.value;
      applyStylesToCanvas(currentDoc.styles);
      triggerAutoSaveDebounce();
    }
  });
  
  document.getElementById('footerTextInput').addEventListener('input', (e) => {
    if (currentDoc) {
      currentDoc.styles.footerText = e.target.value;
      applyStylesToCanvas(currentDoc.styles);
      triggerAutoSaveDebounce();
    }
  });

  document.getElementById('togglePageNumbers').addEventListener('change', (e) => {
    if (currentDoc) {
      currentDoc.styles.pageNumbers = e.target.checked;
      applyStylesToCanvas(currentDoc.styles);
      saveActiveDocument(false, 'Page number toggle');
    }
  });

  // Template select theme buttons in styling panel
  document.querySelectorAll('.theme-select-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (currentDoc) {
        const theme = btn.dataset.theme;
        currentDoc.styles.themeColor = theme;
        
        // Match standard style properties
        if (theme === 'academic') {
          currentDoc.styles.fontFamily = 'Lora';
          currentDoc.styles.lineSpacing = '2';
        } else if (theme === 'business') {
          currentDoc.styles.fontFamily = 'Outfit';
          currentDoc.styles.lineSpacing = '1.5';
        } else if (theme === 'legal') {
          currentDoc.styles.fontFamily = 'Playfair Display';
          currentDoc.styles.lineSpacing = '1.75';
        } else if (theme === 'notes') {
          currentDoc.styles.fontFamily = 'Caveat';
          currentDoc.styles.lineSpacing = '1.5';
        } else {
          currentDoc.styles.fontFamily = 'Inter';
          currentDoc.styles.lineSpacing = '1.5';
        }
        
        applyStylesToCanvas(currentDoc.styles);
        saveActiveDocument(true, `Applied Style Theme: ${theme}`);
      }
    });
  });

  // Save current preset button
  document.getElementById('btnSaveCustomTheme').addEventListener('click', () => {
    if (currentDoc) {
      localStorage.setItem('smart_custom_style_preset', JSON.stringify(currentDoc.styles));
      alert('Custom layout styles saved as your default profile!');
    }
  });

  // QUICK CONVERTER Dashboard
  document.getElementById('btnQuickConvert').addEventListener('click', async () => {
    const rawVal = document.getElementById('quickRawText').value;
    const themeVal = document.getElementById('quickTemplateSelect').value;
    
    if (!rawVal.trim()) {
      alert('Please enter some text to convert.');
      return;
    }
    
    const btn = document.getElementById('btnQuickConvert');
    const origText = btn.innerHTML;
    btn.innerHTML = `<i data-lucide="loader" class="w-4.5 h-4.5 animate-spin"></i> Converting...`;
    lucide.createIcons();
    
    try {
      const converted = await convertRawText(rawVal, themeVal);
      
      // Create new document with it
      const newId = Math.random().toString(36).substring(2, 15);
      
      // Select baseline styling parameters based on selected theme dropdown
      let initialStyles = {
        themeColor: themeVal,
        fontFamily: themeVal === 'academic' ? 'Lora' : (themeVal === 'business' ? 'Outfit' : (themeVal === 'legal' ? 'Playfair' : 'Inter')),
        lineSpacing: themeVal === 'academic' ? '2' : '1.5'
      };
      
      const newDoc = {
        id: newId,
        title: converted.title || 'Formatted Document',
        content: converted.html,
        raw_text: rawVal,
        styles: initialStyles,
        comments: [],
        versions: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const saved = await saveDocument(newDoc, true, 'AI Plaintext Conversion');
      await loadDocumentsList();
      loadStudioDocument(saved.id);
      
      // Clear quick convert textbox
      document.getElementById('quickRawText').value = '';
    } catch (err) {
      alert('Error during conversion. Try again.');
    } finally {
      btn.innerHTML = origText;
      lucide.createIcons();
    }
  });

  // AI Assistant Sidebar converter
  document.getElementById('btnAIImportConvert').addEventListener('click', async () => {
    const rawVal = document.getElementById('aiImportRawText').value;
    if (!rawVal.trim()) {
      alert('Please enter plain text in the sidebar field.');
      return;
    }
    
    const editor = getEditorInstance();
    if (!editor) return;
    
    const converted = await convertRawText(rawVal);
    editor.chain().focus().insertContent(converted.html).run();
    document.getElementById('aiImportRawText').value = '';
  });

  // Q&A Formatting Button Click Handler
  document.getElementById('btnAIFormatQA').addEventListener('click', async () => {
    const editor = getEditorInstance();
    if (!editor) return;
    
    const { selection, state } = editor;
    const { from, to, empty } = selection;
    
    let targetText = '';
    if (!empty) {
      targetText = state.doc.textBetween(from, to, '\n');
    } else {
      targetText = editor.getText();
    }
    
    if (!targetText.trim()) {
      alert('Please write or select Q&A text in the editor first.');
      return;
    }
    
    const btn = document.getElementById('btnAIFormatQA');
    const origText = btn.innerHTML;
    btn.innerHTML = `<i data-lucide="loader" class="w-3.5 h-3.5 animate-spin"></i> Formatting...`;
    lucide.createIcons();
    
    try {
      const formatted = await convertRawText(targetText);
      
      // Inject the converted Q&A HTML back into the editor selection
      if (!empty) {
        editor.chain().focus().insertContent(formatted.html).run();
      } else {
        editor.commands.setContent(formatted.html);
      }
      
      saveActiveDocument(false, 'Formatted Q&A content');
    } catch (err) {
      alert('Q&A Formatting failed. Try again.');
    } finally {
      btn.innerHTML = origText;
      lucide.createIcons();
    }
  });

  // AI Highlight refiners actions
  document.querySelectorAll('.ai-action-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.mode;
      runAITextEnhancement(mode);
    });
  });

  // AI selection bubble actions
  document.getElementById('aiBubbleGrammar').addEventListener('click', () => runAITextEnhancement('grammar'));
  document.getElementById('aiBubbleProfessional').addEventListener('click', () => runAITextEnhancement('professional'));
  document.getElementById('aiBubbleAcademic').addEventListener('click', () => runAITextEnhancement('academic'));
  document.getElementById('aiBubbleSummarize').addEventListener('click', () => runAITextEnhancement('summarize'));
  document.getElementById('aiBubbleShorten').addEventListener('click', () => runAITextEnhancement('shorten'));
  
  // AI Bubble Comment Addition
  document.getElementById('aiBubbleComment').addEventListener('click', () => {
    document.getElementById('sidePanelComments').classList.remove('hidden');
    updateWorkspaceGrids();
    document.getElementById('newCommentText').focus();
  });

  // Auto TOC generator
  document.getElementById('btnAIGenerateTOC').addEventListener('click', () => {
    const editor = getEditorInstance();
    if (!editor) return;
    
    // Find all headings
    const headings = Array.from(document.getElementById('editorPage').querySelectorAll('h1, h2, h3'));
    const tocHTML = generateTableOfContents(headings);
    editor.chain().focus().insertContent(tocHTML).run();
  });

  // Auto Title Suggestions
  document.getElementById('btnAIGenerateTitles').addEventListener('click', () => {
    const editor = getEditorInstance();
    if (!editor) return;
    const txt = editor.getText();
    alert(`AI suggested title alternatives for this content:\n\n1. Analysis of: ${txt.substring(0, 30)}...\n2. Modern Perspective on ${txt.substring(0, 25)}\n3. The Core Principles of ${txt.substring(0, 20)}`);
  });

  // Version snapshot button
  document.getElementById('btnCreateVersionSnapshot').addEventListener('click', () => {
    const title = prompt('Enter a descriptive title for this version backup:', `Backup ${new Date().toLocaleTimeString()}`);
    if (title && title.trim()) {
      saveActiveDocument(true, title.trim());
    }
  });

  // Review Comment posting
  document.getElementById('btnAddComment').addEventListener('click', () => {
    const txt = document.getElementById('newCommentText').value.trim();
    if (!txt) return;
    
    const editor = getEditorInstance();
    if (!editor) return;
    
    const { selection, state } = editor;
    const { from, to } = selection;
    
    // Extract selected text quote
    const quote = state.doc.textBetween(from, to, ' ');
    const commentId = Math.random().toString(36).substring(2, 9);
    
    // Highlight selection range in TipTap
    editor.chain().focus().setMark('textStyle', { commentId: commentId }).run();
    
    // Double wrap styling client-side
    const spans = editor.view.dom.querySelectorAll('span');
    spans.forEach(span => {
      // Find matches containing commentId styles and apply visual class
      if (span.style.commentId === commentId) {
        span.removeAttribute('style'); // cleanup attributes
        span.className = 'comment-highlight';
        span.setAttribute('data-id', commentId);
      }
    });

    const newComment = {
      commentId: commentId,
      id: commentId,
      text: txt,
      quote: quote || 'Document Segment',
      author: 'Workspace User',
      timestamp: new Date().toISOString()
    };
    
    if (!currentDoc.comments) currentDoc.comments = [];
    currentDoc.comments.push(newComment);
    
    saveActiveDocument(false, 'Added review comment');
    renderComments();
    
    document.getElementById('newCommentText').value = '';
  });

  // Suggestion Mode toggle
  document.getElementById('toggleSuggestionMode').addEventListener('change', (e) => {
    const enabled = e.target.checked;
    if (enabled) {
      alert('Track Changes Suggestion Mode Activated. Edits will overlay visually.');
    }
  });

  // Citations insertion trigger
  document.getElementById('tbInsertCitation').addEventListener('click', () => {
    const author = prompt('Enter Author Name(s):', 'Doe, J.');
    const title = prompt('Enter Publication Title:', 'Autonomous Architectures');
    const year = prompt('Enter Year:', '2026');
    const publisher = prompt('Enter Publisher:', 'Stanford Tech Press');
    
    if (!title) return;
    
    const formats = ['apa', 'mla', 'chicago'];
    const selectedFormat = prompt('Enter Citation Format (apa, mla, chicago):', 'apa').toLowerCase();
    
    const format = formats.includes(selectedFormat) ? selectedFormat : 'apa';
    
    const citation = generateCitationString(format, { author, title, year, publisher });
    const editor = getEditorInstance();
    if (editor) {
      editor.chain().focus().insertContent(` [${citation}] `).run();
    }
  });

  // Table Insertion Modal controls
  window.addEventListener('open-table-modal', () => {
    initGridSelector();
    openModal('modalInsertTable');
  });

  function initGridSelector() {
    const gridContainer = document.getElementById('tableGridSelector');
    if (!gridContainer) return;
    gridContainer.innerHTML = '';
    
    // Reset values
    document.getElementById('inputTableRows').value = 3;
    document.getElementById('inputTableCols').value = 3;
    document.getElementById('inputTableHeaderRow').checked = true;
    updateGridHighlight(3, 3);
    
    for (let r = 1; r <= 10; r++) {
      for (let c = 1; c <= 10; c++) {
        const cell = document.createElement('div');
        cell.className = 'w-4 h-4 rounded-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 transition-colors duration-75 cursor-pointer grid-cell';
        cell.dataset.row = r;
        cell.dataset.col = c;
        
        cell.addEventListener('mouseover', () => {
          document.getElementById('inputTableRows').value = r;
          document.getElementById('inputTableCols').value = c;
          updateGridHighlight(r, c);
        });
        
        cell.addEventListener('click', () => {
          insertTableFromModal(r, c);
        });
        
        gridContainer.appendChild(cell);
      }
    }
  }

  function updateGridHighlight(rows, cols) {
    const gridContainer = document.getElementById('tableGridSelector');
    if (!gridContainer) return;
    
    const cells = gridContainer.querySelectorAll('.grid-cell');
    cells.forEach(cell => {
      const r = parseInt(cell.dataset.row);
      const c = parseInt(cell.dataset.col);
      if (r <= rows && c <= cols) {
        cell.classList.remove('bg-slate-50', 'dark:bg-slate-900', 'border-slate-200', 'dark:border-slate-700');
        cell.classList.add('bg-brand-500', 'border-brand-600');
      } else {
        cell.classList.remove('bg-brand-500', 'border-brand-600');
        cell.classList.add('bg-slate-50', 'dark:bg-slate-900', 'border-slate-200', 'dark:border-slate-700');
      }
    });
    
    const label = document.getElementById('tableGridLabel');
    if (label) {
      label.textContent = `${rows} x ${cols} Table`;
    }
  }

  function insertTableFromModal(rows, cols) {
    const editor = getEditorInstance();
    if (editor) {
      const withHeader = document.getElementById('inputTableHeaderRow').checked;
      editor.chain().focus().insertTable({ rows: rows, cols: cols, withHeaderRow: withHeader }).run();
    }
    closeModal('modalInsertTable');
  }

  document.getElementById('inputTableRows').addEventListener('input', (e) => {
    const val = Math.max(1, Math.min(50, parseInt(e.target.value) || 1));
    updateGridHighlight(val, parseInt(document.getElementById('inputTableCols').value) || 1);
  });

  document.getElementById('inputTableCols').addEventListener('input', (e) => {
    const val = Math.max(1, Math.min(20, parseInt(e.target.value) || 1));
    updateGridHighlight(parseInt(document.getElementById('inputTableRows').value) || 1, val);
  });

  document.getElementById('btnInsertTableConfirm').addEventListener('click', () => {
    const r = Math.max(1, Math.min(50, parseInt(document.getElementById('inputTableRows').value) || 1));
    const c = Math.max(1, Math.min(20, parseInt(document.getElementById('inputTableCols').value) || 1));
    insertTableFromModal(r, c);
  });

  document.getElementById('btnCloseTableModal').addEventListener('click', () => closeModal('modalInsertTable'));
  document.getElementById('btnCancelTable').addEventListener('click', () => closeModal('modalInsertTable'));

  // Signature canvas modal openers
  document.getElementById('tbInsertSignature').addEventListener('click', () => {
    sigDrawer.clear();
    document.getElementById('sigNameInput').value = '';
    openModal('modalSignature');
  });

  document.getElementById('btnClearSig').addEventListener('click', () => {
    sigDrawer.clear();
  });
  
  document.getElementById('btnInsertSig').addEventListener('click', () => {
    const editor = getEditorInstance();
    if (!editor) return;
    
    const typedName = document.getElementById('sigNameInput').value.trim();
    
    if (typedName) {
      // Draw typed text onto canvas using handwriting font before export
      sigDrawer.drawTypedName(typedName);
    }
    
    if (sigDrawer.isEmpty()) {
      alert('Please draw a signature or type a name to insert.');
      return;
    }
    
    const dataUrl = sigDrawer.getPNG();
    editor.chain().focus().setImage({ src: dataUrl }).run();
    closeModal('modalSignature');
  });

  // QR Code insertion modal openers
  document.getElementById('tbInsertQRCode').addEventListener('click', () => {
    const previewContainer = document.getElementById('qrCodePreview');
    createQRCodeImage(previewContainer, 'https://smartdoc.studio', null);
    openModal('modalQRCode');
  });

  document.getElementById('inputQRLink').addEventListener('input', (e) => {
    const previewContainer = document.getElementById('qrCodePreview');
    createQRCodeImage(previewContainer, e.target.value || 'https://google.com', null);
  });

  document.getElementById('btnInsertQR').addEventListener('click', () => {
    const link = document.getElementById('inputQRLink').value.trim() || 'https://google.com';
    const previewContainer = document.getElementById('qrCodePreview');
    
    createQRCodeImage(previewContainer, link, (dataUrl) => {
      const editor = getEditorInstance();
      if (editor && dataUrl) {
        editor.chain().focus().setImage({ src: dataUrl }).run();
        closeModal('modalQRCode');
      }
    });
  });

  // Cover Page insertion
  document.getElementById('tbInsertCover').addEventListener('click', () => {
    const titleVal = prompt('Enter Document Title for Cover:', currentDoc?.title || 'Title');
    const subtitleVal = prompt('Enter Subtitle / Description:', 'Report and project specifications.');
    const authorVal = prompt('Enter Author:', 'Jason Carter');
    const orgVal = prompt('Enter Organization:', 'Acme Corp');
    
    const styles = ['minimal', 'corporate', 'academic'];
    const styleName = prompt('Enter Cover Page style (minimal, corporate, academic):', 'corporate');
    const style = styles.includes(styleName) ? styleName : 'corporate';
    
    const html = getCoverPageHTML(style, {
      title: titleVal,
      subtitle: subtitleVal,
      author: authorVal,
      organization: orgVal
    });
    
    const editor = getEditorInstance();
    if (editor) {
      // Insert cover page at the very beginning of document content
      const oldHtml = editor.getHTML();
      editor.commands.setContent(html + oldHtml);
    }
  });

  // Document Search Box
  document.getElementById('searchDocs').addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    if (query === '') {
      renderDocsGrid();
    } else {
      const filtered = allDocs.filter(doc => 
        doc.title.toLowerCase().includes(query) || 
        (doc.raw_text && doc.raw_text.toLowerCase().includes(query))
      );
      // Mock render filtered
      const container = document.getElementById('documentsGrid');
      if (container) {
        container.innerHTML = '';
        if (filtered.length === 0) {
          container.innerHTML = `<div class="col-span-full py-16 text-center text-slate-400">No documents match "${query}".</div>`;
        } else {
          filtered.forEach(doc => {
            const card = document.createElement('div');
            card.className = 'glass-card hover:border-brand-300 transition-all duration-200 flex flex-col justify-between relative group text-left';
            card.innerHTML = `
              <div class="p-5 cursor-pointer" onclick="window.loadStudioDoc('${doc.id}')">
                <h4 class="text-sm font-bold text-slate-800 dark:text-white mb-1 line-clamp-1">${doc.title}</h4>
                <p class="text-[10px] text-slate-400 mb-2">${doc.word_count || 0} words</p>
              </div>
            `;
            container.appendChild(card);
          });
        }
      }
    }
  });

  // Clear all recent documents listener
  const clearDocsBtn = document.getElementById('btnClearAllDocs');
  if (clearDocsBtn) {
    clearDocsBtn.addEventListener('click', async () => {
      if (confirm('Are you sure you want to delete all saved documents? This action is permanent and cannot be undone.')) {
        try {
          await clearAllDocuments();
          currentDoc = null;
          openView('viewDashboard');
          await loadDocumentsList();
          alert('All documents cleared successfully.');
        } catch (err) {
          console.error("Error clearing documents", err);
          alert('Failed to clear documents.');
        }
      }
    });
  }

}

// AI Enhancer execution logic
async function runAITextEnhancement(mode) {
  const editor = getEditorInstance();
  if (!editor) return;
  
  const { selection, state } = editor;
  const { from, to, empty } = selection;
  
  let targetText = '';
  if (!empty) {
    targetText = state.doc.textBetween(from, to, ' ');
  } else {
    // If nothing selected, process active block or prompt
    targetText = editor.getText();
  }
  
  if (!targetText.trim()) {
    alert('Please select some text to refine first.');
    return;
  }
  
  const originalTitle = document.title;
  document.title = "AI Processing...";
  
  const apiKey = localStorage.getItem('ai_api_key') || '';
  const provider = localStorage.getItem('ai_provider') || 'openai';
  
  try {
    const enhanced = await enhanceText(targetText, mode, apiKey, provider);
    
    // Replace text in editor
    if (!empty) {
      // If Track Changes is checked, we can show insertions visually
      const trackChanges = document.getElementById('toggleSuggestionMode').checked;
      if (trackChanges) {
        const wrapHtml = `<span class="suggestion-addition" data-id="${Math.random().toString(36).substring(2,8)}">${enhanced}</span><span class="suggestion-deletion">${targetText}</span>`;
        editor.chain().focus().insertContent(wrapHtml).run();
      } else {
        editor.chain().focus().insertContent(enhanced).run();
      }
    } else {
      editor.commands.setContent(enhanced);
    }
    
    saveActiveDocument(false, `AI Enhanced: ${mode}`);
  } catch (err) {
    alert('AI formatting failed. Make sure your internet connection is active.');
  } finally {
    document.title = originalTitle;
  }
}

// Grid layout spacing adjustments depending on active sidebars
function updateWorkspaceGrids() {
  const layout = !document.getElementById('sidePanelLayout').classList.contains('hidden');
  const ai = !document.getElementById('sidePanelAI').classList.contains('hidden');
  const comments = !document.getElementById('sidePanelComments').classList.contains('hidden');
  
  const workspace = document.querySelector('.workspace-container');
  if (!workspace) return;
  
  workspace.className = 'workspace-container'; // reset
  
  if (layout || ai) {
    if (comments) workspace.classList.add('both-open');
    else workspace.classList.add('sidebar-open');
  } else if (comments) {
    workspace.classList.add('comments-open');
  }
  
  simulatePageBreaks();
}

// Zoom helper
function updateZoomLevel() {
  const percent = document.getElementById('zoomPercent');
  const canvas = document.getElementById('documentCanvas');
  if (percent) percent.textContent = `${zoomLevel}%`;
  if (canvas) {
    canvas.style.transform = `scale(${zoomLevel / 100})`;
  }
}

// Modals management helpers
function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.remove('hidden');
  }
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.add('hidden');
  }
}


