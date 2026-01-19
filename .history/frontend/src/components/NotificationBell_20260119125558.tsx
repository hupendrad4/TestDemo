import React, { useState, useEffect } from 'react';
import {
  IconButton,
  Badge,
  Menu,
  MenuItem,
  ListItemText,
  Typography,
  Box,
  Divider,
  Button,
  Chip,
  ListItemIcon,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Check as CheckIcon,
  Delete as DeleteIcon,
  Circle as CircleIcon,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import notificationService, { Notification } from '../services/notification.service';

const NotificationBell: React.FC = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const open = Boolean(anchorEl);

  useEffect(() => {
    fetchUnreadCount();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const count = await NotificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await NotificationService.getNotifications(20);
      setNotifications(data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    fetchNotifications();
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await NotificationService.markAsRead(notificationId);
      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, isRead: true } : n
      ));
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await NotificationService.markAllAsRead();
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      await NotificationService.deleteNotification(notificationId);
      setNotifications(notifications.filter(n => n.id !== notificationId));
      const notification = notifications.find(n => n.id === notificationId);
      if (notification && !notification.isRead) {
        setUnreadCount(Math.max(0, unreadCount - 1));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getNotificationIcon = (_type: string) => {
    // Return different icons based on notification type
    return <CircleIcon sx={{ fontSize: 12 }} />;
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'EXECUTION_FAILED':
        return 'error';
      case 'EXECUTION_PASSED':
        return 'success';
      case 'ASSIGNMENT':
        return 'info';
      case 'MENTION':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <>
      <IconButton color="inherit" onClick={handleClick}>
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: { width: 400, maxHeight: 500 }
        }}
      >
        <Box sx={{ px: 2, py: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Notifications</Typography>
          {unreadCount > 0 && (
            <Button size="small" onClick={handleMarkAllAsRead}>
              Mark all read
            </Button>
          )}
        </Box>
        <Divider />

        {loading && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">Loading...</Typography>
          </Box>
        )}

        {!loading && notifications.length === 0 && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <NotificationsIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
            <Typography color="text.secondary">No notifications</Typography>
          </Box>
        )}

        {!loading && notifications.map((notification) => (
          <MenuItem
            key={notification.id}
            sx={{
              py: 1.5,
              bgcolor: notification.isRead ? 'transparent' : 'action.hover',
              '&:hover': { bgcolor: 'action.selected' }
            }}
          >
            <ListItemIcon>
              {getNotificationIcon(notification.type)}
            </ListItemIcon>
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" sx={{ flex: 1 }}>
                    {notification.title}
                  </Typography>
                  <Chip
                    label={notification.type}
                    size="small"
                    color={getNotificationColor(notification.type)}
                    sx={{ height: 20 }}
                  />
                </Box>
              }
              secondary={
                <>
                  <Typography variant="caption" display="block">
                    {notification.message}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                  </Typography>
                </>
              }
            />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {!notification.isRead && (
                <IconButton size="small" onClick={() => handleMarkAsRead(notification.id)}>
                  <CheckIcon fontSize="small" />
                </IconButton>
              )}
              <IconButton size="small" onClick={() => handleDelete(notification.id)}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default NotificationBell;
