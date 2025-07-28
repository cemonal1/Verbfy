# Verbfy Reservation System Test Guide

## 🎯 **System Overview**
This guide helps you test the complete reservation system to ensure students can book lessons and join them within the lesson time.

## 🔧 **Fixed Issues**

### 1. **Dashboard Errors Fixed**
- ✅ Fixed `ReferenceError: Cannot access 'calculateDuration' before initialization` in both teacher and student dashboards
- ✅ Moved function definitions before usage

### 2. **Camera Issues Fixed**
- ✅ Improved `getUserMedia()` with better error handling and debugging
- ✅ Added comprehensive logging for camera access
- ✅ Enhanced video element setup with proper event handlers
- ✅ Added retry mechanisms for video playback

### 3. **Screen Share Issues Fixed**
- ✅ Improved `getDisplayMedia()` with better error handling
- ✅ Added comprehensive logging for screen sharing
- ✅ Enhanced screen share video element setup

### 4. **Time Validation Fixed**
- ✅ Made time validation more flexible for development (2-hour window vs 15 minutes)
- ✅ Added better debugging for time validation issues
- ✅ Environment-aware time windows (production vs development)

### 5. **Reservation System Improvements**
- ✅ Verified all backend routes are properly ordered
- ✅ Confirmed MongoDB transactions for atomic booking
- ✅ Validated double-booking prevention
- ✅ Checked role-based access controls

## 🧪 **Testing Steps**

### **Step 1: Test Teacher Availability Setup**
1. Login as a teacher
2. Go to teacher dashboard
3. Set availability for different days and times
4. Verify availability is saved correctly

### **Step 2: Test Student Booking Flow**
1. Login as a student
2. Go to `/student/reserve`
3. Select a teacher
4. View available time slots
5. Select a time slot and date
6. Complete booking
7. Verify booking appears in student dashboard

### **Step 3: Test Lesson Joining**
1. Wait for lesson time (or use development time window)
2. Click "Join Lesson" button
3. Verify camera access is requested
4. Confirm camera shows video feed
5. Test microphone mute/unmute
6. Test video on/off
7. Test screen sharing
8. Test chat functionality
9. Test materials upload (teacher only)

### **Step 4: Test Dashboard Integration**
1. Check teacher dashboard shows upcoming lessons
2. Check student dashboard shows booked lessons
3. Verify lesson statistics are calculated correctly
4. Test lesson cancellation (if needed)

## 🔍 **Debugging Tips**

### **Camera Not Working**
1. Check browser console for camera access logs
2. Ensure browser permissions are granted
3. Check if camera is being used by another app
4. Try refreshing the page

### **Booking Issues**
1. Check browser console for API errors
2. Verify teacher has set availability
3. Check if time slot is already booked
4. Verify user roles are correct

### **Lesson Access Issues**
1. Check reservation status is 'booked'
2. Verify user is part of the reservation
3. Check time validation logs in backend console
4. Ensure lesson time is within allowed window

## 🚀 **Expected Behavior**

### **Successful Booking Flow**
1. Student selects teacher → Available slots load
2. Student selects slot → Date is auto-calculated
3. Student confirms booking → Success message
4. Booking appears in both dashboards
5. Availability slot is marked as booked

### **Successful Lesson Join**
1. User clicks "Join Lesson" → Room loads
2. Camera permission requested → User allows
3. Video feed displays → User sees themselves
4. Controls work → Mute, video, screen share
5. Chat works → Messages send/receive
6. Materials work → Upload and share

## 🐛 **Common Issues & Solutions**

### **"Camera is still not working"**
- **Solution**: Check browser permissions, refresh page, check console logs
- **Debug**: Look for camera access logs in browser console

### **"Not yet available"**
- **Solution**: Check lesson time is within 2-hour window (development)
- **Debug**: Check backend console for time validation logs

### **"Double booking"**
- **Solution**: Check if slot is already booked by another student
- **Debug**: Check availability service and reservation model

### **"Authentication failed"**
- **Solution**: Check JWT token is valid and not expired
- **Debug**: Check auth middleware and token refresh logic

## 📊 **System Health Check**

### **Backend Health**
- ✅ MongoDB connection
- ✅ JWT authentication
- ✅ Reservation routes
- ✅ Availability routes
- ✅ Socket.IO server
- ✅ Time validation logic

### **Frontend Health**
- ✅ Camera access
- ✅ Screen sharing
- ✅ Booking flow
- ✅ Dashboard integration
- ✅ Real-time updates
- ✅ Error handling

## 🎉 **Success Criteria**

The reservation system is working correctly when:
1. ✅ Students can book lessons without errors
2. ✅ Teachers can see their bookings
3. ✅ Students can see their bookings
4. ✅ Users can join lessons at the right time
5. ✅ Camera and microphone work in lessons
6. ✅ Screen sharing works in lessons
7. ✅ Chat and materials work in lessons
8. ✅ All dashboards show correct data
9. ✅ No console errors or crashes
10. ✅ Real-time updates work properly

## 🔄 **Next Steps**

If all tests pass:
1. Deploy to production
2. Set production time window to 15 minutes
3. Add email notifications
4. Add payment integration
5. Add lesson recording
6. Add feedback system

If tests fail:
1. Check console logs for specific errors
2. Verify database connections
3. Check environment variables
4. Test individual components
5. Debug step by step 