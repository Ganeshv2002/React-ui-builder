import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSun, faMoon } from '@fortawesome/free-solid-svg-icons';
import { useTheme } from './ThemeProvider';
import './ThemeToggle.css';

export const ThemeToggle = () => {
  const { colorScheme, toggleColorScheme } = useTheme();

  return (
    <button
      className={`theme-toggle ${colorScheme === 'dark' ? 'theme-toggle--dark' : 'theme-toggle--light'}`}
      onClick={toggleColorScheme}
      aria-label="Toggle theme"
      title={`Switch to ${colorScheme === 'dark' ? 'light' : 'dark'} theme`}
    >
      <div className="theme-toggle__track">
        <div className="theme-toggle__thumb">
          <FontAwesomeIcon 
            icon={colorScheme === 'dark' ? faMoon : faSun} 
            className="theme-toggle__icon"
          />
        </div>
      </div>
      {/* <span className="theme-toggle__label">
        {colorScheme === 'dark' ? 'Dark' : 'Light'}
      </span> */}
    </button>
  );
};
