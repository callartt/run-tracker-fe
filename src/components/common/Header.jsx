import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  FaRunning, 
  FaHistory, 
  FaCog, 
  FaMoon, 
  FaSun,
  FaBars,
  FaTimes,
  FaTrophy,
  FaChartLine
} from 'react-icons/fa'
import { useUser } from '../../context/UserContext'
import Icon from '../common/Icon' // Import our Icon wrapper

const Header = () => {
  const { user, toggleTheme } = useUser()
  const { pathname } = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  
  const isActive = (path) => pathname === path
  
  const navItems = [
    { path: '/', icon: FaRunning, label: 'Run' },
    { path: '/history', icon: FaHistory, label: 'History' },
    { path: '/goals', icon: FaTrophy, label: 'Goals' },
    { path: '/stats', icon: FaChartLine, label: 'Stats' },
    { path: '/settings', icon: FaCog, label: 'Settings' }
  ];
  
  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10">
      <div className="container-mobile mx-auto">
        <div className="flex items-center justify-between py-4">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <Icon icon={FaRunning} className="text-primary text-2xl" />
            <span className="text-lg font-bold">RunTracker</span>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-1 px-2 py-1 rounded-lg transition-colors
                  ${isActive(item.path) 
                    ? 'text-primary font-medium' 
                    : 'text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary'
                  }`}
              >
                <Icon icon={item.icon} />
                <span>{item.label}</span>
              </Link>
            ))}
            
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
              aria-label="Toggle theme"
            >
              <Icon icon={user.theme === 'dark' ? FaSun : FaMoon} />
            </button>
          </nav>
          
          {/* Mobile Menu Button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={toggleTheme}
              className="p-2 mr-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
              aria-label="Toggle theme"
            >
              <Icon icon={user.theme === 'dark' ? FaSun : FaMoon} />
            </button>
            
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
              aria-label="Open menu"
            >
              <Icon icon={menuOpen ? FaTimes : FaBars} />
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Navigation */}
      {menuOpen && (
        <nav className="md:hidden bg-white dark:bg-gray-800 border-t dark:border-gray-700 py-2">
          <div className="container-mobile mx-auto">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors
                  ${isActive(item.path) 
                    ? 'bg-primary bg-opacity-10 text-primary font-medium' 
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
              >
                <Icon icon={item.icon} className="text-lg" />
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  )
}

export default Header