/**
 * HMO Module - Providers Section
 * Manages HMO provider partnerships and information
 */

import { showEnhancedConfirmationModal, showInlineAlert, showLoadingState, showEmptyState, showErrorState, closeModal, openModal, getStatusBadge } from './payroll-modals.js';

const API_BASE_URL = '/hospital_4/api';
const REST_API_URL = `${API_BASE_URL}/`;

let hmoProvidersCache = [];

/**
 * Displays the HMO Providers section
 */
export async function displayHMOProvidersSection() {
    console.log("[HMO] Displaying HMO Providers Section...");

    const container = document.getElementById('hmoProvidersContainer');
    if (!container) return;

    showLoadingState('hmoProvidersContainer', 'Loading HMO providers...');

    try {
        const response = await fetch(`${REST_API_URL}hmo/hmo.php?resource=providers`, {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                window.location.href = '/hospital_4/index.php';
                return;
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        const providers = result.success ? (result.data?.providers || result.data || []) : [];
        
        hmoProvidersCache = providers;

        const activeCount = providers.filter(p => p.IsActive === 1).length;

        container.innerHTML = `
            <div style="background: white; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden;">
                <!-- Header -->
                <div style="background: linear-gradient(to right, #f97316, #ea580c); color: white; padding: 20px; border-radius: 10px 10px 0 0;">
                    <div style="display: flex; justify-content: space-between; align-items: center; gap: 20px;">
                        <div>
                            <h2 style="font-size: 24px; font-weight: 700; margin: 0 0 5px 0;">HMO Providers</h2>
                            <p style="font-size: 13px; color: rgba(255,255,255,0.8); margin: 0;">Manage health insurance provider partnerships</p>
                        </div>
                        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                            <button onclick="refreshHMOProviders()" style="padding: 8px 16px; background: rgba(255,255,255,0.2); color: white; border: none; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 8px;">
                                🔄 Refresh
                            </button>
                            <button onclick="exportHMOProvidersCSV()" style="padding: 8px 16px; background: rgba(255,255,255,0.2); color: white; border: none; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 8px;">
                                📊 Export
                            </button>
                            <button onclick="showAddHMOProviderModal()" style="padding: 8px 16px; background: white; color: #f97316; border: none; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 8px;">
                                ➕ Add Provider
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Summary Statistics -->
                <div style="padding: 15px 20px; background: #fef3f0; border-bottom: 1px solid #fed7ce; display: flex; gap: 20px;">
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <span style="font-size: 20px;">🏥</span>
                        <div>
                            <div style="font-size: 12px; color: #9ca3af;">Total Providers</div>
                            <div style="font-size: 18px; font-weight: 700; color: #f97316;">${providers.length}</div>
                        </div>
                    </div>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <span style="font-size: 20px;">✅</span>
                        <div>
                            <div style="font-size: 12px; color: #9ca3af;">Active</div>
                            <div style="font-size: 18px; font-weight: 700; color: #16a34a;">${activeCount}</div>
                        </div>
                    </div>
                </div>

                <!-- Search and Filters -->
                <div style="padding: 15px 20px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; display: flex; gap: 10px; flex-wrap: wrap;">
                    <input id="hmo-provider-search" type="text" placeholder="Search providers, contact, email..." 
                           style="padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px; flex: 1; min-width: 200px; font-size: 14px;">
                    <select id="hmo-provider-status-filter" style="padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 14px;">
                        <option value="">All Statuses</option>
                        <option value="1">Active</option>
                        <option value="0">Inactive</option>
                    </select>
                </div>

                <!-- Table -->
                <div style="overflow-x: auto;">
                    <table style="width: 100%; border-collapse: collapse;" id="hmo-providers-table">
                        <thead style="background: #f0fdf4; border-bottom: 2px solid #e2e8f0;">
                            <tr>
                                <th style="padding: 12px 15px; text-align: left; font-size: 12px; font-weight: 600; color: #9ca3af; text-transform: uppercase;">Provider Name</th>
                                <th style="padding: 12px 15px; text-align: left; font-size: 12px; font-weight: 600; color: #9ca3af; text-transform: uppercase;">Contact Person</th>
                                <th style="padding: 12px 15px; text-align: left; font-size: 12px; font-weight: 600; color: #9ca3af; text-transform: uppercase;">Email</th>
                                <th style="padding: 12px 15px; text-align: left; font-size: 12px; font-weight: 600; color: #9ca3af; text-transform: uppercase;">Phone</th>
                                <th style="padding: 12px 15px; text-align: left; font-size: 12px; font-weight: 600; color: #9ca3af; text-transform: uppercase;">Status</th>
                                <th style="padding: 12px 15px; text-align: right; font-size: 12px; font-weight: 600; color: #9ca3af; text-transform: uppercase;">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="hmo-providers-tbody" style="border-top: 1px solid #e2e8f0;"></tbody>
                    </table>
                </div>
            </div>

            <!-- Modal Container -->
            <div id="hmo-modal-container"></div>
        `;

        populateHMOProvidersTable(providers);
        setupHMOProviderEventListeners();
    } catch (error) {
        console.error('Error loading HMO providers:', error);
        showErrorState('hmoProvidersContainer', error.message);
    }
}

function populateHMOProvidersTable(providers) {
    const tbody = document.getElementById('hmo-providers-tbody');
    if (!tbody) return;

    if (!providers || providers.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="padding: 40px 20px; text-align: center;">
                    <div style="font-size: 50px; margin-bottom: 15px;">🏥</div>
                    <h3 style="font-size: 16px; font-weight: 600; color: #111827; margin: 0 0 8px 0;">No HMO providers found</h3>
                    <p style="color: #9ca3af; font-size: 14px; margin: 0;">Add a new provider to get started</p>
                    <button onclick="showAddHMOProviderModal()" style="margin-top: 15px; padding: 10px 16px; background: #f97316; color: white; border: none; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer;">
                        ➕ Add Your First Provider
                    </button>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = providers.map((p, index) => {
        const isActive = p.IsActive === 1;
        const statusBadge = isActive 
            ? '<span style="display: inline-block; padding: 4px 12px; border-radius: 4px; background: #dcfce7; color: #166534; font-size: 12px; font-weight: 500;">✓ Active</span>'
            : '<span style="display: inline-block; padding: 4px 12px; border-radius: 4px; background: #fee2e2; color: #991b1b; font-size: 12px; font-weight: 500;">✕ Inactive</span>';
        
        return `
            <tr style="border-bottom: 1px solid #f3f4f6; background: ${index % 2 === 0 ? '#ffffff' : '#f9fafb'};">
                <td style="padding: 12px 15px; font-size: 13px;">
                    <div style="font-weight: 500; color: #111827;">${p.ProviderName || 'N/A'}</div>
                    ${p.CompanyName ? `<div style="font-size: 12px; color: #9ca3af;">${p.CompanyName}</div>` : ''}
                </td>
                <td style="padding: 12px 15px; font-size: 13px; color: #374151;">${p.ContactPerson || 'N/A'}</td>
                <td style="padding: 12px 15px; font-size: 13px; color: #374151;">${p.ContactEmail || 'N/A'}</td>
                <td style="padding: 12px 15px; font-size: 13px; color: #374151;">${p.ContactPhone || 'N/A'}</td>
                <td style="padding: 12px 15px; font-size: 13px;">${statusBadge}</td>
                <td style="padding: 12px 15px; text-align: right;">
                    <div style="display: flex; gap: 8px; justify-content: flex-end;">
                        <button onclick="viewHMOProviderDetails(${p.ProviderID})" style="background: none; border: none; color: #2563eb; cursor: pointer; font-size: 14px; text-decoration: underline;">👁️ View</button>
                        <button onclick="editHMOProvider(${p.ProviderID})" style="background: none; border: none; color: #7c3aed; cursor: pointer; font-size: 14px; text-decoration: underline;">✏️ Edit</button>
                        <button onclick="deleteHMOProvider(${p.ProviderID})" style="background: none; border: none; color: #dc2626; cursor: pointer; font-size: 14px; text-decoration: underline;">🗑️ Delete</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function setupHMOProviderEventListeners() {
    const searchInput = document.getElementById('hmo-provider-search');
    const statusFilter = document.getElementById('hmo-provider-status-filter');

    if (searchInput) {
        searchInput.addEventListener('input', applyHMOProviderFilters);
    }
    if (statusFilter) {
        statusFilter.addEventListener('change', applyHMOProviderFilters);
    }
}

function applyHMOProviderFilters() {
    const searchTerm = (document.getElementById('hmo-provider-search')?.value || '').toLowerCase().trim();
    const statusFilter = document.getElementById('hmo-provider-status-filter')?.value || '';

    const filtered = hmoProvidersCache.filter(p => {
        if (statusFilter !== '') {
            const isActive = parseInt(statusFilter) === 1;
            if ((p.IsActive === 1) !== isActive) return false;
        }
        if (!searchTerm) return true;
        return (p.ProviderName || '').toLowerCase().includes(searchTerm) ||
               (p.ContactPerson || '').toLowerCase().includes(searchTerm) ||
               (p.ContactEmail || '').toLowerCase().includes(searchTerm);
    });

    populateHMOProvidersTable(filtered);
}

// Global window functions
window.refreshHMOProviders = function() {
    displayHMOProvidersSection();
};

window.exportHMOProvidersCSV = function() {
    if (!hmoProvidersCache || hmoProvidersCache.length === 0) {
        showInlineAlert('No providers to export', 'warning');
        return;
    }

    const headers = ['Provider Name', 'Company Name', 'Contact Person', 'Email', 'Phone', 'Status'];
    const rows = hmoProvidersCache.map(p => [
        p.ProviderName || '',
        p.CompanyName || '',
        p.ContactPerson || '',
        p.ContactEmail || '',
        p.ContactPhone || '',
        p.IsActive === 1 ? 'Active' : 'Inactive'
    ]);

    let csv = headers.join(',') + '\n';
    rows.forEach(row => {
        csv += row.map(cell => `"${cell}"`).join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `hmo-providers-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showInlineAlert('Providers exported successfully!', 'success');
};

window.showAddHMOProviderModal = function() {
    const modalContainer = document.getElementById('hmo-modal-container') || document.body;
    
    const modal = document.createElement('div');
    modal.id = 'add-provider-modal';
    modal.style.cssText = 'position: fixed; inset: 0; z-index: 60; display: flex; justify-content: center; align-items: center; background: rgba(0,0,0,0.5); padding: 15px;';
    
    modal.innerHTML = `
        <div style="background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 20px 25px rgba(0,0,0,0.15); width: 100%; max-width: 600px;">
            <div style="padding: 20px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center;">
                <h3 style="font-size: 18px; font-weight: 600; color: #111827; margin: 0;">Add HMO Provider</h3>
                <button onclick="document.getElementById('add-provider-modal')?.remove()" style="background: none; border: none; color: #9ca3af; font-size: 24px; cursor: pointer; padding: 0;">✕</button>
            </div>
            <form id="addProviderForm" style="padding: 20px; display: flex; flex-direction: column; gap: 15px;">
                <div>
                    <label style="display: block; font-size: 13px; font-weight: 500; color: #374151; margin-bottom: 6px;">Provider Name *</label>
                    <input name="provider_name" type="text" placeholder="Enter provider name" required style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;" />
                </div>
                <div>
                    <label style="display: block; font-size: 13px; font-weight: 500; color: #374151; margin-bottom: 6px;">Company Name</label>
                    <input name="company_name" type="text" placeholder="Enter company name" style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;" />
                </div>
                <div>
                    <label style="display: block; font-size: 13px; font-weight: 500; color: #374151; margin-bottom: 6px;">Contact Person</label>
                    <input name="contact_person" type="text" placeholder="Enter contact person name" style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;" />
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div>
                        <label style="display: block; font-size: 13px; font-weight: 500; color: #374151; margin-bottom: 6px;">Contact Email</label>
                        <input name="contact_email" type="email" placeholder="provider@email.com" style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;" />
                    </div>
                    <div>
                        <label style="display: block; font-size: 13px; font-weight: 500; color: #374151; margin-bottom: 6px;">Contact Phone</label>
                        <input name="contact_phone" type="tel" placeholder="+63-9XXXXXXXXX" style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;" />
                    </div>
                </div>
                <div>
                    <label style="display: block; font-size: 13px; font-weight: 500; color: #374151; margin-bottom: 6px;">Status</label>
                    <select name="is_active" style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;">
                        <option value="1">Active</option>
                        <option value="0">Inactive</option>
                    </select>
                </div>
                <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 10px;">
                    <button type="button" onclick="document.getElementById('add-provider-modal')?.remove()" style="padding: 10px 16px; background: white; color: #374151; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer;">Cancel</button>
                    <button type="submit" style="padding: 10px 16px; background: #f97316; color: white; border: none; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer;">Save Provider</button>
                </div>
            </form>
        </div>
    `;

    modalContainer.appendChild(modal);

    document.getElementById('addProviderForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const payload = Object.fromEntries(formData);

        try {
            const response = await fetch(`${REST_API_URL}hmo/hmo.php?resource=providers`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            if (result.success) {
                document.getElementById('add-provider-modal')?.remove();
                showInlineAlert('Provider added successfully!', 'success');
                displayHMOProvidersSection();
            } else {
                showInlineAlert(result.message || 'Failed to add provider', 'error');
            }
        } catch (error) {
            console.error('Error adding provider:', error);
            showInlineAlert('Error adding provider: ' + error.message, 'error');
        }
    });
};

window.editHMOProvider = function(providerId) {
    const provider = hmoProvidersCache.find(p => p.ProviderID === providerId);
    if (!provider) {
        showInlineAlert('Provider not found', 'error');
        return;
    }

    const modalContainer = document.getElementById('hmo-modal-container') || document.body;
    
    const modal = document.createElement('div');
    modal.id = 'edit-provider-modal';
    modal.style.cssText = 'position: fixed; inset: 0; z-index: 60; display: flex; justify-content: center; align-items: center; background: rgba(0,0,0,0.5); padding: 15px;';
    
    modal.innerHTML = `
        <div style="background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 20px 25px rgba(0,0,0,0.15); width: 100%; max-width: 600px;">
            <div style="padding: 20px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center;">
                <h3 style="font-size: 18px; font-weight: 600; color: #111827; margin: 0;">Edit HMO Provider</h3>
                <button onclick="document.getElementById('edit-provider-modal')?.remove()" style="background: none; border: none; color: #9ca3af; font-size: 24px; cursor: pointer; padding: 0;">✕</button>
            </div>
            <form id="editProviderForm" style="padding: 20px; display: flex; flex-direction: column; gap: 15px;">
                <input type="hidden" name="id" value="${providerId}" />
                <div>
                    <label style="display: block; font-size: 13px; font-weight: 500; color: #374151; margin-bottom: 6px;">Provider Name *</label>
                    <input name="provider_name" type="text" value="${provider.ProviderName || ''}" required style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;" />
                </div>
                <div>
                    <label style="display: block; font-size: 13px; font-weight: 500; color: #374151; margin-bottom: 6px;">Company Name</label>
                    <input name="company_name" type="text" value="${provider.CompanyName || ''}" style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;" />
                </div>
                <div>
                    <label style="display: block; font-size: 13px; font-weight: 500; color: #374151; margin-bottom: 6px;">Contact Person</label>
                    <input name="contact_person" type="text" value="${provider.ContactPerson || ''}" style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;" />
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div>
                        <label style="display: block; font-size: 13px; font-weight: 500; color: #374151; margin-bottom: 6px;">Contact Email</label>
                        <input name="contact_email" type="email" value="${provider.ContactEmail || ''}" style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;" />
                    </div>
                    <div>
                        <label style="display: block; font-size: 13px; font-weight: 500; color: #374151; margin-bottom: 6px;">Contact Phone</label>
                        <input name="contact_phone" type="tel" value="${provider.ContactPhone || ''}" style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;" />
                    </div>
                </div>
                <div>
                    <label style="display: block; font-size: 13px; font-weight: 500; color: #374151; margin-bottom: 6px;">Status</label>
                    <select name="is_active" style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;">
                        <option value="1" ${provider.IsActive === 1 ? 'selected' : ''}>Active</option>
                        <option value="0" ${provider.IsActive === 0 ? 'selected' : ''}>Inactive</option>
                    </select>
                </div>
                <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 10px;">
                    <button type="button" onclick="document.getElementById('edit-provider-modal')?.remove()" style="padding: 10px 16px; background: white; color: #374151; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer;">Cancel</button>
                    <button type="submit" style="padding: 10px 16px; background: #f97316; color: white; border: none; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer;">Update Provider</button>
                </div>
            </form>
        </div>
    `;

    modalContainer.appendChild(modal);

    document.getElementById('editProviderForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const payload = Object.fromEntries(formData);

        try {
            const response = await fetch(`${REST_API_URL}hmo/hmo.php?resource=providers&id=${providerId}`, {
                method: 'PUT',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            if (result.success) {
                document.getElementById('edit-provider-modal')?.remove();
                showInlineAlert('Provider updated successfully!', 'success');
                displayHMOProvidersSection();
            } else {
                showInlineAlert(result.message || 'Failed to update provider', 'error');
            }
        } catch (error) {
            console.error('Error updating provider:', error);
            showInlineAlert('Error updating provider: ' + error.message, 'error');
        }
    });
};

window.deleteHMOProvider = function(providerId) {
    const provider = hmoProvidersCache.find(p => p.ProviderID === providerId);
    if (!provider) {
        showInlineAlert('Provider not found', 'error');
        return;
    }

    showEnhancedConfirmationModal(
        'Delete Provider',
        `Are you sure you want to delete "${provider.ProviderName}"?`,
        'This action cannot be undone.',
        'Delete',
        'red',
        async () => {
            try {
                const response = await fetch(`${REST_API_URL}hmo/hmo.php?resource=providers&id=${providerId}`, {
                    method: 'DELETE',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
                    }
                });

                const result = await response.json();
                if (result.success) {
                    showInlineAlert('Provider deleted successfully!', 'success');
                    displayHMOProvidersSection();
                } else {
                    showInlineAlert(result.message || 'Failed to delete provider', 'error');
                }
            } catch (error) {
                console.error('Error deleting provider:', error);
                showInlineAlert('Error deleting provider: ' + error.message, 'error');
            }
        }
    );
};

window.viewHMOProviderDetails = function(providerId) {
    const provider = hmoProvidersCache.find(p => p.ProviderID === providerId);
    if (!provider) {
        showInlineAlert('Provider not found', 'error');
        return;
    }

    const modalContainer = document.getElementById('hmo-modal-container') || document.body;
    
    const modal = document.createElement('div');
    modal.id = 'view-provider-modal';
    modal.style.cssText = 'position: fixed; inset: 0; z-index: 60; display: flex; justify-content: center; align-items: center; background: rgba(0,0,0,0.5); padding: 15px;';
    
    modal.innerHTML = `
        <div style="background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 20px 25px rgba(0,0,0,0.15); width: 100%; max-width: 600px; max-height: 70vh; overflow-y: auto;">
            <div style="padding: 20px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; background: #fef3f0;">
                <h3 style="font-size: 18px; font-weight: 600; color: #111827; margin: 0;">Provider Details</h3>
                <button onclick="document.getElementById('view-provider-modal')?.remove()" style="background: none; border: none; color: #9ca3af; font-size: 24px; cursor: pointer; padding: 0;">✕</button>
            </div>
            <div style="padding: 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div>
                    <label style="font-size: 12px; font-weight: 600; color: #9ca3af; text-transform: uppercase;">Provider Name</label>
                    <div style="font-size: 16px; font-weight: 600; color: #111827; margin-top: 5px;">${provider.ProviderName || 'N/A'}</div>
                </div>
                <div>
                    <label style="font-size: 12px; font-weight: 600; color: #9ca3af; text-transform: uppercase;">Status</label>
                    <div style="margin-top: 5px;">
                        ${provider.IsActive === 1 
                            ? '<span style="display: inline-block; padding: 4px 12px; border-radius: 4px; background: #dcfce7; color: #166534; font-size: 12px; font-weight: 500;">✓ Active</span>'
                            : '<span style="display: inline-block; padding: 4px 12px; border-radius: 4px; background: #fee2e2; color: #991b1b; font-size: 12px; font-weight: 500;">✕ Inactive</span>'}
                    </div>
                </div>
                <div>
                    <label style="font-size: 12px; font-weight: 600; color: #9ca3af; text-transform: uppercase;">Company Name</label>
                    <div style="font-size: 14px; color: #111827; margin-top: 5px;">${provider.CompanyName || 'N/A'}</div>
                </div>
                <div>
                    <label style="font-size: 12px; font-weight: 600; color: #9ca3af; text-transform: uppercase;">Contact Person</label>
                    <div style="font-size: 14px; color: #111827; margin-top: 5px;">${provider.ContactPerson || 'N/A'}</div>
                </div>
                <div>
                    <label style="font-size: 12px; font-weight: 600; color: #9ca3af; text-transform: uppercase;">Email</label>
                    <div style="font-size: 14px; color: #0369a1; margin-top: 5px;">${provider.ContactEmail || 'N/A'}</div>
                </div>
                <div>
                    <label style="font-size: 12px; font-weight: 600; color: #9ca3af; text-transform: uppercase;">Phone</label>
                    <div style="font-size: 14px; color: #111827; margin-top: 5px;">${provider.ContactPhone || 'N/A'}</div>
                </div>
            </div>
            <div style="padding: 15px 20px; background: #f9fafb; border-top: 1px solid #e5e7eb; text-align: right;">
                <button onclick="document.getElementById('view-provider-modal')?.remove()" style="padding: 10px 16px; background: white; color: #374151; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer;">Close</button>
            </div>
        </div>
    `;

    modalContainer.appendChild(modal);
};

// ===== HMO PLANS SECTION =====

let hmoPlansCache = [];
let hmoProvidersForPlans = [];

/**
 * Displays the HMO Plans section
 */
export async function displayHMOPlansSection() {
    console.log("[HMO] Displaying HMO Plans Section...");

    const container = document.getElementById('hmoPlansContainer');
    if (!container) return;

    showLoadingState('hmoPlansContainer', 'Loading HMO plans...');

    try {
        const response = await fetch(`${REST_API_URL}hmo/hmo.php?resource=plans`, {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                window.location.href = '/hospital_4/index.php';
                return;
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        const plans = result.success ? (result.data || []) : [];
        
        // Load providers for filters
        const provResponse = await fetch(`${REST_API_URL}hmo/hmo.php?resource=providers`, {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
            }
        });

        const provResult = await provResponse.json();
        const providers = provResult.success ? (provResult.data?.providers || provResult.data || []) : [];

        hmoPlansCache = plans;
        hmoProvidersForPlans = providers;

        const activeCount = plans.filter(p => p.IsActive === 1 || p.Status === 'Active').length;

        container.innerHTML = `
            <div style="background: white; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden;">
                <!-- Header -->
                <div style="background: linear-gradient(to right, #f97316, #ea580c); color: white; padding: 20px; border-radius: 10px 10px 0 0;">
                    <div style="display: flex; justify-content: space-between; align-items: center; gap: 20px;">
                        <div>
                            <h2 style="font-size: 24px; font-weight: 700; margin: 0 0 5px 0;">HMO Benefit Plans</h2>
                            <p style="font-size: 13px; color: rgba(255,255,255,0.8); margin: 0;">Manage health insurance plans and coverage options</p>
                        </div>
                        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                            <button onclick="refreshHMOPlans()" style="padding: 8px 16px; background: rgba(255,255,255,0.2); color: white; border: none; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 8px;">
                                🔄 Refresh
                            </button>
                            <button onclick="exportHMOPlansCSV()" style="padding: 8px 16px; background: rgba(255,255,255,0.2); color: white; border: none; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 8px;">
                                📊 Export
                            </button>
                            <button onclick="showAddHMOPlanModal()" style="padding: 8px 16px; background: white; color: #f97316; border: none; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 8px;">
                                ➕ Add Plan
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Summary Statistics -->
                <div style="padding: 15px 20px; background: #fef3f0; border-bottom: 1px solid #fed7ce; display: flex; gap: 20px;">
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <span style="font-size: 20px;">📋</span>
                        <div>
                            <div style="font-size: 12px; color: #9ca3af;">Total Plans</div>
                            <div style="font-size: 18px; font-weight: 700; color: #f97316;">${plans.length}</div>
                        </div>
                    </div>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <span style="font-size: 20px;">✅</span>
                        <div>
                            <div style="font-size: 12px; color: #9ca3af;">Active</div>
                            <div style="font-size: 18px; font-weight: 700; color: #16a34a;">${activeCount}</div>
                        </div>
                    </div>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <span style="font-size: 20px;">🏥</span>
                        <div>
                            <div style="font-size: 12px; color: #9ca3af;">Providers</div>
                            <div style="font-size: 18px; font-weight: 700; color: #111827;">${providers.length}</div>
                        </div>
                    </div>
                </div>

                <!-- Search and Filters -->
                <div style="padding: 15px 20px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; display: flex; gap: 10px; flex-wrap: wrap;">
                    <input id="hmo-plan-search" type="text" placeholder="Search plans, coverage, providers..." 
                           style="padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px; flex: 1; min-width: 200px; font-size: 14px;">
                    <select id="hmo-plan-provider-filter" style="padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 14px;">
                        <option value="">All Providers</option>
                        ${providers.map(p => `<option value="${p.ProviderID}">${p.ProviderName}</option>`).join('')}
                    </select>
                    <select id="hmo-plan-status-filter" style="padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 14px;">
                        <option value="">All Statuses</option>
                        <option value="1">Active</option>
                        <option value="0">Inactive</option>
                    </select>
                </div>

                <!-- Table -->
                <div style="overflow-x: auto;">
                    <table style="width: 100%; border-collapse: collapse;" id="hmo-plans-table">
                        <thead style="background: #f0fdf4; border-bottom: 2px solid #e2e8f0;">
                            <tr>
                                <th style="padding: 12px 15px; text-align: left; font-size: 12px; font-weight: 600; color: #9ca3af; text-transform: uppercase;">Plan Name</th>
                                <th style="padding: 12px 15px; text-align: left; font-size: 12px; font-weight: 600; color: #9ca3af; text-transform: uppercase;">Provider</th>
                                <th style="padding: 12px 15px; text-align: left; font-size: 12px; font-weight: 600; color: #9ca3af; text-transform: uppercase;">Coverage</th>
                                <th style="padding: 12px 15px; text-align: left; font-size: 12px; font-weight: 600; color: #9ca3af; text-transform: uppercase;">Max Benefit</th>
                                <th style="padding: 12px 15px; text-align: left; font-size: 12px; font-weight: 600; color: #9ca3af; text-transform: uppercase;">Premium</th>
                                <th style="padding: 12px 15px; text-align: left; font-size: 12px; font-weight: 600; color: #9ca3af; text-transform: uppercase;">Status</th>
                                <th style="padding: 12px 15px; text-align: right; font-size: 12px; font-weight: 600; color: #9ca3af; text-transform: uppercase;">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="hmo-plans-tbody" style="border-top: 1px solid #e2e8f0;"></tbody>
                    </table>
                </div>
            </div>

            <!-- Modal Container -->
            <div id="hmo-plans-modal-container"></div>
        `;

        populateHMOPlansTable(plans);
        setupHMOPlansEventListeners();
    } catch (error) {
        console.error('Error loading HMO plans:', error);
        showErrorState('hmoPlansContainer', error.message);
    }
}

function populateHMOPlansTable(plans) {
    const tbody = document.getElementById('hmo-plans-tbody');
    if (!tbody) return;

    if (!plans || plans.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="padding: 40px 20px; text-align: center;">
                    <div style="font-size: 50px; margin-bottom: 15px;">📋</div>
                    <h3 style="font-size: 16px; font-weight: 600; color: #111827; margin: 0 0 8px 0;">No benefit plans found</h3>
                    <p style="color: #9ca3af; font-size: 14px; margin: 0;">Add a new plan to get started</p>
                    <button onclick="showAddHMOPlanModal()" style="margin-top: 15px; padding: 10px 16px; background: #f97316; color: white; border: none; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer;">
                        ➕ Add Your First Plan
                    </button>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = plans.map((p, index) => {
        const isActive = p.IsActive === 1 || p.Status === 'Active';
        const statusBadge = isActive 
            ? '<span style="display: inline-block; padding: 4px 12px; border-radius: 4px; background: #dcfce7; color: #166534; font-size: 12px; font-weight: 500;">✓ Active</span>'
            : '<span style="display: inline-block; padding: 4px 12px; border-radius: 4px; background: #fee2e2; color: #991b1b; font-size: 12px; font-weight: 500;">✕ Inactive</span>';
        
        const coverage = p.Coverage ? (Array.isArray(p.Coverage) ? p.Coverage : JSON.parse(p.Coverage || '[]')) : [];
        const coverageText = coverage.length > 0 ? coverage.slice(0, 3).join(', ') + (coverage.length > 3 ? '...' : '') : 'N/A';
        
        const maxBenefit = p.MaximumBenefitLimit ? `₱${parseFloat(p.MaximumBenefitLimit).toLocaleString()}` : 'N/A';
        const premium = p.PremiumCost || p.MonthlyPremium ? `₱${parseFloat(p.PremiumCost || p.MonthlyPremium).toLocaleString()}` : 'N/A';
        
        return `
            <tr style="border-bottom: 1px solid #f3f4f6; background: ${index % 2 === 0 ? '#ffffff' : '#f9fafb'};">
                <td style="padding: 12px 15px; font-size: 13px; font-weight: 500; color: #111827;">${p.PlanName || 'N/A'}</td>
                <td style="padding: 12px 15px; font-size: 13px; color: #374151;">${p.ProviderName || 'N/A'}</td>
                <td style="padding: 12px 15px; font-size: 13px; color: #374151;" title="${coverage.join(', ')}">${coverageText}</td>
                <td style="padding: 12px 15px; font-size: 13px; color: #111827; font-weight: 500;">${maxBenefit}</td>
                <td style="padding: 12px 15px; font-size: 13px; color: #111827;">${premium}</td>
                <td style="padding: 12px 15px; font-size: 13px;">${statusBadge}</td>
                <td style="padding: 12px 15px; text-align: right;">
                    <div style="display: flex; gap: 8px; justify-content: flex-end;">
                        <button onclick="viewHMOPlanDetails(${p.PlanID})" style="background: none; border: none; color: #2563eb; cursor: pointer; font-size: 14px; text-decoration: underline;">👁️ View</button>
                        <button onclick="editHMOPlan(${p.PlanID})" style="background: none; border: none; color: #7c3aed; cursor: pointer; font-size: 14px; text-decoration: underline;">✏️ Edit</button>
                        <button onclick="deleteHMOPlan(${p.PlanID})" style="background: none; border: none; color: #dc2626; cursor: pointer; font-size: 14px; text-decoration: underline;">🗑️ Delete</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function setupHMOPlansEventListeners() {
    const searchInput = document.getElementById('hmo-plan-search');
    const providerFilter = document.getElementById('hmo-plan-provider-filter');
    const statusFilter = document.getElementById('hmo-plan-status-filter');

    if (searchInput) {
        searchInput.addEventListener('input', applyHMOPlanFilters);
    }
    if (providerFilter) {
        providerFilter.addEventListener('change', applyHMOPlanFilters);
    }
    if (statusFilter) {
        statusFilter.addEventListener('change', applyHMOPlanFilters);
    }
}

function applyHMOPlanFilters() {
    const searchTerm = (document.getElementById('hmo-plan-search')?.value || '').toLowerCase().trim();
    const providerFilter = document.getElementById('hmo-plan-provider-filter')?.value || '';
    const statusFilter = document.getElementById('hmo-plan-status-filter')?.value || '';

    const filtered = hmoPlansCache.filter(p => {
        if (providerFilter !== '') {
            if (String(p.ProviderID) !== String(providerFilter)) return false;
        }
        if (statusFilter !== '') {
            const isActive = parseInt(statusFilter) === 1;
            if ((p.IsActive === 1 || p.Status === 'Active') !== isActive) return false;
        }
        if (!searchTerm) return true;
        
        const coverage = p.Coverage ? (Array.isArray(p.Coverage) ? p.Coverage.join(' ') : JSON.parse(p.Coverage || '[]').join(' ')) : '';
        return (p.PlanName || '').toLowerCase().includes(searchTerm) ||
               (p.ProviderName || '').toLowerCase().includes(searchTerm) ||
               coverage.toLowerCase().includes(searchTerm);
    });

    populateHMOPlansTable(filtered);
}

// Global window functions
window.refreshHMOPlans = function() {
    displayHMOPlansSection();
};

window.exportHMOPlansCSV = function() {
    if (!hmoPlansCache || hmoPlansCache.length === 0) {
        showInlineAlert('No plans to export', 'warning');
        return;
    }

    const headers = ['Plan ID', 'Plan Name', 'Provider', 'Coverage', 'Max Benefit', 'Premium', 'Eligibility', 'Status'];
    const rows = hmoPlansCache.map(p => {
        const isActive = p.IsActive === 1 || p.Status === 'Active' ? 'Active' : 'Inactive';
        const coverage = p.Coverage ? (Array.isArray(p.Coverage) ? p.Coverage.join('; ') : JSON.parse(p.Coverage || '[]').join('; ')) : '';
        
        return [
            p.PlanID || '',
            p.PlanName || '',
            p.ProviderName || '',
            coverage,
            p.MaximumBenefitLimit || '',
            p.PremiumCost || p.MonthlyPremium || '',
            p.Eligibility || '',
            isActive
        ];
    });

    let csv = headers.join(',') + '\n';
    rows.forEach(row => {
        csv += row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `hmo-plans-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showInlineAlert('Plans exported successfully!', 'success');
};

window.showAddHMOPlanModal = async function() {
    const modalContainer = document.getElementById('hmo-plans-modal-container') || document.body;
    
    const modal = document.createElement('div');
    modal.id = 'add-plan-modal';
    modal.style.cssText = 'position: fixed; inset: 0; z-index: 60; display: flex; justify-content: center; align-items: center; background: rgba(0,0,0,0.5); padding: 15px;';
    
    const providerOptions = hmoProvidersForPlans.map(p => `<option value="${p.ProviderID}">${p.ProviderName}</option>`).join('');

    modal.innerHTML = `
        <div style="background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 20px 25px rgba(0,0,0,0.15); width: 100%; max-width: 700px; max-height: 80vh; overflow-y: auto;">
            <div style="padding: 20px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; background: #fef3f0;">
                <h3 style="font-size: 18px; font-weight: 600; color: #111827; margin: 0;">Add Benefit Plan</h3>
                <button onclick="document.getElementById('add-plan-modal')?.remove()" style="background: none; border: none; color: #9ca3af; font-size: 24px; cursor: pointer; padding: 0;">✕</button>
            </div>
            <form id="addPlanForm" style="padding: 20px; display: flex; flex-direction: column; gap: 15px;">
                <div>
                    <label style="display: block; font-size: 13px; font-weight: 500; color: #374151; margin-bottom: 6px;">Provider *</label>
                    <select name="provider_id" required style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;">
                        <option value="">Select Provider</option>
                        ${providerOptions}
                    </select>
                </div>
                <div>
                    <label style="display: block; font-size: 13px; font-weight: 500; color: #374151; margin-bottom: 6px;">Plan Name *</label>
                    <input name="plan_name" type="text" placeholder="Enter plan name" required style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;" />
                </div>
                <div>
                    <label style="display: block; font-size: 13px; font-weight: 500; color: #374151; margin-bottom: 8px;">Coverage</label>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 13px;">
                        <label style="display: flex; align-items: center; gap: 6px;"><input type="checkbox" name="coverage_option" value="inpatient" /> Inpatient</label>
                        <label style="display: flex; align-items: center; gap: 6px;"><input type="checkbox" name="coverage_option" value="outpatient" /> Outpatient</label>
                        <label style="display: flex; align-items: center; gap: 6px;"><input type="checkbox" name="coverage_option" value="emergency" /> Emergency</label>
                        <label style="display: flex; align-items: center; gap: 6px;"><input type="checkbox" name="coverage_option" value="preventive" /> Preventive</label>
                        <label style="display: flex; align-items: center; gap: 6px;"><input type="checkbox" name="coverage_option" value="dental" /> Dental</label>
                        <label style="display: flex; align-items: center; gap: 6px;"><input type="checkbox" name="coverage_option" value="maternity" /> Maternity</label>
                    </div>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div>
                        <label style="display: block; font-size: 13px; font-weight: 500; color: #374151; margin-bottom: 6px;">Max Benefit Limit</label>
                        <input name="maximum_benefit_limit" type="number" step="0.01" placeholder="e.g. 500000" style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;" />
                    </div>
                    <div>
                        <label style="display: block; font-size: 13px; font-weight: 500; color: #374151; margin-bottom: 6px;">Premium Cost</label>
                        <input name="premium_cost" type="number" step="0.01" placeholder="e.g. 5000" style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;" />
                    </div>
                </div>
                <div>
                    <label style="display: block; font-size: 13px; font-weight: 500; color: #374151; margin-bottom: 6px;">Eligibility</label>
                    <select name="eligibility" style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;">
                        <option value="Individual">Individual</option>
                        <option value="Family">Family</option>
                        <option value="Corporate">Corporate</option>
                    </select>
                </div>
                <div>
                    <label style="display: block; font-size: 13px; font-weight: 500; color: #374151; margin-bottom: 6px;">Accredited Hospitals (one per line)</label>
                    <textarea name="accredited_hospitals" placeholder="St. Luke's Medical Center&#10;The Medical City" style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; font-family: monospace;" rows="3"></textarea>
                </div>
                <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 10px;">
                    <button type="button" onclick="document.getElementById('add-plan-modal')?.remove()" style="padding: 10px 16px; background: white; color: #374151; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer;">Cancel</button>
                    <button type="submit" style="padding: 10px 16px; background: #f97316; color: white; border: none; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer;">Save Plan</button>
                </div>
            </form>
        </div>
    `;

    modalContainer.appendChild(modal);

    document.getElementById('addPlanForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const payload = {};
        
        formData.forEach((value, key) => {
            if (key !== 'coverage_option') {
                payload[key] = value;
            }
        });

        const coverage = Array.from(e.target.querySelectorAll('input[name="coverage_option"]:checked')).map(c => c.value);
        if (coverage.length) {
            payload.coverage = coverage;
        }

        try {
            const response = await fetch(`${REST_API_URL}hmo/hmo.php?resource=plans`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            if (result.success) {
                document.getElementById('add-plan-modal')?.remove();
                showInlineAlert('Plan added successfully!', 'success');
                displayHMOPlansSection();
            } else {
                showInlineAlert(result.message || 'Failed to add plan', 'error');
            }
        } catch (error) {
            console.error('Error adding plan:', error);
            showInlineAlert('Error adding plan: ' + error.message, 'error');
        }
    });
};

window.editHMOPlan = async function(planId) {
    const plan = hmoPlansCache.find(p => p.PlanID === planId);
    if (!plan) {
        showInlineAlert('Plan not found', 'error');
        return;
    }

    const modalContainer = document.getElementById('hmo-plans-modal-container') || document.body;
    
    const modal = document.createElement('div');
    modal.id = 'edit-plan-modal';
    modal.style.cssText = 'position: fixed; inset: 0; z-index: 60; display: flex; justify-content: center; align-items: center; background: rgba(0,0,0,0.5); padding: 15px;';
    
    const providerOptions = hmoProvidersForPlans.map(p => `<option value="${p.ProviderID}" ${p.ProviderID === plan.ProviderID ? 'selected' : ''}>${p.ProviderName}</option>`).join('');
    
    const coverage = Array.isArray(plan.Coverage) ? plan.Coverage : (plan.Coverage ? JSON.parse(plan.Coverage || '[]') : []);
    const accredited = Array.isArray(plan.AccreditedHospitals) ? plan.AccreditedHospitals.join('\n') : (plan.AccreditedHospitals ? JSON.parse(plan.AccreditedHospitals || '[]').join('\n') : '');

    modal.innerHTML = `
        <div style="background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 20px 25px rgba(0,0,0,0.15); width: 100%; max-width: 700px; max-height: 80vh; overflow-y: auto;">
            <div style="padding: 20px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; background: #fef3f0;">
                <h3 style="font-size: 18px; font-weight: 600; color: #111827; margin: 0;">Edit Benefit Plan</h3>
                <button onclick="document.getElementById('edit-plan-modal')?.remove()" style="background: none; border: none; color: #9ca3af; font-size: 24px; cursor: pointer; padding: 0;">✕</button>
            </div>
            <form id="editPlanForm" style="padding: 20px; display: flex; flex-direction: column; gap: 15px;">
                <input type="hidden" name="id" value="${planId}" />
                <div>
                    <label style="display: block; font-size: 13px; font-weight: 500; color: #374151; margin-bottom: 6px;">Provider *</label>
                    <select name="provider_id" required style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;">
                        <option value="">Select Provider</option>
                        ${providerOptions}
                    </select>
                </div>
                <div>
                    <label style="display: block; font-size: 13px; font-weight: 500; color: #374151; margin-bottom: 6px;">Plan Name *</label>
                    <input name="plan_name" type="text" value="${plan.PlanName || ''}" required style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;" />
                </div>
                <div>
                    <label style="display: block; font-size: 13px; font-weight: 500; color: #374151; margin-bottom: 8px;">Coverage</label>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 13px;">
                        <label style="display: flex; align-items: center; gap: 6px;"><input type="checkbox" name="coverage_option" value="inpatient" ${coverage.includes('inpatient') ? 'checked' : ''} /> Inpatient</label>
                        <label style="display: flex; align-items: center; gap: 6px;"><input type="checkbox" name="coverage_option" value="outpatient" ${coverage.includes('outpatient') ? 'checked' : ''} /> Outpatient</label>
                        <label style="display: flex; align-items: center; gap: 6px;"><input type="checkbox" name="coverage_option" value="emergency" ${coverage.includes('emergency') ? 'checked' : ''} /> Emergency</label>
                        <label style="display: flex; align-items: center; gap: 6px;"><input type="checkbox" name="coverage_option" value="preventive" ${coverage.includes('preventive') ? 'checked' : ''} /> Preventive</label>
                        <label style="display: flex; align-items: center; gap: 6px;"><input type="checkbox" name="coverage_option" value="dental" ${coverage.includes('dental') ? 'checked' : ''} /> Dental</label>
                        <label style="display: flex; align-items: center; gap: 6px;"><input type="checkbox" name="coverage_option" value="maternity" ${coverage.includes('maternity') ? 'checked' : ''} /> Maternity</label>
                    </div>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div>
                        <label style="display: block; font-size: 13px; font-weight: 500; color: #374151; margin-bottom: 6px;">Max Benefit Limit</label>
                        <input name="maximum_benefit_limit" type="number" step="0.01" value="${plan.MaximumBenefitLimit || ''}" style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;" />
                    </div>
                    <div>
                        <label style="display: block; font-size: 13px; font-weight: 500; color: #374151; margin-bottom: 6px;">Premium Cost</label>
                        <input name="premium_cost" type="number" step="0.01" value="${plan.PremiumCost || ''}" style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;" />
                    </div>
                </div>
                <div>
                    <label style="display: block; font-size: 13px; font-weight: 500; color: #374151; margin-bottom: 6px;">Eligibility</label>
                    <select name="eligibility" style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;">
                        <option value="Individual" ${plan.Eligibility === 'Individual' ? 'selected' : ''}>Individual</option>
                        <option value="Family" ${plan.Eligibility === 'Family' ? 'selected' : ''}>Family</option>
                        <option value="Corporate" ${plan.Eligibility === 'Corporate' ? 'selected' : ''}>Corporate</option>
                    </select>
                </div>
                <div>
                    <label style="display: block; font-size: 13px; font-weight: 500; color: #374151; margin-bottom: 6px;">Accredited Hospitals (one per line)</label>
                    <textarea name="accredited_hospitals" style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; font-family: monospace;" rows="3">${accredited}</textarea>
                </div>
                <div>
                    <label style="display: block; font-size: 13px; font-weight: 500; color: #374151; margin-bottom: 6px;">Status</label>
                    <select name="status" style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;">
                        <option value="Active" ${plan.Status === 'Active' ? 'selected' : ''}>Active</option>
                        <option value="Inactive" ${plan.Status === 'Inactive' ? 'selected' : ''}>Inactive</option>
                    </select>
                </div>
                <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 10px;">
                    <button type="button" onclick="document.getElementById('edit-plan-modal')?.remove()" style="padding: 10px 16px; background: white; color: #374151; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer;">Cancel</button>
                    <button type="submit" style="padding: 10px 16px; background: #f97316; color: white; border: none; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer;">Update Plan</button>
                </div>
            </form>
        </div>
    `;

    modalContainer.appendChild(modal);

    document.getElementById('editPlanForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const payload = {};
        
        formData.forEach((value, key) => {
            if (key !== 'coverage_option') {
                payload[key] = value;
            }
        });

        const coverage = Array.from(e.target.querySelectorAll('input[name="coverage_option"]:checked')).map(c => c.value);
        if (coverage.length) {
            payload.coverage = coverage;
        }

        try {
            const response = await fetch(`${REST_API_URL}hmo/hmo.php?resource=plans&id=${planId}`, {
                method: 'PUT',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            if (result.success) {
                document.getElementById('edit-plan-modal')?.remove();
                showInlineAlert('Plan updated successfully!', 'success');
                displayHMOPlansSection();
            } else {
                showInlineAlert(result.message || 'Failed to update plan', 'error');
            }
        } catch (error) {
            console.error('Error updating plan:', error);
            showInlineAlert('Error updating plan: ' + error.message, 'error');
        }
    });
};

window.deleteHMOPlan = function(planId) {
    const plan = hmoPlansCache.find(p => p.PlanID === planId);
    if (!plan) {
        showInlineAlert('Plan not found', 'error');
        return;
    }

    showEnhancedConfirmationModal(
        'Delete Plan',
        `Are you sure you want to delete "${plan.PlanName}"?`,
        'This action cannot be undone.',
        'Delete',
        'red',
        async () => {
            try {
                const response = await fetch(`${REST_API_URL}hmo/hmo.php?resource=plans&id=${planId}`, {
                    method: 'DELETE',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
                    }
                });

                const result = await response.json();
                if (result.success) {
                    showInlineAlert('Plan deleted successfully!', 'success');
                    displayHMOPlansSection();
                } else {
                    showInlineAlert(result.message || 'Failed to delete plan', 'error');
                }
            } catch (error) {
                console.error('Error deleting plan:', error);
                showInlineAlert('Error deleting plan: ' + error.message, 'error');
            }
        }
    );
};

window.viewHMOPlanDetails = function(planId) {
    const plan = hmoPlansCache.find(p => p.PlanID === planId);
    if (!plan) {
        showInlineAlert('Plan not found', 'error');
        return;
    }

    const provider = hmoProvidersForPlans.find(p => p.ProviderID === plan.ProviderID);
    const coverage = Array.isArray(plan.Coverage) ? plan.Coverage : (plan.Coverage ? JSON.parse(plan.Coverage || '[]') : []);

    const modalContainer = document.getElementById('hmo-plans-modal-container') || document.body;
    
    const modal = document.createElement('div');
    modal.id = 'view-plan-modal';
    modal.style.cssText = 'position: fixed; inset: 0; z-index: 60; display: flex; justify-content: center; align-items: center; background: rgba(0,0,0,0.5); padding: 15px;';
    
    modal.innerHTML = `
        <div style="background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 20px 25px rgba(0,0,0,0.15); width: 100%; max-width: 600px;">
            <div style="padding: 20px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; background: #fef3f0;">
                <h3 style="font-size: 18px; font-weight: 600; color: #111827; margin: 0;">Plan Details</h3>
                <button onclick="document.getElementById('view-plan-modal')?.remove()" style="background: none; border: none; color: #9ca3af; font-size: 24px; cursor: pointer; padding: 0;">✕</button>
            </div>
            <div style="padding: 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div>
                    <label style="font-size: 12px; font-weight: 600; color: #9ca3af; text-transform: uppercase;">Plan Name</label>
                    <div style="font-size: 16px; font-weight: 600; color: #111827; margin-top: 5px;">${plan.PlanName || 'N/A'}</div>
                </div>
                <div>
                    <label style="font-size: 12px; font-weight: 600; color: #9ca3af; text-transform: uppercase;">Status</label>
                    <div style="margin-top: 5px;">
                        ${plan.IsActive === 1 || plan.Status === 'Active' 
                            ? '<span style="display: inline-block; padding: 4px 12px; border-radius: 4px; background: #dcfce7; color: #166534; font-size: 12px; font-weight: 500;">✓ Active</span>'
                            : '<span style="display: inline-block; padding: 4px 12px; border-radius: 4px; background: #fee2e2; color: #991b1b; font-size: 12px; font-weight: 500;">✕ Inactive</span>'}
                    </div>
                </div>
                <div>
                    <label style="font-size: 12px; font-weight: 600; color: #9ca3af; text-transform: uppercase;">Provider</label>
                    <div style="font-size: 14px; color: #111827; margin-top: 5px;">${provider?.ProviderName || 'N/A'}</div>
                </div>
                <div>
                    <label style="font-size: 12px; font-weight: 600; color: #9ca3af; text-transform: uppercase;">Eligibility</label>
                    <div style="font-size: 14px; color: #111827; margin-top: 5px;">${plan.Eligibility || 'N/A'}</div>
                </div>
                <div style="grid-column: 1 / -1;">
                    <label style="font-size: 12px; font-weight: 600; color: #9ca3af; text-transform: uppercase;">Coverage</label>
                    <div style="font-size: 14px; color: #111827; margin-top: 5px;">${coverage.join(', ') || 'N/A'}</div>
                </div>
                <div>
                    <label style="font-size: 12px; font-weight: 600; color: #9ca3af; text-transform: uppercase;">Max Benefit</label>
                    <div style="font-size: 14px; color: #111827; margin-top: 5px;">₱${parseFloat(plan.MaximumBenefitLimit || 0).toLocaleString() || 'N/A'}</div>
                </div>
                <div>
                    <label style="font-size: 12px; font-weight: 600; color: #9ca3af; text-transform: uppercase;">Premium</label>
                    <div style="font-size: 14px; color: #111827; margin-top: 5px;">₱${parseFloat(plan.PremiumCost || 0).toLocaleString() || 'N/A'}</div>
                </div>
            </div>
            <div style="padding: 15px 20px; background: #f9fafb; border-top: 1px solid #e5e7eb; text-align: right;">
                <button onclick="document.getElementById('view-plan-modal')?.remove()" style="padding: 10px 16px; background: white; color: #374151; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer;">Close</button>
            </div>
        </div>
    `;

    modalContainer.appendChild(modal);
};
