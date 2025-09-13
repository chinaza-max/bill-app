import CryptoJS from "crypto-js";

// Generate a more stable device ID
function generateStableDeviceInfo() {
  const deviceInfo = [
    // Use only stable browser characteristics
    navigator.hardwareConcurrency || 4, // Fallback if undefined
    navigator.maxTouchPoints || 0,      // Fallback if undefined
    window.screen.colorDepth || 24,     // Fallback if undefined
    window.screen.pixelDepth || 24,     // Fallback if undefined
    // Add timezone as it's relatively stable
    Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    // Add a browser-specific identifier that's more stable
    navigator.vendor || 'unknown'
  ].join("-");

  return deviceInfo;
}

// Create a secure key using stable device info and app secret
function generateSecureKey() {
  const deviceInfo = generateStableDeviceInfo();
  const SECRET_KEY = process.env.NEXT_PUBLIC_CRYPTO_KEY || "default-fallback-key";
  
  // Combine device info with app secret for better security
  return CryptoJS.SHA256(deviceInfo + SECRET_KEY).toString();
}

/**
 * Encrypts data using AES with device-specific key
 * @param {Object|string} data - Data to encrypt
 * @returns {string} - Encrypted string
 */
export const encryptData = (data) => {
  try {
    // Convert to string if object
    const dataString = typeof data === "object" ? JSON.stringify(data) : String(data);
    
    // Get device-specific secure key
    const secureKey = generateSecureKey();
    
    console.log("Encrypting data:", dataString);
    
    // Encrypt with AES
    const encrypted = CryptoJS.AES.encrypt(dataString, secureKey).toString();
    
    return encrypted;
  } catch (error) {
    console.error("Encryption failed:", error);
    return null;
  }
};

/**
 * Decrypts previously encrypted data
 * @param {string} encryptedData - Encrypted string to decrypt
 * @returns {Object|string|null} - Decrypted data, parsed as JSON if possible
 */
export const decryptData = (encryptedData) => {
  console.log("Decrypting data:", encryptedData);
  console.log("Decrypting data:", encryptedData);
  console.log("Decrypting data:", encryptedData);
  try {
    if (!encryptedData || typeof encryptedData !== 'string') return null;
    
    // Get device-specific secure key (should be same as during encryption)
    const secureKey = generateSecureKey();
    
    // Decrypt the data
    const bytes = CryptoJS.AES.decrypt(encryptedData, secureKey);
    
    if (!bytes || bytes.sigBytes <= 0) {
      console.warn("Decryption produced empty result");
      return null;
    }
    
    const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
    
    if (!decryptedString) {
      console.warn("Failed to convert decrypted bytes to string");
      return null;
    }
    
    // Try to parse as JSON, return as string if not valid JSON
    try {
      return JSON.parse(decryptedString);
    } catch (e) {
      return decryptedString;
    }
  } catch (error) {
    console.error("Decryption failed:", error);
    return null;
  }
};

/**
 * Stores encrypted data in localStorage
 * @param {string} key - Storage key
 * @param {Object|string} data - Data to encrypt and store
 * @returns {boolean} - Success status
 */
export const storeEncryptedData = (key, data) => {
  try {
 
    localStorage.setItem(key, data);
    return true;
  } catch (error) {
    console.error("Failed to store encrypted data:", error);
    return false;
  }
};

/**
 * Retrieves and decrypts data from localStorage
 * @param {string} key - Storage key
 * @returns {Object|string|null} - Decrypted data
 */
export const getDecryptedData = (key) => {
  try {
    const encryptedData = localStorage.getItem(key);
    
    if (!encryptedData) {
      console.warn(`No data found for key: ${key}`);
      return null;
    }
    

        console.log("Encrypted data:", encryptedData);
        console.log("Encrypted data:", encryptedData);
        console.log("Encrypted data:", encryptedData);

    const result = decryptData(encryptedData);


    console.log("Decrypted data:", result);
    console.log("Decrypted data:", result);
    console.log("Decrypted data:", result)


    if (result === null) {
      console.warn(`Failed to decrypt data for key: ${key}`);
    }
    
    return result;
  } catch (error) {
    console.error("Failed to get decrypted data:", error);
    return null;
  }
};

/**
 * Stores encrypted data in sessionStorage
 * @param {string} key - Storage key
 * @param {Object|string} data - Data to encrypt and store
 * @returns {boolean} - Success status
 */
export const storeEncryptedDataInSession = (key, data) => {
  try {
    const encrypted = encryptData(data);
    if (!encrypted) {
      console.error("Failed to encrypt data for session storage");
      return false;
    }
    sessionStorage.setItem(key, encrypted);
    return true;
  } catch (error) {
    console.error("Failed to store encrypted data in session:", error);
    return false;
  }
};

/**
 * Retrieves and decrypts data from sessionStorage
 * @param {string} key - Storage key
 * @returns {Object|string|null} - Decrypted data
 */
export const getDecryptedDataFromSession = (key) => {
  try {
    const encryptedData = sessionStorage.getItem(key);
    
    if (!encryptedData) {
      console.warn(`No session data found for key: ${key}`);
      return null;
    }
    
    return decryptData(encryptedData);
  } catch (error) {
    console.error("Failed to get decrypted data from session:", error);
    return null;
  }
};

/**
 * Removes a specific key from localStorage
 * @param {string} key - Storage key to remove
 */
export const removeEncryptedData = (key) => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error("Failed to remove encrypted data:", error);
  }
};

/**
 * Removes a specific key from sessionStorage
 * @param {string} key - Storage key to remove
 */
export const removeEncryptedDataFromSession = (key) => {
  try {
    sessionStorage.removeItem(key);
  } catch (error) {
    console.error("Failed to remove encrypted data from session:", error);
  }
};

// Utility function to check if device fingerprint has changed
export const validateDeviceFingerprint = () => {
  const currentFingerprint = generateStableDeviceInfo();
  const storedFingerprint = localStorage.getItem('device_fingerprint');
  
  if (!storedFingerprint) {
    localStorage.setItem('device_fingerprint', currentFingerprint);
    return true;
  }
  
  return currentFingerprint === storedFingerprint;
};

// Migration utility for existing unencrypted data
export const migrateUnencryptedData = (key) => {
  try {
    const rawData = localStorage.getItem(key);
    if (!rawData) return false;
    
    // Try to decrypt first - if it works, data is already encrypted
    const decrypted = decryptData(rawData);
    if (decrypted !== null) {
      console.log(`Data for key ${key} is already encrypted`);
      return true;
    }
    
    // If decryption fails, assume it's unencrypted and encrypt it
    console.log(`Migrating unencrypted data for key: ${key}`);
    const success = storeEncryptedData(key, rawData);
    
    if (success) {
      console.log(`Successfully migrated data for key: ${key}`);
    }
    
    return success;
  } catch (error) {
    console.error("Migration failed:", error);
    return false;
  }
};


