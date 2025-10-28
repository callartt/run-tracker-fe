import { Link, useLocation } from 'react-router-dom'
import { 
  FaRunning, 
  FaHistory, 
  FaCog,
  FaTrophy,
  FaChartLine
} from 'react-icons/fa'
import Icon from '../common/Icon' // Import our Icon wrapper

const Footer = () => {
  const { pathname } = useLocation()
  
  const isActive = (path) => pathname === path
  
  const navItems = [
    { path: '/', icon: FaRunning, label: 'Run' },
    { path: '/history', icon: FaHistory, label: 'History' },
    { path: '/goals', icon: FaTrophy, label: 'Goals' },
    { path: '/stats', icon: FaChartLine, label: 'Stats' },
    { path: '/settings', icon: FaCog, label: 'Settings' }
  ];
  
  return (
    <footer className="bg-white dark:bg-gray-800 shadow-inner sticky bottom-0 z-10 md:hidden">
      <nav className="flex items-center justify-around">
        {navItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center py-3 px-4 transition-colors
              ${isActive(item.path) 
                ? 'text-primary font-medium' 
                : 'text-gray-600 dark:text-gray-300'
              }`}
          >
            <Icon icon={item.icon} className="text-lg mb-1" />
            <span className="text-xs">{item.label}</span>
          </Link>
        ))}
      </nav>
    </footer>
  )
}

export default Footer