// src/components/common/Icon.jsx
import React from 'react';

// This is a special wrapper component to properly display Font Awesome icons
// It ensures consistent rendering across the application

const Icon = ({ icon: IconComponent, className = '', ...props }) => {
  return (
    <span className={`icon-container ${className}`} {...props}>
      <IconComponent />
    </span>
  );
};

export default Icon;