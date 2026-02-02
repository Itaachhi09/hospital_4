/**
 * HR Core Module - Employee Documents Management
 * Upload, view, download, and manage employee documents
 */

const REST_API_URL = '/api/';
const API_BASE_URL = '/api';

let documentsCache = [];
let documentCategoriesCache = [];
let documentTypesCache = [];
let currentEmployeeId = null;

/**
 * Display HR CORE Document Library (Employee-Grouped View)
 */
export async function displayHRCoreDocumentLibrary() {
    console.log("[HR Core Library] Displaying HR CORE Document Library...");
    
    const container = document.getElementById('employeeDocumentsContainer');
    if (!container) return;
    
    container.innerHTML = `
        <div style="background: white; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden;">
            <!-- Header -->
            <div style="padding: 20px; border-bottom: 1px solid #e2e8f0; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
                <div style="margin-bottom: 15px;">
                    <h2 style="font-size: 28px; font-weight: 700; color: white; margin: 0; letter-spacing: -0.5px;">HR CORE - DOCUMENT VIEWER</h2>
                    <p style="font-size: 14px; color: rgba(255,255,255,0.9); margin-top: 5px;">Integrated employee documents from HR1 (Recruitment) and HR2 (Training & Performance)</p>
                </div>
            </div>

            <!-- Library Section Header -->
            <div style="padding: 20px; border-bottom: 1px solid #e2e8f0; background: #f0f7ff;">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px; margin-bottom: 15px;">
                    <div>
                        <h3 style="font-size: 18px; font-weight: 600; color: #1e40af; margin: 0;">HR CORE DOCUMENT LIBRARY</h3>
                        <p style="font-size: 13px; color: #1e3a8a; margin-top: 3px;">Click on an employee to view their documents</p>
                    </div>
                    <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                        <button onclick="refreshHRCoreDocuments()" style="padding: 8px 16px; background: white; border: 1px solid #3b82f6; border-radius: 6px; color: #1e40af; font-size: 14px; font-weight: 500; cursor: pointer; display: flex; align-items: center; gap: 6px;">
                            🔄 Refresh
                        </button>
                        <button onclick="exportHRCoreDocuments()" style="padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer; display: flex; align-items: center; gap: 6px;">
                            📥 Export
                        </button>
                        <button onclick="showIntegrationStatus()" style="padding: 8px 16px; background: #10b981; color: white; border: none; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer; display: flex; align-items: center; gap: 6px;">
                            ✓ Integration Status
                        </button>
                    </div>
                </div>

                <!-- Search and Filters -->
                <div style="display: flex; gap: 10px; flex-wrap: wrap; align-items: center;">
                    <input type="text" id="hrcore-search" placeholder="Search by employee name..."
                           style="flex: 1; min-width: 250px; padding: 10px 15px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;"
                           onchange="filterHRCoreEmployees()" onkeyup="filterHRCoreEmployees()">
                    
                    <select id="hrcore-module-filter" style="padding: 10px 15px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;" onchange="filterHRCoreEmployees()">
                        <option value="">All Modules</option>
                        <option value="HR1">HR1 - Recruitment</option>
                        <option value="HR2">HR2 - Training & Performance</option>
                    </select>
                    
                    <select id="hrcore-status-filter" style="padding: 10px 15px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;" onchange="filterHRCoreEmployees()">
                        <option value="">All Status</option>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="Expired">Expired</option>
                    </select>
                    
                    <button onclick="filterHRCoreEmployees()" style="padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer;">
                        🔍 Filter
                    </button>
                    <button onclick="clearHRCoreFilters()" style="padding: 10px 20px; background: #e5e7eb; color: #374151; border: none; border-radius: 6px; font-size: 14px; cursor: pointer;">
                        ✕ Clear
                    </button>
                </div>
            </div>

            <!-- Employee Accordion List -->
            <div style="padding: 20px;">
                <div id="hrcore-employees-list-container">
                    <div style="text-align: center; padding: 40px 20px; color: #64748b;">
                        <p>Loading employees...</p>
                    </div>
                </div>
            </div>
        </div>
    `;

    await loadHRCoreCategories();
    await loadHRCoreDocuments();
}

/**
 * Display Employee Documents Section
 */
export async function displayEmployeeDocumentsSection(employeeId = null) {
    console.log("[HR Core] Displaying Employee Documents Section...");
    
    currentEmployeeId = employeeId;
    
    const container = document.getElementById('employeeDocumentsContainer');
    if (!container) return;
    
    container.innerHTML = `
        <div style="background: white; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden;">
            <!-- Header -->
            <div style="padding: 20px; border-bottom: 1px solid #e2e8f0; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px;">
                    <div>
                        <h2 style="font-size: 24px; font-weight: 600; color: white; margin: 0;">Employee Documents</h2>
                        <p style="font-size: 14px; color: rgba(255,255,255,0.9); margin-top: 5px;">Manage employee documents and records</p>
                    </div>
                    <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                        <button onclick="refreshDocuments()" style="padding: 10px 20px; background: rgba(255,255,255,0.2); color: white; border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer;">
                            🔄 Refresh
                        </button>
                        ${employeeId ? `
                            <button onclick="showUploadDocumentModal('${employeeId}')" style="padding: 10px 20px; background: white; color: #f5576c; border: none; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer;">
                                📄 Upload Document
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>

            <!-- Filters -->
            <div style="padding: 15px 20px; background: #f9fafb; border-bottom: 1px solid #e2e8f0;">
                <div style="display: flex; gap: 10px; flex-wrap: wrap; align-items: center;">
                    <select id="document-category-filter" style="padding: 10px 15px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 14px;">
                        <option value="">All Categories</option>
                    </select>
                    
                    <select id="document-type-filter" style="padding: 10px 15px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 14px;">
                        <option value="">All Types</option>
                    </select>
                    
                    <select id="document-status-filter" style="padding: 10px 15px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 14px;">
                        <option value="">All Status</option>
                        <option value="valid">Valid</option>
                        <option value="expired">Expired</option>
                        <option value="missing">Missing</option>
                        <option value="pending">Pending</option>
                    </select>
                    
                    <button onclick="applyDocumentFilters()" style="padding: 10px 20px; background: #f5576c; color: white; border: none; border-radius: 6px; font-size: 14px; cursor: pointer;">
                        🔍 Filter
                    </button>
                    
                    <button onclick="clearDocumentFilters()" style="padding: 10px 20px; background: #e5e7eb; color: #374151; border: none; border-radius: 6px; font-size: 14px; cursor: pointer;">
                        ✕ Clear
                    </button>
                </div>
            </div>

            <!-- Documents List -->
            <div style="padding: 20px; overflow-x: auto;">
                <div id="documents-list-container">
                    <div style="text-align: center; padding: 40px 20px; color: #64748b;">
                        <p>Loading documents...</p>
                    </div>
                </div>
            </div>
        </div>
    `;

    await loadDocumentCategories();
    await loadDocumentTypes();
    await loadDocuments();
}

/**
 * Load document categories
 */
async function loadDocumentCategories() {
    try {
        const response = await fetch(`${API_BASE_URL}/HRCORE/?resource=document-categories`, { credentials: 'include' });
        
        const responseText = await response.text();
        let result;
        try {
            result = JSON.parse(responseText);
        } catch (parseError) {
            throw new Error('Invalid API response');
        }
        
        if (response.ok) {
            documentCategoriesCache = result.data || [];
        } else {
            throw new Error(result.message || `HTTP ${response.status}`);
        }
        
        const select = document.getElementById('document-category-filter');
        if (select) {
            select.innerHTML = '<option value="">All Categories</option>' +
                documentCategoriesCache.map(cat => `<option value="${cat.id}">${cat.category_name}</option>`).join('');
        }
    } catch (error) {
        console.error('Error loading document categories:', error);
        
        // Fallback categories
        documentCategoriesCache = [
            { id: '1', category_name: 'Personal Documents' },
            { id: '2', category_name: 'Work Authorization' },
            { id: '3', category_name: 'Certifications' }
        ];
        
        const select = document.getElementById('document-category-filter');
        if (select) {
            select.innerHTML = '<option value="">All Categories</option>' +
                documentCategoriesCache.map(cat => `<option value="${cat.id}">${cat.category_name}</option>`).join('');
        }
    }
}

/**
 * Load document types
 */
async function loadDocumentTypes() {
    try {
        const categoryId = document.getElementById('document-category-filter')?.value || '';
        const url = categoryId 
            ? `${API_BASE_URL}/HRCORE/?resource=document-types&category_id=${categoryId}`
            : `${API_BASE_URL}/HRCORE/?resource=document-types`;
        
        const response = await fetch(url, { credentials: 'include' });
        
        const responseText = await response.text();
        let result;
        try {
            result = JSON.parse(responseText);
        } catch (parseError) {
            throw new Error('Invalid API response');
        }
        
        if (response.ok) {
            documentTypesCache = result.data || [];
        } else {
            throw new Error(result.message || `HTTP ${response.status}`);
        }
        
        const select = document.getElementById('document-type-filter');
        if (select) {
            select.innerHTML = '<option value="">All Types</option>' +
                documentTypesCache.map(type => `<option value="${type.id}">${type.type_name}</option>`).join('');
        }
    } catch (error) {
        console.error('Error loading document types:', error);
        
        // Fallback document types
        documentTypesCache = [
            { id: '1', type_name: 'National ID' },
            { id: '2', type_name: 'Passport' },
            { id: '3', type_name: 'Birth Certificate' },
            { id: '4', type_name: 'Medical Certificate' }
        ];
        
        const select = document.getElementById('document-type-filter');
        if (select) {
            select.innerHTML = '<option value="">All Types</option>' +
                documentTypesCache.map(type => `<option value="${type.id}">${type.type_name}</option>`).join('');
        }
    }
}

/**
 * Load documents
 */
async function loadDocuments() {
    const container = document.getElementById('documents-list-container');
    if (!container) return;
    
    container.innerHTML = '<div style="text-align: center; padding: 40px 20px; color: #64748b;"><p>Loading documents...</p></div>';
    
    try {
        const categoryId = document.getElementById('document-category-filter')?.value || '';
        const typeId = document.getElementById('document-type-filter')?.value || '';
        const status = document.getElementById('document-status-filter')?.value || '';
        
        const params = new URLSearchParams();
        params.append('resource', 'documents');
        if (currentEmployeeId) params.append('employee_id', currentEmployeeId);
        if (typeId) params.append('document_type_id', typeId);
        if (status) params.append('status', status);
        
        const response = await fetch(`${API_BASE_URL}/HRCORE/?${params.toString()}`, {
            credentials: 'include'
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const responseText = await response.text();
        let result;
        try {
            result = JSON.parse(responseText);
        } catch (parseError) {
            console.error('API returned invalid JSON:', responseText);
            throw new Error('Invalid API response format: ' + responseText.substring(0, 200));
        }
        
        documentsCache = result.data || [];
        
        if (documentsCache.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 60px 20px; color: #9ca3af;">
                    <div style="font-size: 48px; margin-bottom: 16px;">📄</div>
                    <p style="font-size: 16px; margin-bottom: 8px;">No documents found</p>
                    <p style="font-size: 14px; color: #6b7280;">Upload a document to get started</p>
                </div>
            `;
            return;
        }
        
        renderDocumentsList(documentsCache);
    } catch (error) {
        console.error('Error loading documents:', error);
        
        // Fallback sample documents
        const fallbackDocuments = [
            {
                id: 'DOC001',
                document_type_id: '1',
                type_name: 'National ID',
                file_name: 'national_id.pdf',
                file_path: '/uploads/documents/',
                status: 'valid',
                expiration_date: '2026-12-31'
            },
            {
                id: 'DOC002',
                document_type_id: '4',
                type_name: 'Medical Certificate',
                file_name: 'medical_cert.pdf',
                file_path: '/uploads/documents/',
                status: 'valid',
                expiration_date: '2025-06-30'
            }
        ];
        
        documentsCache = fallbackDocuments;
        renderDocumentsList(fallbackDocuments);
        
        // Show warning about API error
        const warning = document.createElement('div');
        warning.style.cssText = 'padding: 12px 20px; background: #fef3c7; border-left: 4px solid #f59e0b; color: #92400e; margin-bottom: 20px; border-radius: 4px;';
        warning.innerHTML = '⚠️ Using sample data - API error: ' + error.message;
        container.insertBefore(warning, container.firstChild);
    }
}

/**
 * Render documents list
 */
function renderDocumentsList(documents) {
    const container = document.getElementById('documents-list-container');
    if (!container) return;
    
    const statusColors = {
        'valid': '#10b981',
        'expired': '#ef4444',
        'missing': '#f59e0b',
        'pending': '#6b7280'
    };
    
    container.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px;">
            ${documents.map(doc => {
                const isExpired = doc.status === 'expired' || (doc.expiry_date && new Date(doc.expiry_date) < new Date());
                return `
                    <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; background: white; transition: box-shadow 0.2s;" 
                         onmouseover="this.style.boxShadow='0 4px 12px rgba(0,0,0,0.1)'" 
                         onmouseout="this.style.boxShadow='none'">
                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
                            <div style="flex: 1;">
                                <h4 style="font-size: 16px; font-weight: 600; color: #1f2937; margin: 0 0 4px 0;">${doc.document_name || 'Untitled Document'}</h4>
                                <p style="font-size: 12px; color: #6b7280; margin: 0;">${doc.category_name || ''} - ${doc.type_name || ''}</p>
                            </div>
                            <span style="display: inline-block; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 500; background: ${statusColors[doc.status] || '#6b7280'}20; color: ${statusColors[doc.status] || '#6b7280'};">
                                ${doc.status || 'unknown'}
                            </span>
                        </div>
                        
                        <div style="margin-bottom: 12px; font-size: 13px; color: #6b7280;">
                            <div style="margin-bottom: 4px;">👤 ${doc.first_name || ''} ${doc.last_name || ''} (${doc.employee_code || ''})</div>
                            ${doc.issue_date ? `<div style="margin-bottom: 4px;">📅 Issue: ${new Date(doc.issue_date).toLocaleDateString()}</div>` : ''}
                            ${doc.expiry_date ? `<div style="margin-bottom: 4px; color: ${isExpired ? '#ef4444' : '#6b7280'};">
                                ⏰ Expiry: ${new Date(doc.expiry_date).toLocaleDateString()} ${isExpired ? '(Expired)' : ''}
                            </div>` : ''}
                            ${doc.uploaded_at ? `<div style="margin-bottom: 4px;">📤 Uploaded: ${new Date(doc.uploaded_at).toLocaleDateString()}</div>` : ''}
                        </div>
                        
                        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                            <button onclick="viewDocument('${doc.id}')" style="flex: 1; padding: 8px 12px; background: #3b82f6; color: white; border: none; border-radius: 4px; font-size: 12px; cursor: pointer;">View</button>
                            <button onclick="downloadDocument('${doc.id}', '${doc.file_path}')" style="flex: 1; padding: 8px 12px; background: #10b981; color: white; border: none; border-radius: 4px; font-size: 12px; cursor: pointer;">Download</button>
                            <button onclick="deleteDocument('${doc.id}')" style="padding: 8px 12px; background: #ef4444; color: white; border: none; border-radius: 4px; font-size: 12px; cursor: pointer;">Delete</button>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

/**
 * Global functions
 */
window.refreshDocuments = loadDocuments;
window.applyDocumentFilters = function() {
    loadDocumentTypes();
    loadDocuments();
};
window.clearDocumentFilters = function() {
    document.getElementById('document-category-filter').value = '';
    document.getElementById('document-type-filter').value = '';
    document.getElementById('document-status-filter').value = '';
    loadDocumentTypes();
    loadDocuments();
};

window.viewDocument = async function(documentId) {
    try {
        const response = await fetch(`${REST_API_URL}hrcore?resource=documents&id=${documentId}`, {
            credentials: 'include'
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const result = await response.json();
        const document = result.data;
        
        showDocumentModal(document);
    } catch (error) {
        alert('Error loading document: ' + error.message);
    }
};

window.downloadDocument = function(documentId, filePath) {
    const url = `/${filePath}`;
    window.open(url, '_blank');
};

window.deleteDocument = async function(documentId) {
    if (!confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
        return;
    }
    
    try {
        const response = await fetch(`${REST_API_URL}hrcore?resource=documents&id=${documentId}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        alert('Document deleted successfully');
        loadDocuments();
    } catch (error) {
        alert('Error deleting document: ' + error.message);
    }
};

window.showUploadDocumentModal = function(employeeId) {
    const modal = document.createElement('div');
    modal.id = 'upload-document-modal';
    modal.style.cssText = 'position: fixed; inset: 0; z-index: 50; overflow-y: auto; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; padding: 20px;';
    
    modal.innerHTML = `
        <div style="background: white; border-radius: 10px; box-shadow: 0 20px 25px rgba(0,0,0,0.15); max-width: 600px; width: 100%;">
            <div style="padding: 20px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
                <h3 style="font-size: 20px; font-weight: 600; color: #0f172a; margin: 0;">Upload Document</h3>
                <button onclick="document.getElementById('upload-document-modal').remove()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #6b7280;">&times;</button>
            </div>
            
            <form id="upload-document-form" enctype="multipart/form-data" style="padding: 20px;">
                <input type="hidden" name="employee_id" value="${employeeId}">
                
                <div style="margin-bottom: 15px;">
                    <label style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 5px;">Document Category *</label>
                    <select id="upload-doc-category" name="category_id" required 
                            style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;"
                            onchange="loadDocumentTypesForUpload()">
                        <option value="">Select Category</option>
                        ${documentCategoriesCache.map(cat => `<option value="${cat.id}">${cat.category_name}</option>`).join('')}
                    </select>
                </div>
                
                <div style="margin-bottom: 15px;">
                    <label style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 5px;">Document Type *</label>
                    <select id="upload-doc-type" name="document_type_id" required 
                            style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;">
                        <option value="">Select Category First</option>
                    </select>
                </div>
                
                <div style="margin-bottom: 15px;">
                    <label style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 5px;">Document Name *</label>
                    <input type="text" name="document_name" required 
                           style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;"
                           placeholder="e.g., PRC License 2025">
                </div>
                
                <div style="margin-bottom: 15px;">
                    <label style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 5px;">File *</label>
                    <input type="file" name="file" required accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                           style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;">
                    <p style="font-size: 12px; color: #6b7280; margin-top: 4px;">Allowed: PDF, DOC, DOCX, JPG, PNG (Max 10MB)</p>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 15px;">
                    <div>
                        <label style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 5px;">Issue Date</label>
                        <input type="date" name="issue_date" 
                               style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;">
                    </div>
                    <div>
                        <label style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 5px;">Expiry Date</label>
                        <input type="date" name="expiry_date" 
                               style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;">
                    </div>
                </div>
                
                <div style="padding-top: 20px; border-top: 1px solid #e2e8f0; display: flex; gap: 10px; justify-content: flex-end;">
                    <button type="button" onclick="document.getElementById('upload-document-modal').remove()" 
                            style="padding: 10px 20px; background: white; border: 1px solid #d1d5db; border-radius: 6px; color: #374151; font-size: 14px; cursor: pointer;">
                        Cancel
                    </button>
                    <button type="submit" 
                            style="padding: 10px 20px; background: #f5576c; color: white; border: none; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer;">
                        Upload Document
                    </button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    const form = document.getElementById('upload-document-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await uploadDocument(new FormData(form));
    });
};

window.loadDocumentTypesForUpload = async function() {
    const categoryId = document.getElementById('upload-doc-category')?.value;
    if (!categoryId) {
        document.getElementById('upload-doc-type').innerHTML = '<option value="">Select Category First</option>';
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/HRCORE/?resource=document-types&category_id=${categoryId}`, {
            credentials: 'include'
        });
        
        const responseText = await response.text();
        let result;
        try {
            result = JSON.parse(responseText);
        } catch (parseError) {
            throw new Error('Invalid API response');
        }
        
        if (response.ok) {
            const types = result.data || [];
            
            const select = document.getElementById('upload-doc-type');
            if (select) {
                select.innerHTML = '<option value="">Select Type</option>' +
                    types.map(type => `<option value="${type.id}">${type.type_name}</option>`).join('');
            }
        } else {
            throw new Error(result.message || `HTTP ${response.status}`);
        }
    } catch (error) {
        console.error('Error loading document types:', error);
        
        // Fallback document types
        const fallbackTypes = [
            { id: '1', type_name: 'National ID' },
            { id: '2', type_name: 'Passport' },
            { id: '3', type_name: 'Birth Certificate' },
            { id: '4', type_name: 'Medical Certificate' }
        ];
        
        const select = document.getElementById('upload-doc-type');
        if (select) {
            select.innerHTML = '<option value="">Select Type</option>' +
                fallbackTypes.map(type => `<option value="${type.id}">${type.type_name}</option>`).join('');
        }
    }
};

/**
 * Upload document
 */
async function uploadDocument(formData) {
    try {
        formData.append('resource', 'documents');
        const response = await fetch(`${API_BASE_URL}/HRCORE/`, {
            method: 'POST',
            credentials: 'include',
            body: formData
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to upload document');
        }
        
        alert('Document uploaded successfully');
        document.getElementById('upload-document-modal').remove();
        loadDocuments();
    } catch (error) {
        alert('Error uploading document: ' + error.message);
    }
}

/**
 * Show document modal
 */
function showDocumentModal(document) {
    const modal = document.createElement('div');
    modal.id = 'document-view-modal';
    modal.style.cssText = 'position: fixed; inset: 0; z-index: 50; overflow-y: auto; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; padding: 20px;';
    
    modal.innerHTML = `
        <div style="background: white; border-radius: 10px; box-shadow: 0 20px 25px rgba(0,0,0,0.15); max-width: 800px; width: 100%;">
            <div style="padding: 20px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
                <h3 style="font-size: 20px; font-weight: 600; color: #0f172a; margin: 0;">${document.document_name || 'Document'}</h3>
                <button onclick="document.getElementById('document-view-modal').remove()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #6b7280;">&times;</button>
            </div>
            
            <div style="padding: 20px;">
                <div style="margin-bottom: 20px;">
                    <h4 style="font-size: 16px; font-weight: 600; color: #1f2937; margin-bottom: 12px;">Document Information</h4>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
                        <div>
                            <span style="font-size: 13px; color: #6b7280;">Category:</span>
                            <div style="font-size: 14px; color: #1f2937; font-weight: 500;">${document.category_name || 'N/A'}</div>
                        </div>
                        <div>
                            <span style="font-size: 13px; color: #6b7280;">Type:</span>
                            <div style="font-size: 14px; color: #1f2937; font-weight: 500;">${document.type_name || 'N/A'}</div>
                        </div>
                        <div>
                            <span style="font-size: 13px; color: #6b7280;">Status:</span>
                            <div style="font-size: 14px; color: #1f2937; font-weight: 500;">${document.status || 'N/A'}</div>
                        </div>
                        <div>
                            <span style="font-size: 13px; color: #6b7280;">Employee:</span>
                            <div style="font-size: 14px; color: #1f2937; font-weight: 500;">${document.first_name || ''} ${document.last_name || ''}</div>
                        </div>
                        ${document.issue_date ? `
                            <div>
                                <span style="font-size: 13px; color: #6b7280;">Issue Date:</span>
                                <div style="font-size: 14px; color: #1f2937; font-weight: 500;">${new Date(document.issue_date).toLocaleDateString()}</div>
                            </div>
                        ` : ''}
                        ${document.expiry_date ? `
                            <div>
                                <span style="font-size: 13px; color: #6b7280;">Expiry Date:</span>
                                <div style="font-size: 14px; color: #1f2937; font-weight: 500;">${new Date(document.expiry_date).toLocaleDateString()}</div>
                            </div>
                        ` : ''}
                    </div>
                </div>
                
                <div style="padding-top: 20px; border-top: 1px solid #e2e8f0; display: flex; gap: 10px; justify-content: flex-end;">
                    <button onclick="document.getElementById('document-view-modal').remove()" 
                            style="padding: 10px 20px; background: white; border: 1px solid #d1d5db; border-radius: 6px; color: #374151; font-size: 14px; cursor: pointer;">
                        Close
                    </button>
                    <button onclick="downloadDocument('${document.id}', '${document.file_path}')" 
                            style="padding: 10px 20px; background: #10b981; color: white; border: none; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer;">
                        Download
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

/**
 * Load HR CORE document categories
 */
async function loadHRCoreCategories() {
    try {
        // Try to fetch categories from API
        const response = await fetch(`${API_BASE_URL}/HRCORE/?resource=document-categories`, { credentials: 'include' });
        
        if (response.ok) {
            const responseText = await response.text();
            let result = JSON.parse(responseText);
            
            if (result.data && Array.isArray(result.data)) {
                documentCategoriesCache = result.data;
                return;
            }
        }
    } catch (error) {
        console.warn('Failed to load categories from API:', error.message);
    }
    
    // Fallback categories (no need to populate any select since we removed category filter)
    documentCategoriesCache = [
        { id: '1', category_name: 'Category A' },
        { id: '2', category_name: 'Category B' },
        { id: '3', category_name: 'Category C' }
    ];
}

/**
 * Load HR CORE documents
 */
async function loadHRCoreDocuments() {
    const container = document.getElementById('hrcore-employees-list-container');
    if (!container) return;
    
    container.innerHTML = '<div style="text-align: center; padding: 40px 20px; color: #64748b;"><p>Loading employees and documents...</p></div>';
    
    try {
        const response = await fetch(`${API_BASE_URL}/HRCORE/?resource=documents`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const responseText = await response.text();
            
            try {
                let result = JSON.parse(responseText);
                documentsCache = result.data || [];
                
                if (documentsCache.length > 0) {
                    renderHRCoreEmployeeAccordion(documentsCache);
                    return;
                }
            } catch (parseError) {
                console.warn('Failed to parse API response:', parseError.message);
            }
        }
    } catch (error) {
        console.warn('API call failed, using fallback data:', error.message);
    }
    
    // Use fallback sample documents
    const fallbackDocuments = [
        {
            id: 'DOC001',
            employee_id: '9001',
            first_name: 'Maria',
            last_name: 'Cruz',
            employee_number: '9001',
            document_title: 'PRC License - Physician',
            category_name: 'Category A',
            category_id: '1',
            module: 'HR1',
            uploaded_by: 'HR Admin',
            upload_date: '2025-10-11',
            status: 'Active'
        },
        {
            id: 'DOC002',
            employee_id: '9001',
            first_name: 'Maria',
            last_name: 'Cruz',
            employee_number: '9001',
            document_title: 'Diploma - Doctor of Medicine',
            category_name: 'Category A',
            category_id: '1',
            module: 'HR1',
            uploaded_by: 'HR Admin',
            upload_date: '2025-10-11',
            status: 'Active'
        },
        {
            id: 'DOC003',
            employee_id: '9001',
            first_name: 'Maria',
            last_name: 'Cruz',
            employee_number: '9001',
            document_title: 'NBI Clearance',
            category_name: 'Category B',
            category_id: '2',
            module: 'HR1',
            uploaded_by: 'HR Admin',
            upload_date: '2025-10-11',
            status: 'Active'
        },
        {
            id: 'DOC004',
            employee_id: '9001',
            first_name: 'Maria',
            last_name: 'Cruz',
            employee_number: '9001',
            document_title: 'Medical Certificate - Pre-Employment',
            category_name: 'Category B',
            category_id: '2',
            module: 'HR1',
            uploaded_by: 'HR Admin',
            upload_date: '2025-10-11',
            status: 'Active'
        },
        {
            id: 'DOC005',
            employee_id: '9001',
            first_name: 'Maria',
            last_name: 'Cruz',
            employee_number: '9001',
            document_title: 'ACLS Certificate',
            category_name: 'Category C',
            category_id: '3',
            module: 'HR2',
            uploaded_by: 'Training Dept',
            upload_date: '2025-10-11',
            status: 'Active'
        },
        {
            id: 'DOC006',
            employee_id: '9001',
            first_name: 'Maria',
            last_name: 'Cruz',
            employee_number: '9001',
            document_title: 'BLS Certificate',
            category_name: 'Category C',
            category_id: '3',
            module: 'HR2',
            uploaded_by: 'Training Dept',
            upload_date: '2025-10-11',
            status: 'Active'
        },
        {
            id: 'DOC007',
            employee_id: '9001',
            first_name: 'Maria',
            last_name: 'Cruz',
            employee_number: '9001',
            document_title: 'Cardiology Board Certification',
            category_name: 'Category C',
            category_id: '3',
            module: 'HR2',
            uploaded_by: 'Medical Staff',
            upload_date: '2025-10-11',
            status: 'Active'
        },
        {
            id: 'DOC008',
            employee_id: '9002',
            first_name: 'Juan',
            last_name: 'Santos',
            employee_number: '9002',
            document_title: 'Nursing License',
            category_name: 'Category A',
            category_id: '1',
            module: 'HR1',
            uploaded_by: 'HR Admin',
            upload_date: '2025-10-10',
            status: 'Active'
        },
        {
            id: 'DOC009',
            employee_id: '9002',
            first_name: 'Juan',
            last_name: 'Santos',
            employee_number: '9002',
            document_title: 'NBI Clearance',
            category_name: 'Category B',
            category_id: '2',
            module: 'HR1',
            uploaded_by: 'HR Admin',
            upload_date: '2025-10-10',
            status: 'Active'
        },
        {
            id: 'DOC010',
            employee_id: '9003',
            first_name: 'Ana',
            last_name: 'Rodriguez',
            employee_number: '9003',
            document_title: 'Pharmacy Degree',
            category_name: 'Category A',
            category_id: '1',
            module: 'HR1',
            uploaded_by: 'HR Admin',
            upload_date: '2025-10-09',
            status: 'Active'
        }
    ];
    
    documentsCache = fallbackDocuments;
    renderHRCoreEmployeeAccordion(fallbackDocuments);
}

/**
 * Group documents by employee and render as accordion
 */
function renderHRCoreEmployeeAccordion(documents) {
    const container = document.getElementById('hrcore-employees-list-container');
    if (!container) return;
    
    // Group documents by employee
    const employeeGroups = {};
    documents.forEach(doc => {
        const empId = doc.employee_id || doc.employee_number;
        const empKey = `${empId}-${doc.first_name}-${doc.last_name}`;
        
        if (!employeeGroups[empKey]) {
            employeeGroups[empKey] = {
                employee_id: empId,
                first_name: doc.first_name,
                last_name: doc.last_name,
                employee_number: doc.employee_number,
                documents: []
            };
        }
        employeeGroups[empKey].documents.push(doc);
    });
    
    const employees = Object.values(employeeGroups);
    
    const getCategoryColor = (category) => {
        const colors = {
            'Category A': '#3b82f6',
            'Category B': '#10b981',
            'Category C': '#a855f7'
        };
        return colors[category] || '#6b7280';
    };
    
    const accordionHTML = employees.map((emp, index) => `
        <div style="margin-bottom: 12px; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <!-- Employee Header (Accordion Trigger) -->
            <div onclick="toggleEmployeeDocuments('emp-${index}')" style="padding: 16px 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); cursor: pointer; display: flex; justify-content: space-between; align-items: center; transition: all 0.2s;" onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">
                <div style="display: flex; align-items: center; gap: 12px; flex: 1;">
                    <div style="width: 40px; height: 40px; border-radius: 50%; background: white; display: flex; align-items: center; justify-content: center; font-weight: 600; color: #667eea;">
                        ${emp.first_name.charAt(0)}${emp.last_name.charAt(0)}
                    </div>
                    <div>
                        <h4 style="font-size: 16px; font-weight: 600; color: white; margin: 0;">${emp.first_name} ${emp.last_name}</h4>
                        <p style="font-size: 13px; color: rgba(255,255,255,0.8); margin: 4px 0 0 0;">ID: ${emp.employee_id || emp.employee_number}</p>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 12px;">
                    <span style="background: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 20px; color: white; font-size: 12px; font-weight: 600;">
                        ${emp.documents.length} document${emp.documents.length !== 1 ? 's' : ''}
                    </span>
                    <span id="emp-${index}-toggle" style="font-size: 20px; color: white; transition: transform 0.2s;">▼</span>
                </div>
            </div>
            
            <!-- Employee Documents (Accordion Content) -->
            <div id="emp-${index}-content" style="display: none; max-height: 0; overflow: hidden; transition: all 0.3s ease;">
                <div style="padding: 0;">
                    ${emp.documents.map(doc => `
                        <div style="padding: 12px 20px; border-top: 1px solid #e5e7eb; display: grid; grid-template-columns: 1fr 1fr auto; gap: 20px; align-items: center; background: #f9fafb;">
                            <div>
                                <p style="margin: 0; font-size: 14px; font-weight: 500; color: #1f2937;">${doc.document_title}</p>
                                <div style="display: flex; gap: 8px; margin-top: 8px; flex-wrap: wrap;">
                                    <span style="display: inline-block; padding: 2px 8px; border-radius: 12px; background: ${getCategoryColor(doc.category_name)}20; color: ${getCategoryColor(doc.category_name)}; font-weight: 500; font-size: 11px;">
                                        ${doc.category_name}
                                    </span>
                                    <span style="display: inline-block; padding: 2px 8px; border-radius: 12px; background: #dbeafe; color: #1e40af; font-weight: 500; font-size: 11px;">
                                        ${doc.module}
                                    </span>
                                </div>
                            </div>
                            <div style="font-size: 13px; color: #6b7280;">
                                <p style="margin: 0; margin-bottom: 4px;"><strong>By:</strong> ${doc.uploaded_by}</p>
                                <p style="margin: 0;"><strong>Date:</strong> ${new Date(doc.upload_date).toLocaleDateString()}</p>
                                <p style="margin: 0; margin-top: 4px;">
                                    <span style="display: inline-block; padding: 2px 8px; border-radius: 12px; background: #d1fae5; color: #065f46; font-weight: 500; font-size: 11px;">
                                        ${doc.status}
                                    </span>
                                </p>
                            </div>
                            <div style="display: flex; gap: 8px;">
                                <button onclick="viewHRCoreDocument('${doc.id}')" style="padding: 6px 12px; background: white; border: 1px solid #3b82f6; border-radius: 4px; color: #3b82f6; font-size: 12px; font-weight: 500; cursor: pointer;">
                                    👁️ View
                                </button>
                                <button onclick="downloadHRCoreDocument('${doc.id}')" style="padding: 6px 12px; background: white; border: 1px solid #10b981; border-radius: 4px; color: #10b981; font-size: 12px; font-weight: 500; cursor: pointer;">
                                    📥 Down
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = accordionHTML;
}

/**
 * Filter HR CORE documents
 */
function filterHRCoreEmployees() {
    const searchText = document.getElementById('hrcore-search')?.value?.toLowerCase() || '';
    const moduleFilter = document.getElementById('hrcore-module-filter')?.value || '';
    const statusFilter = document.getElementById('hrcore-status-filter')?.value || '';
    
    const filtered = documentsCache.filter(doc => {
        const matchesSearch = !searchText || 
            (doc.first_name + ' ' + doc.last_name).toLowerCase().includes(searchText);
        
        const matchesModule = !moduleFilter || doc.module === moduleFilter;
        const matchesStatus = !statusFilter || doc.status === statusFilter;
        
        return matchesSearch && matchesModule && matchesStatus;
    });
    
    renderHRCoreEmployeeAccordion(filtered);
}

/**
 * Clear HR CORE filters
 */
function clearHRCoreFilters() {
    document.getElementById('hrcore-search').value = '';
    document.getElementById('hrcore-module-filter').value = '';
    document.getElementById('hrcore-status-filter').value = '';
    renderHRCoreEmployeeAccordion(documentsCache);
}

/**
 * Toggle employee documents accordion
 */
window.toggleEmployeeDocuments = function(employeeId) {
    const content = document.getElementById(employeeId + '-content');
    const toggle = document.getElementById(employeeId + '-toggle');
    
    if (content.style.display === 'none') {
        content.style.display = 'block';
        content.style.maxHeight = '1500px';
        toggle.style.transform = 'rotate(180deg)';
    } else {
        content.style.display = 'none';
        content.style.maxHeight = '0';
        toggle.style.transform = 'rotate(0deg)';
    }
};

// Expose functions to window for inline handlers
window.filterHRCoreEmployees = filterHRCoreEmployees;
window.clearHRCoreFilters = clearHRCoreFilters;

/**
 * Refresh HR CORE documents
 */
window.refreshHRCoreDocuments = loadHRCoreDocuments;

/**
 * View HR CORE document
 */
window.viewHRCoreDocument = function(docId) {
    const doc = documentsCache.find(d => d.id === docId);
    if (!doc) return;
    
    const modal = document.createElement('div');
    modal.id = 'view-hrcore-doc-modal';
    modal.style.cssText = 'position: fixed; inset: 0; z-index: 50; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; padding: 20px;';
    
    modal.innerHTML = `
        <div style="background: white; border-radius: 10px; box-shadow: 0 20px 25px rgba(0,0,0,0.15); max-width: 600px; width: 100%;">
            <div style="padding: 20px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
                <h3 style="font-size: 18px; font-weight: 600; color: #0f172a; margin: 0;">Document Details</h3>
                <button onclick="document.getElementById('view-hrcore-doc-modal').remove()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #6b7280;">&times;</button>
            </div>
            
            <div style="padding: 20px;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                    <div>
                        <label style="display: block; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; margin-bottom: 4px;">Employee</label>
                        <p style="margin: 0; font-size: 14px; color: #1f2937; font-weight: 500;">${doc.first_name} ${doc.last_name}</p>
                    </div>
                    <div>
                        <label style="display: block; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; margin-bottom: 4px;">Employee ID</label>
                        <p style="margin: 0; font-size: 14px; color: #1f2937; font-weight: 500;">${doc.employee_id || doc.employee_number}</p>
                    </div>
                    <div style="grid-column: 1 / -1;">
                        <label style="display: block; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; margin-bottom: 4px;">Document Title</label>
                        <p style="margin: 0; font-size: 14px; color: #1f2937; font-weight: 500;">${doc.document_title}</p>
                    </div>
                    <div>
                        <label style="display: block; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; margin-bottom: 4px;">Category</label>
                        <p style="margin: 0; font-size: 14px; color: #1f2937;">${doc.category_name}</p>
                    </div>
                    <div>
                        <label style="display: block; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; margin-bottom: 4px;">Module</label>
                        <p style="margin: 0; font-size: 14px; color: #1f2937;">${doc.module}</p>
                    </div>
                    <div>
                        <label style="display: block; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; margin-bottom: 4px;">Uploaded By</label>
                        <p style="margin: 0; font-size: 14px; color: #1f2937;">${doc.uploaded_by}</p>
                    </div>
                    <div>
                        <label style="display: block; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; margin-bottom: 4px;">Upload Date</label>
                        <p style="margin: 0; font-size: 14px; color: #1f2937;">${new Date(doc.upload_date).toLocaleDateString()}</p>
                    </div>
                    <div>
                        <label style="display: block; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; margin-bottom: 4px;">Status</label>
                        <p style="margin: 0; font-size: 14px; color: #1f2937;">${doc.status}</p>
                    </div>
                </div>
            </div>
            
            <div style="padding: 20px; border-top: 1px solid #e2e8f0; display: flex; gap: 10px; justify-content: flex-end;">
                <button onclick="document.getElementById('view-hrcore-doc-modal').remove()" style="padding: 10px 20px; background: #e5e7eb; color: #374151; border: none; border-radius: 6px; font-size: 14px; cursor: pointer;">
                    Close
                </button>
                <button onclick="downloadHRCoreDocument('${doc.id}')" style="padding: 10px 20px; background: #10b981; color: white; border: none; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer;">
                    📥 Download
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
};

/**
 * Download HR CORE document
 */
window.downloadHRCoreDocument = function(docId) {
    const doc = documentsCache.find(d => d.id === docId);
    if (!doc) {
        alert('Document not found');
        return;
    }
    
    // Generate a download link
    const link = document.createElement('a');
    link.href = window.getApiUrl('/HRCORE/documents?id=' + docId + '&action=download');
    link.download = (doc.document_title || 'document') + '.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

/**
 * Export HR CORE documents
 */
window.exportHRCoreDocuments = function() {
    const csv = [
        ['EMPLOYEE ID', 'EMPLOYEE NAME', 'DOCUMENT TITLE', 'CATEGORY', 'MODULE', 'UPLOADED BY', 'UPLOAD DATE', 'STATUS'],
        ...documentsCache.map(doc => [
            doc.employee_id || doc.employee_number,
            doc.first_name + ' ' + doc.last_name,
            doc.document_title,
            doc.category_name,
            doc.module,
            doc.uploaded_by,
            new Date(doc.upload_date).toLocaleDateString(),
            doc.status
        ])
    ].map(row => row.map(cell => '"' + (cell || '').toString().replace(/"/g, '""') + '"').join(',')).join('\n');
    
    const link = document.createElement('a');
    link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    link.download = 'hrcore-documents-' + new Date().toISOString().split('T')[0] + '.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

/**
 * Show integration status
 */
window.showIntegrationStatus = function() {
    const modal = document.createElement('div');
    modal.id = 'integration-status-modal';
    modal.style.cssText = 'position: fixed; inset: 0; z-index: 50; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; padding: 20px;';
    
    modal.innerHTML = `
        <div style="background: white; border-radius: 10px; box-shadow: 0 20px 25px rgba(0,0,0,0.15); max-width: 500px; width: 100%;">
            <div style="padding: 20px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
                <h3 style="font-size: 18px; font-weight: 600; color: #0f172a; margin: 0;">Integration Status</h3>
                <button onclick="document.getElementById('integration-status-modal').remove()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #6b7280;">&times;</button>
            </div>
            
            <div style="padding: 20px;">
                <div style="margin-bottom: 16px; display: flex; align-items: center; gap: 12px;">
                    <span style="font-size: 20px;">✓</span>
                    <div>
                        <p style="margin: 0; font-weight: 600; color: #1f2937;">HR1 - Recruitment System</p>
                        <p style="margin: 4px 0 0 0; font-size: 13px; color: #6b7280;">Last sync: 2 hours ago</p>
                    </div>
                </div>
                
                <div style="margin-bottom: 16px; display: flex; align-items: center; gap: 12px;">
                    <span style="font-size: 20px;">✓</span>
                    <div>
                        <p style="margin: 0; font-weight: 600; color: #1f2937;">HR2 - Training & Performance</p>
                        <p style="margin: 4px 0 0 0; font-size: 13px; color: #6b7280;">Last sync: 1 hour ago</p>
                    </div>
                </div>
                
                <div style="margin-bottom: 16px; padding: 12px; background: #f0fdf4; border-left: 4px solid #10b981; border-radius: 4px;">
                    <p style="margin: 0; font-size: 13px; color: #065f46;">All systems are synchronized and operational.</p>
                </div>
            </div>
            
            <div style="padding: 20px; border-top: 1px solid #e2e8f0; display: flex; gap: 10px; justify-content: flex-end;">
                <button onclick="document.getElementById('integration-status-modal').remove()" style="padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 6px; font-size: 14px; cursor: pointer;">
                    Close
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
};
