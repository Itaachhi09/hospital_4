/**
 * Notifications Module
 * Handles display and management of system notifications
 * v1.0 - Professional notification dashboard with filtering
 */

const API_BASE_URL = window.API_BASE_URL || '/api';
const REST_API_URL = `${API_BASE_URL}/`;

let mainContentArea;
let pageTitle;
let currentNotifications = [];
let currentFilter = 'all';
let currentPage = 1;

/**
 * Initialize notification elements
 */
function initializeNotificationElements() {
    mainContentArea = document.getElementById('main-content-area');
    pageTitle = document.getElementById('page-title');
}

/**
 * Display notifications section
 */
export async function displayNotificationsSection() {
    initializeNotificationElements();
    
    if (pageTitle) {
        pageTitle.textContent = 'Notifications';
    }
    
    if (!mainContentArea) {
        console.error('[Notifications] Main content area not found');
        return;
    }

    mainContentArea.innerHTML = `
        <div style="padding: 24px;">
            <!-- Header -->
            <div style="margin-bottom: 24px;">
                <h1 style="font-size: 28px; font-weight: bold; color: #ffffff; margin-bottom: 8px;">🔔 Notifications</h1>
                <p style="color: #cbd5e1;">Manage your system notifications and alerts</p>
            </div>

            <!-- Filter Tabs -->
            <div id="notification-filters" style="display: flex; gap: 12px; margin-bottom: 24px; border-bottom: 2px solid #334155; padding-bottom: 12px;">
                <button class="filter-tab active" data-filter="all" style="padding: 8px 16px; background: none; border: none; color: #94a3b8; font-weight: 600; cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -14px; transition: all 0.3s;">
                    All Notifications
                </button>
                <button class="filter-tab" data-filter="unread" style="padding: 8px 16px; background: none; border: none; color: #94a3b8; font-weight: 600; cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -14px; transition: all 0.3s;">
                    Unread <span id="unread-badge" style="background: #ef4444; color: white; border-radius: 12px; padding: 0 6px; font-size: 12px; margin-left: 4px;">0</span>
                </button>
                <button class="filter-tab" data-filter="read" style="padding: 8px 16px; background: none; border: none; color: #94a3b8; font-weight: 600; cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -14px; transition: all 0.3s;">
                    Read
                </button>
            </div>

            <!-- Notifications List -->
            <div id="notifications-list" style="display: flex; flex-direction: column; gap: 12px;">
                <div style="text-align: center; color: #cbd5e1; padding: 40px;">Loading notifications...</div>
            </div>

            <!-- Pagination -->
            <div id="notifications-pagination" style="display: flex; gap: 8px; justify-content: center; margin-top: 24px; align-items: center;">
            </div>
        </div>
    `;

    // Load notifications data
    await loadNotifications();
    
    // Setup filter event listeners
    setupFilterListeners();
}

/**
 * Load notifications from API
 */
async function loadNotifications(page = 1, filter = 'all') {
    try {
        const response = await fetch(`${API_BASE_URL}/notifications/?page=${page}&per_page=10&filter=${filter}`);
        const result = await response.json();

        if (result.success) {
            currentNotifications = result.data;
            currentPage = result.pagination.current_page;
            currentFilter = filter;
            
            renderNotifications(result.data, result.pagination, result.unread_count);
        } else {
            showError(result.message || 'Failed to load notifications');
        }
    } catch (error) {
        console.error('[Notifications] Error loading notifications:', error);
        showError('Error loading notifications. Please try again.');
    }
}

/**
 * Render notifications list
 */
function renderNotifications(notifications, pagination, unreadCount) {
    const listContainer = document.getElementById('notifications-list');
    
    if (!notifications || notifications.length === 0) {
        listContainer.innerHTML = `
            <div style="text-align: center; color: #cbd5e1; padding: 40px;">
                <div style="font-size: 48px; margin-bottom: 12px;">📭</div>
                <p style="font-size: 16px;">No notifications at this time</p>
            </div>
        `;
        return;
    }

    // Update unread badge
    const unreadBadge = document.getElementById('unread-badge');
    if (unreadBadge) {
        unreadBadge.textContent = unreadCount;
        unreadBadge.style.display = unreadCount > 0 ? 'inline-block' : 'none';
    }

    listContainer.innerHTML = notifications.map((notif, idx) => `
        <div style="
            background: ${notif.read ? '#1e293b' : '#0f4c81'};
            border: 1px solid ${notif.read ? '#334155' : '#3b82f6'};
            border-radius: 8px;
            padding: 16px;
            display: flex;
            gap: 16px;
            align-items: flex-start;
            transition: all 0.3s ease;
            cursor: pointer;
            animation: slideIn 0.3s ease-out;
            animation-delay: ${idx * 0.05}s;
            animation-fill-mode: both;
        " class="notification-item" data-id="${notif.id}">
            <!-- Icon -->
            <div style="font-size: 24px; min-width: 24px;">
                ${notif.icon}
            </div>

            <!-- Content -->
            <div style="flex: 1;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 8px;">
                    <div>
                        <h3 style="font-weight: bold; color: #ffffff; margin: 0 0 4px 0; font-size: 15px;">
                            ${notif.title}
                            ${!notif.read ? '<span style="background: #ef4444; color: white; font-size: 10px; padding: 2px 6px; border-radius: 3px; margin-left: 8px;">NEW</span>' : ''}
                        </h3>
                        <p style="color: #cbd5e1; margin: 0; font-size: 13px;">
                            ${notif.message}
                        </p>
                    </div>
                    <div style="text-align: right; min-width: 80px;">
                        <span style="color: #94a3b8; font-size: 12px;">
                            ${formatTimeAgo(notif.created_at)}
                        </span>
                    </div>
                </div>

                <!-- Type Badge -->
                <div style="display: flex; gap: 8px; align-items: center;">
                    <span style="
                        background: ${getTypeColor(notif.type)};
                        color: white;
                        padding: 4px 8px;
                        border-radius: 4px;
                        font-size: 11px;
                        font-weight: 600;
                        text-transform: uppercase;
                    ">
                        ${notif.type}
                    </span>
                    ${notif.priority === 'high' ? '<span style="color: #fca5a5; font-size: 11px; font-weight: 600;">⚠️ URGENT</span>' : ''}
                </div>
            </div>

            <!-- Action Buttons -->
            <div style="display: flex; gap: 8px; min-width: max-content;">
                ${notif.action_url ? `
                    <button style="
                        background: #3b82f6;
                        color: white;
                        border: none;
                        padding: 6px 12px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 12px;
                        font-weight: 600;
                        transition: all 0.2s;
                    " onclick="navigateToAction('${notif.action_url}')" onmouseover="this.style.background='#1d4ed8'" onmouseout="this.style.background='#3b82f6'">
                        View
                    </button>
                ` : ''}
                <button style="
                    background: #334155;
                    color: #cbd5e1;
                    border: none;
                    padding: 6px 12px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                    font-weight: 600;
                    transition: all 0.2s;
                " onclick="deleteNotification('${notif.id}', event)" onmouseover="this.style.background='#475569'" onmouseout="this.style.background='#334155'">
                    Delete
                </button>
            </div>
        </div>
    `).join('');

    // Render pagination
    renderPagination(pagination);
}

/**
 * Render pagination controls
 */
function renderPagination(pagination) {
    const paginationContainer = document.getElementById('notifications-pagination');
    
    if (pagination.total_pages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }

    let buttons = '';
    
    // Previous button
    if (pagination.current_page > 1) {
        buttons += `
            <button onclick="loadNotifications(${pagination.current_page - 1}, '${currentFilter}')" 
                style="padding: 6px 12px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;">
                ← Previous
            </button>
        `;
    }

    // Page numbers
    for (let i = 1; i <= pagination.total_pages; i++) {
        const isActive = i === pagination.current_page;
        buttons += `
            <button onclick="loadNotifications(${i}, '${currentFilter}')" 
                style="
                    padding: 6px 12px;
                    background: ${isActive ? '#ef4444' : '#334155'};
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-weight: ${isActive ? 'bold' : 'normal'};
                ">
                ${i}
            </button>
        `;
    }

    // Next button
    if (pagination.current_page < pagination.total_pages) {
        buttons += `
            <button onclick="loadNotifications(${pagination.current_page + 1}, '${currentFilter}')" 
                style="padding: 6px 12px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;">
                Next →
            </button>
        `;
    }

    paginationContainer.innerHTML = buttons;
}

/**
 * Setup filter event listeners
 */
function setupFilterListeners() {
    const filterTabs = document.querySelectorAll('.filter-tab');
    
    filterTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const filter = this.getAttribute('data-filter');
            
            // Update active state
            filterTabs.forEach(t => {
                t.style.borderBottomColor = 'transparent';
                t.style.color = '#94a3b8';
            });
            this.style.borderBottomColor = '#3b82f6';
            this.style.color = '#3b82f6';
            
            // Load notifications with new filter
            loadNotifications(1, filter);
        });
    });
}

/**
 * Get color for notification type
 */
function getTypeColor(type) {
    const colors = {
        'leave': '#10b981',
        'payroll': '#3b82f6',
        'hmo': '#ec4899',
        'approval': '#f59e0b',
        'system': '#8b5cf6',
        'compensation': '#14b8a6'
    };
    return colors[type] || '#64748b';
}

/**
 * Format time ago
 */
function formatTimeAgo(createdAt) {
    const now = new Date();
    const created = new Date(createdAt);
    const diffMs = now - created;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return created.toLocaleDateString();
}

/**
 * Delete notification
 */
async function deleteNotification(id, event) {
    event.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this notification?')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/notifications/?id=${id}`, {
            method: 'DELETE'
        });
        const result = await response.json();

        if (result.success) {
            // Reload notifications
            loadNotifications(currentPage, currentFilter);
        } else {
            showError(result.message || 'Failed to delete notification');
        }
    } catch (error) {
        console.error('[Notifications] Error deleting notification:', error);
        showError('Error deleting notification');
    }
}

/**
 * Navigate to action
 */
function navigateToAction(url) {
    // Navigate by updating URL hash or reloading section
    window.location.hash = url;
    location.reload();
}

/**
 * Show error message
 */
function showError(message) {
    const listContainer = document.getElementById('notifications-list');
    if (listContainer) {
        listContainer.innerHTML = `
            <div style="
                background: #7f1d1d;
                border: 1px solid #dc2626;
                color: #fca5a5;
                padding: 16px;
                border-radius: 8px;
                text-align: center;
            ">
                <p style="margin: 0;">❌ ${message}</p>
            </div>
        `;
    }
}

// Add CSS animations
if (!document.getElementById('notifications-styles')) {
    const style = document.createElement('style');
    style.id = 'notifications-styles';
    style.textContent = `
        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateY(10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .notification-item:hover {
            border-color: #3b82f6;
            background: rgba(59, 130, 246, 0.1);
            transform: translateX(4px);
        }

        .filter-tab:hover {
            color: #cbd5e1;
        }

        .filter-tab.active {
            color: #3b82f6;
            border-bottom-color: #3b82f6;
        }
    `;
    document.head.appendChild(style);
}

// Make functions globally available
window.loadNotifications = loadNotifications;
window.deleteNotification = deleteNotification;
window.navigateToAction = navigateToAction;
