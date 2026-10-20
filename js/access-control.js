/**
 * Student Scholarship Monitoring and Academic Compliance System
 * Role-Based Access Control and Page Security Guards
 */

const AccessControl = {
    /**
     * Protect page based on required role(s)
     * @param {Array<string>} allowedRoles e.g. ['staff'] or ['scholar'] or ['staff', 'scholar']
     */
    async guard(allowedRoles = []) {
        const user = await window.Auth.getCurrentUser();
        
        if (!user) {
            // Not authenticated, redirect to login
            const currentPage = encodeURIComponent(window.location.pathname.split('/').pop());
            window.location.href = `login.html?redirect=${currentPage}`;
            return null;
        }

        if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
            // Role not authorized
            alert(`Access Denied: You do not have permissions to access this administrative page. Your role is: ${user.role.toUpperCase()}`);
            if (user.role === 'scholar') {
                window.location.href = 'scholar-dashboard.html';
            } else if (user.role === 'staff') {
                window.location.href = 'staff-dashboard.html';
            } else {
                window.location.href = 'login.html';
            }
            return null;
        }

        this.renderUserBadge(user);
        return user;
    },

    /**
     * Renders standard header user info and logout trigger
     */
    renderUserBadge(user) {
        const userContainer = document.getElementById('user-profile-badge');
        if (userContainer) {
            userContainer.innerHTML = `
                <div class="user-info-pill">
                    <span class="user-avatar-circle">${user.full_name.charAt(0)}</span>
                    <div class="user-meta">
                        <span class="user-name">${user.full_name}</span>
                        <span class="user-sub">${user.role === 'scholar' ? (user.student_id || 'Scholar') : 'Scholarship Staff'}</span>
                    </div>
                    <button id="logout-btn" class="btn btn-outline btn-sm" title="Sign Out">Sign Out</button>
                </div>
            `;

            const logoutBtn = document.getElementById('logout-btn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', () => window.Auth.logout());
            }
        }

        // Render system mode indicator
        const modeBadge = document.getElementById('system-mode-indicator');
        if (modeBadge) {
            const isRemote = window.dataClient.useRemote;
            modeBadge.innerHTML = isRemote
                ? `<span class="badge badge-success"><i class="dot"></i> Live Supabase</span>`
                : `<span class="badge badge-info" title="Offline Local DB with full RLS and seed data simulation"><i class="dot"></i> Local Sandbox Engine</span>`;
        }
    }
};

window.AccessControl = AccessControl;
