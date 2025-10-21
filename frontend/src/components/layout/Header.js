import React from 'react';
import {
    AppBar,
    Toolbar,
    Typography,
    Box,
    Chip,
    Button,
    IconButton,
    Menu,
    MenuItem,
    Avatar
} from '@mui/material';
import {
    VideoCall,
    Language,
    Logout,
    AccountCircle,
    ArrowBack
} from '@mui/icons-material';
import LanguageSelector from '../common/LanguageSelector';
import { useAuth } from '../../contexts/AuthContext';

const Header = ({ showBackButton = false, onBackClick }) => {
    const { user, logout } = useAuth();
    const [anchorEl, setAnchorEl] = React.useState(null);

    const handleMenu = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = () => {
        logout();
        handleClose();
    };

    return (
        <AppBar position="static" elevation={2}>
            <Toolbar>
                {showBackButton && (
                    <IconButton
                        edge="start"
                        color="inherit"
                        aria-label="back"
                        onClick={onBackClick}
                        sx={{ mr: 1 }}
                    >
                        <ArrowBack />
                    </IconButton>
                )}
                <VideoCall sx={{ mr: 2 }} />
                <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                    AI Interview Platform
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <LanguageSelector />
                    {user && (
                        <>
                            <Chip
                                label={user.role}
                                color="secondary"
                                size="small"
                                variant="outlined"
                            />
                            <IconButton
                                size="large"
                                aria-label="account of current user"
                                aria-controls="menu-appbar"
                                aria-haspopup="true"
                                onClick={handleMenu}
                                color="inherit"
                            >
                                <Avatar sx={{ width: 32, height: 32 }}>
                                    {user.email.charAt(0).toUpperCase()}
                                </Avatar>
                            </IconButton>
                            <Menu
                                id="menu-appbar"
                                anchorEl={anchorEl}
                                anchorOrigin={{
                                    vertical: 'top',
                                    horizontal: 'right',
                                }}
                                keepMounted
                                transformOrigin={{
                                    vertical: 'top',
                                    horizontal: 'right',
                                }}
                                open={Boolean(anchorEl)}
                                onClose={handleClose}
                            >
                                <MenuItem onClick={handleClose}>
                                    <AccountCircle sx={{ mr: 1 }} />
                                    Profile
                                </MenuItem>
                                <MenuItem onClick={handleLogout}>
                                    <Logout sx={{ mr: 1 }} />
                                    Logout
                                </MenuItem>
                            </Menu>
                        </>
                    )}
                </Box>
            </Toolbar>
        </AppBar>
    );
};

export default Header;


