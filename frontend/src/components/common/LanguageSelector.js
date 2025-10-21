import React from 'react';
import {
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Box,
} from '@mui/material';
import { Language } from '@mui/icons-material';

const LanguageSelector = () => {
    const [language, setLanguage] = React.useState('en');

    const languages = [
        { code: 'en', name: 'English', flag: '🇺🇸' },
        { code: 'fr', name: 'Français', flag: '🇫🇷' },
    ];

    const handleLanguageChange = (event) => {
        const newLanguage = event.target.value;
        setLanguage(newLanguage);
        // Here you would typically call i18n.changeLanguage(newLanguage)
        console.log('Language changed to:', newLanguage);
    };

    const currentLanguage = languages.find(lang => lang.code === language) || languages[0];

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Language sx={{ color: 'white' }} />
            <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel sx={{ color: 'white' }}>Language</InputLabel>
                <Select
                    value={language}
                    onChange={handleLanguageChange}
                    label="Language"
                    sx={{
                        color: 'white',
                        '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'white',
                        },
                        '& .MuiSvgIcon-root': {
                            color: 'white',
                        },
                    }}
                >
                    {languages.map((lang) => (
                        <MenuItem key={lang.code} value={lang.code}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <span>{lang.flag}</span>
                                <span>{lang.name}</span>
                            </Box>
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
        </Box>
    );
};

export default LanguageSelector;




