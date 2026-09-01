import { apiClient } from './apiClient'

export const authService = {
  /**
   * Log in user with credentials against the backend API
   */
  async login(username, password) {
    const res = await apiClient.post('/auth/login', { username, password })
    if (res?.token) {
      apiClient.setToken(res.token)
    }
    return res
  },

  /**
   * Fast role login for testing / quick role switching
   */
  async quickLogin(role) {
    const res = await apiClient.post('/auth/quick-login', { role })
    if (res?.token) {
      apiClient.setToken(res.token)
    }
    return res
  },

  /**
   * Fetch currently authenticated user profile
   */
  async getMe() {
    const res = await apiClient.get('/auth/me')
    return res && res.user ? res.user : res
  },

  /**
   * Update authenticated user password
   */
  async changePassword(currentPassword, newPassword) {
    return await apiClient.post('/auth/change-password', { currentPassword, newPassword })
  },

  /**
   * Request password reset code
   */
  async forgotPassword(emailOrUsername) {
    return await apiClient.post('/auth/forgot-password', { emailOrUsername })
  },

  /**
   * Submit reset code and set new password
   */
  async resetPassword(emailOrUsername, resetCode, newPassword) {
    return await apiClient.post('/auth/reset-password', { emailOrUsername, resetCode, newPassword })
  },

  /**
   * Log out user and clear stored token
   */
  logout() {
    apiClient.clearToken()
    localStorage.removeItem('demo_role')
    localStorage.removeItem('auth_user')
  },
}
