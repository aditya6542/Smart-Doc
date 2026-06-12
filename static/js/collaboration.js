// Review Comments and Track Changes/Suggestion Mode manager

// Renders the list of active comments in the review panel
export function renderCommentsFeed(comments, onResolveComment, onHighlightText) {
  const feed = document.getElementById('commentsListFeed');
  if (!feed) return;
  
  feed.innerHTML = '';
  
  if (!comments || comments.length === 0) {
    feed.innerHTML = `
      <div class="text-center py-8 text-slate-400">
        <i data-lucide="message-square-dashed" class="w-8 h-8 mx-auto mb-2 text-slate-300"></i>
        <p class="text-xs">No active comments in this document.</p>
      </div>
    `;
    lucide.createIcons();
    return;
  }
  
  comments.forEach(comment => {
    const card = document.createElement('div');
    card.className = 'glass-card p-3 border border-slate-100 hover:border-brand-300 hover:shadow-sm transition-all duration-200 space-y-2';
    card.dataset.commentId = comment.id;
    
    // Format timestamp
    const date = new Date(comment.timestamp);
    const timeStr = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) + ' - ' + date.toLocaleDateString();
    
    card.innerHTML = `
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-1.5">
          <div class="w-5 h-5 rounded-full bg-brand-100 flex items-center justify-center text-[9px] font-bold text-brand-600">
            ${comment.author[0].toUpperCase()}
          </div>
          <span class="text-xs font-bold text-slate-700 dark:text-slate-200">${comment.author}</span>
        </div>
        <span class="text-[9px] text-slate-400">${timeStr}</span>
      </div>
      
      ${comment.quote ? `
        <div class="border-l-2 border-amber-400 bg-amber-50/50 dark:bg-amber-950/20 px-2 py-1 text-[10px] text-slate-500 italic max-w-full truncate">
          "${comment.quote}"
        </div>
      ` : ''}
      
      <p class="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">${comment.text}</p>
      
      <div class="flex justify-end pt-1">
        <button class="btn-resolve-comment text-[10px] text-emerald-500 font-bold hover:underline flex items-center gap-0.5" data-id="${comment.commentId}">
          <i data-lucide="check-circle-2" class="w-3.5 h-3.5"></i>
          <span>Resolve</span>
        </button>
      </div>
    `;
    
    // Add hover actions to flash matching highlighted editor node
    card.addEventListener('mouseenter', () => {
      if (onHighlightText) onHighlightText(comment.id, true);
    });
    card.addEventListener('mouseleave', () => {
      if (onHighlightText) onHighlightText(comment.id, false);
    });
    
    // Resolve action
    card.querySelector('.btn-resolve-comment').addEventListener('click', (e) => {
      e.stopPropagation();
      if (onResolveComment) onResolveComment(comment.id);
    });
    
    feed.appendChild(card);
  });
  
  lucide.createIcons();
}

// Track Changes Heuristics Utility: Accept/Reject suggestions
// Suggestions are stored as HTML spans:
// Additions: <span class="suggestion-addition" data-id="123">Text</span>
// Deletions: <span class="suggestion-deletion" data-id="456">Text</span>
export function acceptAllSuggestions(htmlContent) {
  const temp = document.createElement('div');
  temp.innerHTML = htmlContent;
  
  // Accept Additions: Strip the wrapper and keep text content
  const additions = temp.querySelectorAll('.suggestion-addition');
  additions.forEach(span => {
    const parent = span.parentNode;
    while (span.firstChild) {
      parent.insertBefore(span.firstChild, span);
    }
    span.remove();
  });
  
  // Accept Deletions: Delete the span entirely (the text was suggested for removal)
  const deletions = temp.querySelectorAll('.suggestion-deletion');
  deletions.forEach(span => {
    span.remove();
  });
  
  return temp.innerHTML;
}

export function rejectAllSuggestions(htmlContent) {
  const temp = document.createElement('div');
  temp.innerHTML = htmlContent;
  
  // Reject Additions: Remove the addition span entirely (the text was suggested to add)
  const additions = temp.querySelectorAll('.suggestion-addition');
  additions.forEach(span => {
    span.remove();
  });
  
  // Reject Deletions: Keep the deleted text, strip the strikethrough wrapper
  const deletions = temp.querySelectorAll('.suggestion-deletion');
  deletions.forEach(span => {
    const parent = span.parentNode;
    while (span.firstChild) {
      parent.insertBefore(span.firstChild, span);
    }
    span.remove();
  });
  
  return temp.innerHTML;
}

// Render floating widgets inside page for individual accept/reject
export function handleSuggestionHighlights(editorContainer, onAccept, onReject) {
  // We can attach double click or tooltip helpers over suggestion spans
  editorContainer.addEventListener('click', (e) => {
    const span = e.target.closest('.suggestion-addition, .suggestion-deletion');
    if (!span) return;
    
    // Draw a floating mini tooltip
    showFloatingSuggestionPopover(span, onAccept, onReject);
  });
}

let activePopover = null;

function showFloatingSuggestionPopover(targetSpan, onAccept, onReject) {
  if (activePopover) activePopover.remove();
  
  const popover = document.createElement('div');
  popover.className = 'absolute bg-slate-900 text-white rounded-xl shadow-lg p-2 flex items-center gap-1 text-[10px] font-bold z-50 animate-fade-in border border-slate-700';
  popover.innerHTML = `
    <span class="px-1.5 text-slate-400">Suggestion:</span>
    <button class="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 rounded text-white flex items-center gap-0.5" id="btnFloatAcceptSug">
      <i data-lucide="check" class="w-3 h-3"></i> Accept
    </button>
    <button class="px-2 py-1 bg-rose-600 hover:bg-rose-700 rounded text-white flex items-center gap-0.5" id="btnFloatRejectSug">
      <i data-lucide="x" class="w-3 h-3"></i> Reject
    </button>
  `;
  
  document.body.appendChild(popover);
  lucide.createIcons();
  
  // Positioning popover above target element
  const rect = targetSpan.getBoundingClientRect();
  popover.style.top = `${window.scrollY + rect.top - popover.offsetHeight - 8}px`;
  popover.style.left = `${window.scrollX + rect.left + (rect.width/2) - (popover.offsetWidth/2)}px`;
  
  activePopover = popover;
  
  // Event listeners
  popover.querySelector('#btnFloatAcceptSug').addEventListener('click', () => {
    acceptSuggestion(targetSpan);
    popover.remove();
    activePopover = null;
    if (onAccept) onAccept();
  });
  
  popover.querySelector('#btnFloatRejectSug').addEventListener('click', () => {
    rejectSuggestion(targetSpan);
    popover.remove();
    activePopover = null;
    if (onReject) onReject();
  });
  
  // Close popover when clicking elsewhere
  const outsideClick = (e) => {
    if (!popover.contains(e.target) && e.target !== targetSpan) {
      popover.remove();
      activePopover = null;
      document.removeEventListener('mousedown', outsideClick);
    }
  };
  document.addEventListener('mousedown', outsideClick);
}

function acceptSuggestion(span) {
  if (span.classList.contains('suggestion-addition')) {
    const parent = span.parentNode;
    while (span.firstChild) {
      parent.insertBefore(span.firstChild, span);
    }
    span.remove();
  } else if (span.classList.contains('suggestion-deletion')) {
    span.remove();
  }
}

function rejectSuggestion(span) {
  if (span.classList.contains('suggestion-addition')) {
    span.remove();
  } else if (span.classList.contains('suggestion-deletion')) {
    const parent = span.parentNode;
    while (span.firstChild) {
      parent.insertBefore(span.firstChild, span);
    }
    span.remove();
  }
}
