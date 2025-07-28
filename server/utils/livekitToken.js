const { AccessToken } = require('livekit-server-sdk');

/**
 * Generate a LiveKit access token for room access
 * @param {string} identity - User identity (usually userId)
 * @param {string} roomName - Room name to join
 * @param {string} role - User role in the room ('host' or 'participant')
 * @param {Object} metadata - Additional metadata (optional)
 * @returns {string} JWT token for LiveKit room access
 */
const generateLiveKitToken = (identity, roomName, role = 'participant', metadata = {}) => {
  try {
    // Validate required parameters
    if (!identity || !roomName) {
      throw new Error('Identity and roomName are required');
    }

    if (!process.env.LIVEKIT_API_KEY || !process.env.LIVEKIT_API_SECRET) {
      throw new Error('LiveKit API credentials not configured');
    }

    // Create access token
    const token = new AccessToken(
      process.env.LIVEKIT_API_KEY,
      process.env.LIVEKIT_API_SECRET,
      {
        identity: identity,
        name: metadata.name || identity, // Display name
        metadata: JSON.stringify(metadata)
      }
    );

    // Grant permissions based on role
    if (role === 'host') {
      // Host can publish, subscribe, and manage the room
      token.addGrant({
        room: roomName,
        roomJoin: true,
        roomAdmin: true,
        canPublish: true,
        canSubscribe: true,
        canPublishData: true
      });
    } else {
      // Participant can publish and subscribe
      token.addGrant({
        room: roomName,
        roomJoin: true,
        canPublish: true,
        canSubscribe: true,
        canPublishData: true
      });
    }

    // Set token expiration (default: 1 hour)
    const expiration = Math.floor(Date.now() / 1000) + (60 * 60); // 1 hour from now
    token.setExpiration(expiration);

    return token.toJwt();
  } catch (error) {
    console.error('Error generating LiveKit token:', error);
    throw error;
  }
};

/**
 * Generate a token for lesson rooms
 * @param {string} userId - User ID
 * @param {string} userName - User display name
 * @param {string} userRole - User role ('student' or 'teacher')
 * @param {string} reservationId - Reservation ID (used as room name)
 * @returns {string} JWT token for lesson room access
 */
const generateLessonToken = (userId, userName, userRole, reservationId) => {
  const roomName = `lesson-${reservationId}`;
  const livekitRole = userRole === 'teacher' ? 'host' : 'participant';
  
  const metadata = {
    userId,
    userName,
    userRole,
    reservationId,
    roomType: 'lesson'
  };

  return generateLiveKitToken(userId, roomName, livekitRole, metadata);
};

/**
 * Generate a token for talk rooms
 * @param {string} userId - User ID
 * @param {string} userName - User display name
 * @param {string} roomId - Talk room ID
 * @returns {string} JWT token for talk room access
 */
const generateTalkToken = (userId, userName, roomId) => {
  const roomName = `talk-${roomId}`;
  
  const metadata = {
    userId,
    userName,
    roomType: 'talk'
  };

  return generateLiveKitToken(userId, roomName, 'participant', metadata);
};

/**
 * Validate LiveKit token
 * @param {string} token - JWT token to validate
 * @returns {Object} Decoded token payload
 */
const validateLiveKitToken = (token) => {
  try {
    if (!process.env.LIVEKIT_API_KEY || !process.env.LIVEKIT_API_SECRET) {
      throw new Error('LiveKit API credentials not configured');
    }

    const accessToken = AccessToken.fromString(token);
    return accessToken;
  } catch (error) {
    console.error('Error validating LiveKit token:', error);
    throw error;
  }
};

/**
 * Extract room information from token
 * @param {string} token - JWT token
 * @returns {Object} Room information
 */
const getRoomInfoFromToken = (token) => {
  try {
    const accessToken = validateLiveKitToken(token);
    const grants = accessToken.grants;
    
    return {
      roomName: grants.room,
      identity: accessToken.identity,
      metadata: JSON.parse(accessToken.metadata || '{}')
    };
  } catch (error) {
    console.error('Error extracting room info from token:', error);
    throw error;
  }
};

module.exports = {
  generateLiveKitToken,
  generateLessonToken,
  generateTalkToken,
  validateLiveKitToken,
  getRoomInfoFromToken
}; 