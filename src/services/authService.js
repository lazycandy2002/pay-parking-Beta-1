import CryptoJS from 'crypto-js';
import { supabase } from '../lib/supabase';

/**
 * Authenticates a user with the given username and password
 * 
 * @param {string} username - User's username
 * @param {string} password - User's password
 * @returns {Promise<Object>} Authentication result with success status and user data
 */
export async function authenticateUser(username, password) {
  try {
    // Get user by username
    const { data, error } = await supabase
      .from('users')
      .select('userid, username, password, role')
      .eq('username', username)
      .maybeSingle();
    
    if (error && error.code !== 'PGRST116') {
      console.error('Database query error:', error);
      return {
        success: false,
        message: 'Login failed. Please try again later.'
      };
    }
    
    // Check if user exists
    if (!data) {
      return {
        success: false,
        message: 'Invalid username or password. Please try again.'
      };
    }
    
    // Hash the provided password for comparison
    const hashedPassword = CryptoJS.SHA256(password).toString();
    
    // Compare passwords
    if (data.password !== hashedPassword) {
      return {
        success: false,
        message: 'Invalid username or password. Please try again.'
      };
    }
    
    // Login successful
    const userData = {
      id: data.userid,
      username: data.username,
      role: data.role
    };
    
    // Generate authentication token
    const token = generateToken(userData);
    
    return {
      success: true,
      userData,
      token,
      message: 'Login successful!'
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return {
      success: false,
      message: 'Authentication failed. Please try again later.'
    };
  }
}

/**
 * Generates a token for authenticated user
 * 
 * @param {Object} userData - User data to include in the token
 * @returns {string} Generated token
 */
function generateToken(userData) {
  const payload = {
    id: userData.id,
    username: userData.username,
    role: userData.role,
    exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // 24 hour expiration
  };
  
  return btoa(JSON.stringify(payload));
}

/**
 * Verifies if a token is valid
 * 
 * @param {string} token - Token to verify
 * @returns {Object|null} Decoded token payload or null if invalid
 */
export function verifyToken(token) {
  try {
    const payload = JSON.parse(atob(token));
    
    // Check if token is expired
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    
    return payload;
  } catch (error) {
    return null;
  }
}

/**
 * Logs out the current user by clearing session data
 */
export function logoutUser() {
  sessionStorage.removeItem('adminToken');
  sessionStorage.removeItem('userRole');
}