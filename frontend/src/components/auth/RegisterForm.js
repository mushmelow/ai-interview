import React, { useState } from 'react';
import {
    Box,
    Paper,
    TextField,
    Button,
    Typography,
    Alert,
    CircularProgress,
    Divider,
    FormControl,
    InputLabel,
    Select,
    MenuItem
} from '@mui/material';
import { PersonAdd as RegisterIcon, Login as LoginIcon } from '@mui/icons-material';

const RegisterForm = ({ onRegister, onSwitchToLogin, loading, error }) => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        role: 'candidate'
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            return;
        }

        onRegister({
            email: formData.email,
            password: formData.password,
            role: formData.role
        });
    };

    const isPasswordMismatch = formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword;

    return (
        <Paper elevation={3} sx={{ p: 4, maxWidth: 400, mx: 'auto', mt: 4 }}>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
                <RegisterIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="h4" gutterBottom>
                    Create Account
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Join the AI Interview Platform today!
                </Typography>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
                <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="email"
                    label="Email Address"
                    name="email"
                    autoComplete="email"
                    autoFocus
                    value={formData.email}
                    onChange={handleChange}
                    disabled={loading}
                />

                <FormControl fullWidth margin="normal" disabled={loading}>
                    <InputLabel id="role-label">Role</InputLabel>
                    <Select
                        labelId="role-label"
                        id="role"
                        name="role"
                        value={formData.role}
                        label="Role"
                        onChange={handleChange}
                    >
                        <MenuItem value="candidate">Candidate</MenuItem>
                        <MenuItem value="recruiter">Recruiter</MenuItem>
                    </Select>
                </FormControl>

                <TextField
                    margin="normal"
                    required
                    fullWidth
                    name="password"
                    label="Password"
                    type="password"
                    id="password"
                    autoComplete="new-password"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={loading}
                />
                <TextField
                    margin="normal"
                    required
                    fullWidth
                    name="confirmPassword"
                    label="Confirm Password"
                    type="password"
                    id="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    disabled={loading}
                    error={isPasswordMismatch}
                    helperText={isPasswordMismatch ? "Passwords don't match" : ""}
                />

                <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    sx={{ mt: 3, mb: 2 }}
                    disabled={loading || isPasswordMismatch}
                    startIcon={loading ? <CircularProgress size={20} /> : <RegisterIcon />}
                >
                    {loading ? 'Creating Account...' : 'Create Account'}
                </Button>

                <Divider sx={{ my: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                        OR
                    </Typography>
                </Divider>

                <Button
                    fullWidth
                    variant="outlined"
                    onClick={onSwitchToLogin}
                    disabled={loading}
                    startIcon={<LoginIcon />}
                >
                    Already have an account? Sign In
                </Button>
            </Box>
        </Paper>
    );
};

export default RegisterForm;


