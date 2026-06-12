// Document Studio local storage & API synchronization layer

const BASE_URL = '/api';

// Helper to determine if we are running in standalone/offline mode
let isOfflineMode = false;

// LocalStorage key names
const LS_DOC_LIST = 'smart_doc_list';
const LS_DOC_PREFIX = 'smart_doc_';

// Initial check to test API status
async function checkApiStatus() {
  try {
    const res = await fetch(`${BASE_URL}/documents`, { method: 'GET', signal: AbortSignal.timeout(1500) });
    isOfflineMode = !res.ok;
  } catch (err) {
    isOfflineMode = true;
    console.warn('Backend server not responding. Falling back to LocalStorage offline mode.', err);
  }
}

// Check status on startup
checkApiStatus();

export async function getDocuments() {
  await checkApiStatus();
  if (isOfflineMode) {
    const listStr = localStorage.getItem(LS_DOC_LIST);
    const list = listStr ? JSON.parse(listStr) : [];
    // Sort by updated_at desc
    list.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    return list;
  }

  try {
    const res = await fetch(`${BASE_URL}/documents`);
    if (!res.ok) throw new Error('API error');
    return await res.json();
  } catch (err) {
    isOfflineMode = true;
    return getDocuments(); // retry with local storage
  }
}

export async function getDocument(docId) {
  if (isOfflineMode) {
    const docStr = localStorage.getItem(`${LS_DOC_PREFIX}${docId}`);
    if (!docStr) throw new Error('Document not found in local storage');
    return JSON.parse(docStr);
  }

  try {
    const res = await fetch(`${BASE_URL}/documents/${docId}`);
    if (!res.ok) throw new Error('API error');
    return await res.json();
  } catch (err) {
    isOfflineMode = true;
    return getDocument(docId);
  }
}

export async function saveDocument(docData, createVersion = false, versionTitle = 'Auto-saved version') {
  await checkApiStatus();
  const now = new Date().toISOString();
  docData.updated_at = now;

  // Word & character counts
  const plainText = docData.content.replace(/<[^>]+>/g, ' ');
  const words = plainText.trim().split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;

  if (isOfflineMode) {
    // Read list of docs
    const listStr = localStorage.getItem(LS_DOC_LIST);
    let list = listStr ? JSON.parse(listStr) : [];
    
    // Check if doc exists in list
    const index = list.findIndex(d => d.id === docData.id);
    const summary = {
      id: docData.id,
      title: docData.title || 'Untitled Document',
      updated_at: now,
      created_at: docData.created_at || now,
      word_count: wordCount,
      pageSize: docData.styles?.pageSize || 'A4',
      orientation: docData.styles?.orientation || 'portrait'
    };

    if (index >= 0) {
      list[index] = summary;
    } else {
      docData.created_at = now;
      summary.created_at = now;
      list.push(summary);
    }
    localStorage.setItem(LS_DOC_LIST, JSON.stringify(list));

    // Save actual doc body
    const docKey = `${LS_DOC_PREFIX}${docData.id}`;
    const localDocStr = localStorage.getItem(docKey);
    let existingDoc = localDocStr ? JSON.parse(localDocStr) : null;
    
    if (!existingDoc) {
      existingDoc = {
        id: docData.id,
        title: docData.title,
        content: docData.content,
        raw_text: docData.raw_text || '',
        styles: docData.styles || {},
        comments: docData.comments || [],
        versions: [],
        created_at: now,
        updated_at: now
      };
    } else {
      existingDoc.title = docData.title;
      existingDoc.content = docData.content;
      existingDoc.raw_text = docData.raw_text || '';
      existingDoc.styles = docData.styles || existingDoc.styles;
      existingDoc.comments = docData.comments || existingDoc.comments;
      existingDoc.updated_at = now;
    }

    if (createVersion) {
      const version = {
        version_id: Math.random().toString(36).substring(2, 9),
        timestamp: now,
        title: versionTitle || 'Version Snapshot',
        content: docData.content,
        styles: docData.styles || existingDoc.styles
      };
      if (!existingDoc.versions) existingDoc.versions = [];
      existingDoc.versions.unshift(version);
      existingDoc.versions = existingDoc.versions.slice(0, 15);
    }

    localStorage.setItem(docKey, JSON.stringify(existingDoc));
    return existingDoc;
  }

  try {
    const url = `${BASE_URL}/documents/${docData.id}`;
    // check if it is a new doc (need to POST or PUT?)
    // We can try to see if it already exists or if docData has a creation timestamp.
    // In our backend API, POST /api/documents creates and PUT /api/documents/{doc_id} updates.
    // Let's check if it exists by listing or trying PUT first.
    
    let res = await fetch(`${BASE_URL}/documents/${docData.id}`, { method: 'GET' });
    const exists = res.ok;

    if (!exists) {
      // Create new doc via POST
      res = await fetch(`${BASE_URL}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(docData)
      });
    } else {
      // Update doc via PUT
      const queryParam = `?create_version=${createVersion}&version_title=${encodeURIComponent(versionTitle)}`;
      res = await fetch(`${BASE_URL}/documents/${docData.id}${queryParam}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(docData)
      });
    }

    if (!res.ok) throw new Error('Failed to save document on backend');
    return await res.json();
  } catch (err) {
    console.error('Failed API save, falling back to LocalStorage', err);
    isOfflineMode = true;
    return saveDocument(docData, createVersion, versionTitle);
  }
}

export async function deleteDocument(docId) {
  if (isOfflineMode) {
    // Remove from index list
    const listStr = localStorage.getItem(LS_DOC_LIST);
    if (listStr) {
      let list = JSON.parse(listStr);
      list = list.filter(d => d.id !== docId);
      localStorage.setItem(LS_DOC_LIST, JSON.stringify(list));
    }
    // Remove document contents
    localStorage.removeItem(`${LS_DOC_PREFIX}${docId}`);
    return { status: 'success' };
  }

  try {
    const res = await fetch(`${BASE_URL}/documents/${docId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('API delete failed');
    return await res.json();
  } catch (err) {
    isOfflineMode = true;
    return deleteDocument(docId);
  }
}

export async function duplicateDocument(docId) {
  if (isOfflineMode) {
    const originalDoc = await getDocument(docId);
    const newId = Math.random().toString(36).substring(2, 15);
    const newDoc = {
      ...originalDoc,
      id: newId,
      title: `Copy of ${originalDoc.title}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      versions: [{
        version_id: Math.random().toString(36).substring(2, 9),
        timestamp: new Date().toISOString(),
        title: 'Duplicated copy base',
        content: originalDoc.content,
        styles: originalDoc.styles
      }]
    };
    await saveDocument(newDoc);
    return newDoc;
  }

  try {
    const res = await fetch(`${BASE_URL}/documents/${docId}/duplicate`, { method: 'POST' });
    if (!res.ok) throw new Error('API duplication failed');
    return await res.json();
  } catch (err) {
    isOfflineMode = true;
    return duplicateDocument(docId);
  }
}

export async function getDocumentVersions(docId) {
  if (isOfflineMode) {
    const doc = await getDocument(docId);
    return doc.versions || [];
  }

  try {
    const res = await fetch(`${BASE_URL}/documents/${docId}/versions`);
    if (!res.ok) throw new Error('API get versions failed');
    return await res.json();
  } catch (err) {
    isOfflineMode = true;
    return getDocumentVersions(docId);
  }
}

export async function restoreDocumentVersion(docId, versionId) {
  if (isOfflineMode) {
    const doc = await getDocument(docId);
    const version = doc.versions.find(v => v.version_id === versionId);
    if (!version) throw new Error('Version not found');

    // Make backup copy of current content before overwrite
    const now = new Date().toISOString();
    const backup = {
      version_id: Math.random().toString(36).substring(2, 9),
      timestamp: now,
      title: `Backup before restoring ${version.title}`,
      content: doc.content,
      styles: doc.styles
    };

    doc.content = version.content;
    doc.styles = version.styles;
    doc.updated_at = now;
    doc.versions.unshift(backup);

    localStorage.setItem(`${LS_DOC_PREFIX}${docId}`, JSON.stringify(doc));
    
    // Update summary list
    const listStr = localStorage.getItem(LS_DOC_LIST);
    if (listStr) {
      const list = JSON.parse(listStr);
      const idx = list.findIndex(d => d.id === docId);
      if (idx >= 0) {
        list[idx].updated_at = now;
        list[idx].pageSize = version.styles?.pageSize || 'A4';
        list[idx].orientation = version.styles?.orientation || 'portrait';
        localStorage.setItem(LS_DOC_LIST, JSON.stringify(list));
      }
    }

    return doc;
  }

  try {
    const res = await fetch(`${BASE_URL}/documents/${docId}/restore`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ version_id: versionId })
    });
    if (!res.ok) throw new Error('API restore failed');
    return await res.json();
  } catch (err) {
    isOfflineMode = true;
    return restoreDocumentVersion(docId, versionId);
  }
}

export async function clearAllDocuments() {
  await checkApiStatus();
  
  // Clear offline/localStorage cache always to be sure
  const listStr = localStorage.getItem(LS_DOC_LIST);
  if (listStr) {
    try {
      const list = JSON.parse(listStr);
      list.forEach(d => {
        localStorage.removeItem(`${LS_DOC_PREFIX}${d.id}`);
      });
    } catch (e) {
      console.error("Error clearing documents from local storage", e);
    }
  }
  localStorage.removeItem(LS_DOC_LIST);

  if (isOfflineMode) {
    return { status: 'success' };
  }

  try {
    const res = await fetch(`${BASE_URL}/documents`, { method: 'DELETE' });
    if (!res.ok) throw new Error('API delete all failed');
    return await res.json();
  } catch (err) {
    isOfflineMode = true;
    console.error("Failed API delete all, offline fallback completed", err);
    return { status: 'success' };
  }
}
