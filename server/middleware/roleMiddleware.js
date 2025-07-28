const roleMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    // Convert single role to array for consistency
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required roles: ${roles.join(', ')}. Your role: ${req.user.role}`
      });
    }

    next();
  };
};

// Specific role middlewares
const requireStudent = roleMiddleware('student');
const requireTeacher = roleMiddleware('teacher');
const requireAdmin = roleMiddleware('admin');
const requireTeacherOrAdmin = roleMiddleware(['teacher', 'admin']);
const requireStudentOrTeacher = roleMiddleware(['student', 'teacher']);

// Middleware to check if user is the owner of a resource
const requireOwnership = (resourceField = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    // Admins can access everything
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if user owns the resource
    const resourceUserId = req.params[resourceField] || req.body[resourceField];
    
    if (!resourceUserId) {
      return res.status(400).json({
        success: false,
        message: `Resource ${resourceField} not found in request.`
      });
    }

    if (resourceUserId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only access your own resources.'
      });
    }

    next();
  };
};

// Middleware to check if user is involved in a reservation
const requireReservationAccess = () => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    const { reservationId } = req.params;
    
    if (!reservationId) {
      return res.status(400).json({
        success: false,
        message: 'Reservation ID is required.'
      });
    }

    try {
      const Reservation = require('../models/Reservation');
      const reservation = await Reservation.findById(reservationId);
      
      if (!reservation) {
        return res.status(404).json({
          success: false,
          message: 'Reservation not found.'
        });
      }

      // Check if user is involved in the reservation
      const isStudent = reservation.studentId.toString() === req.user._id.toString();
      const isTeacher = reservation.teacherId.toString() === req.user._id.toString();
      const isAdmin = req.user.role === 'admin';

      if (!isStudent && !isTeacher && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You are not involved in this reservation.'
        });
      }

      // Add reservation to request for later use
      req.reservation = reservation;
      next();
    } catch (error) {
      console.error('Reservation access check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error while checking reservation access.'
      });
    }
  };
};

// Middleware to check if teacher is active
const requireActiveTeacher = () => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    if (req.user.role !== 'teacher') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Teacher role required.'
      });
    }

    if (!req.user.teacherProfile?.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Teacher account is not active.'
      });
    }

    next();
  };
};

module.exports = {
  roleMiddleware,
  requireStudent,
  requireTeacher,
  requireAdmin,
  requireTeacherOrAdmin,
  requireStudentOrTeacher,
  requireOwnership,
  requireReservationAccess,
  requireActiveTeacher
}; 