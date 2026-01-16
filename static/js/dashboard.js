/**
 * Token Dashboard - Ghibli Style
 * Clean, modular design with smooth interactions
 */

class TokenDashboard {
    constructor() {
        this.autoRefreshInterval = null;
        this.isAutoRefreshEnabled = false;
        this.apiBaseUrl = '/api';
        this.refreshIntervalMs = 30000;
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.refreshTokens();
    }

    bindEvents() {
        // Refresh button
        const refreshBtn = document.querySelector('.refresh-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.handleRefreshClick());
        }

        // Auto-refresh switch
        const switchEl = document.querySelector('.switch');
        if (switchEl) {
            switchEl.addEventListener('click', () => this.toggleAutoRefresh());
            // Keyboard accessibility
            switchEl.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.toggleAutoRefresh();
                }
            });
        }
    }

    async handleRefreshClick() {
        const btn = document.querySelector('.refresh-btn');
        if (btn) {
            btn.style.transform = 'scale(0.95)';
            setTimeout(() => {
                btn.style.transform = '';
            }, 150);
        }
        await this.refreshTokens();
    }

    async refreshTokens() {
        const tbody = document.getElementById('tokenTableBody');
        this.showLoading(tbody);
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/tokens`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            this.updateTokenTable(data);
            this.updateStatusBar(data);
            this.updateLastUpdateTime();
            
        } catch (error) {
            console.error('Failed to refresh token data:', error);
            this.showError(tbody, `Failed to load: ${error.message}`);
        }
    }

    updateTokenTable(data) {
        const tbody = document.getElementById('tokenTableBody');
        
        if (!data.tokens || data.tokens.length === 0) {
            this.showEmpty(tbody);
            return;
        }
        
        const rows = data.tokens.map((token, index) => 
            this.createTokenRow(token, index)
        ).join('');
        
        tbody.innerHTML = rows;
        
        // Animate rows
        const rowElements = tbody.querySelectorAll('tr');
        rowElements.forEach((row, i) => {
            row.style.opacity = '0';
            row.style.transform = 'translateY(10px)';
            setTimeout(() => {
                row.style.transition = 'all 0.3s ease';
                row.style.opacity = '1';
                row.style.transform = 'translateY(0)';
            }, i * 50);
        });
    }

    createTokenRow(token, index) {
        const statusClass = this.getStatusClass(token);
        const statusText = this.getStatusText(token);
        
        return `
            <tr data-index="${index}">
                <td>${this.escapeHtml(token.user_email || 'unknown')}</td>
                <td><span class="token-preview">${this.escapeHtml(token.token_preview || 'N/A')}</span></td>
                <td>${this.escapeHtml(token.auth_type || 'social')}</td>
                <td>${token.remaining_usage ?? 0}</td>
                <td>${this.formatDateTime(token.expires_at)}</td>
                <td>${this.formatDateTime(token.last_used)}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            </tr>
        `;
    }

    updateStatusBar(data) {
        this.animateNumber('totalTokens', data.total_tokens || 0);
        this.animateNumber('activeTokens', data.active_tokens || 0);
    }

    animateNumber(elementId, targetValue) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        const currentValue = parseInt(element.textContent) || 0;
        if (currentValue === targetValue) return;
        
        const duration = 300;
        const steps = 15;
        const increment = (targetValue - currentValue) / steps;
        let step = 0;
        
        const timer = setInterval(() => {
            step++;
            if (step >= steps) {
                element.textContent = targetValue;
                clearInterval(timer);
            } else {
                element.textContent = Math.round(currentValue + increment * step);
            }
        }, duration / steps);
    }

    updateLastUpdateTime() {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-US', { 
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        this.updateElement('lastUpdate', timeStr);
    }

    toggleAutoRefresh() {
        const switchEl = document.querySelector('.switch');
        
        if (this.isAutoRefreshEnabled) {
            this.stopAutoRefresh();
            switchEl.classList.remove('active');
            switchEl.setAttribute('aria-checked', 'false');
        } else {
            this.startAutoRefresh();
            switchEl.classList.add('active');
            switchEl.setAttribute('aria-checked', 'true');
        }
    }

    startAutoRefresh() {
        this.autoRefreshInterval = setInterval(
            () => this.refreshTokens(), 
            this.refreshIntervalMs
        );
        this.isAutoRefreshEnabled = true;
    }

    stopAutoRefresh() {
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
            this.autoRefreshInterval = null;
        }
        this.isAutoRefreshEnabled = false;
    }

    getStatusClass(token) {
        if (this.isExpired(token)) return 'status-expired';
        
        const remaining = token.remaining_usage ?? 0;
        if (remaining === 0) return 'status-exhausted';
        if (remaining <= 5) return 'status-low';
        return 'status-active';
    }

    getStatusText(token) {
        if (this.isExpired(token)) return 'Expired';
        
        const remaining = token.remaining_usage ?? 0;
        if (remaining === 0) return 'Exhausted';
        if (remaining <= 5) return 'Low';
        return 'Active';
    }

    isExpired(token) {
        if (!token.expires_at) return false;
        return new Date(token.expires_at) < new Date();
    }

    formatDateTime(dateStr) {
        if (!dateStr) return '-';
        
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return '-';
            
            return date.toLocaleString('en-US', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
        } catch (e) {
            return '-';
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    updateElement(id, content) {
        const element = document.getElementById(id);
        if (element) element.textContent = content;
    }

    showLoading(container) {
        container.innerHTML = `
            <tr>
                <td colspan="7" class="loading">
                    <div class="spinner"></div>
                    Loading token data...
                </td>
            </tr>
        `;
    }

    showError(container, message) {
        container.innerHTML = `
            <tr>
                <td colspan="7">
                    <div class="error">${this.escapeHtml(message)}</div>
                </td>
            </tr>
        `;
    }

    showEmpty(container) {
        container.innerHTML = `
            <tr>
                <td colspan="7">
                    <div class="empty-state">
                        <div class="empty-state-icon">~</div>
                        <p>No token data available</p>
                    </div>
                </td>
            </tr>
        `;
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new TokenDashboard();
});
