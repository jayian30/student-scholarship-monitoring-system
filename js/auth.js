/**
 * Student Scholarship Monitoring and Academic Compliance System
 * Authentication & Session Management
 */

const Auth = {
    /**
     * Authenticate with email & password
     */
    async login(email, password) {
        if (!email || !password) {
            return { success: false, error: "Please enter both email and password." };
        }

        try {
            const { data, error } = await window.dataClient.auth.signInWithPassword({
                email: email.trim(),
                password: password
            });

            if (error) {
                return { success: false, error: error.message };
            }

            // Fetch complete profile
            const profile = await this.fetchProfile(data.user.id);
            if (!profile) {
                return { success: false, error: "User profile record not found." };
            }

            return { success: true, user: profile };
        } catch (err) {
            return { success: false, error: err.message || "An unexpected error occurred during login." };
        }
    },

    /**
     * Terminate session & log out
     */
    async logout() {
        try {
            await window.dataClient.auth.signOut();
            window.location.href = "login.html";
        } catch (err) {
            console.error("Logout error:", err);
            window.location.href = "login.html";
        }
    },

    /**
     * Fetch user profile from database
     */
    async fetchProfile(userId) {
        const { data, error } = await window.dataClient
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error || !data) return null;
        return data;
    },

    /**
     * Get currently active session user
     */
    async getCurrentUser() {
        const { data: { user } } = await window.dataClient.auth.getUser();
        if (!user) return null;
        return await this.fetchProfile(user.id);
    },

    /**
     * Quick-switch account for testing & demonstration
     */
    async quickLogin(userId) {
        const profile = await this.fetchProfile(userId);
        if (!profile) return { success: false, error: "Profile not found." };

        // Sign in locally or mock session
        window.dataClient.localEngine.setCurrentUser({
            id: profile.id,
            email: profile.email,
            role: profile.role,
            user_metadata: {
                full_name: profile.full_name,
                student_id: profile.student_id,
                role: profile.role
            }
        });

        return { success: true, profile };
    }
};

window.Auth = Auth;
