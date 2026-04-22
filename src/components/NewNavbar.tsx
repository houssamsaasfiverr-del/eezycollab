import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Menu, X, User, LogOut, Settings, CreditCard, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

interface NavItem {
  id: string;
  label: string;
}

export const NewNavbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeItem, setActiveItem] = useState('home');
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const [hoverStyle, setHoverStyle] = useState({ left: 0, width: 0, opacity: 0 });
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const linkRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const observerRef = useRef<IntersectionObserver | null>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  const navItems: NavItem[] = [
    { id: 'home', label: 'Home' },
    { id: 'features', label: 'Features' },
    { id: 'pricing', label: 'Pricing' },
    { id: 'templates', label: 'Templates' },
  ];

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const sections = navItems.map(item => document.getElementById(item.id));
    const options = {
      rootMargin: '-20% 0px -40% 0px',
      threshold: 0
    };

    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setActiveItem(entry.target.id);
        }
      });
    }, options);

    sections.forEach(section => {
      if (section) {
        observerRef.current?.observe(section);
      }
    });

    return () => {
      sections.forEach(section => {
        if (section) observerRef.current?.unobserve(section);
      });
      observerRef.current?.disconnect();
    };
  }, []);

  useEffect(() => {
    const activeElement = linkRefs.current[activeItem];
    const navElement = navRef.current;
    if (activeElement && navElement) {
      const navRect = navElement.getBoundingClientRect();
      const activeRect = activeElement.getBoundingClientRect();
      setIndicatorStyle({
        left: activeRect.left - navRect.left,
        width: activeRect.width,
      });
    }
  }, [activeItem, scrolled]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavClick = useCallback((item: NavItem) => {
    if (window.location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        const element = document.getElementById(item.id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 300);
    } else {
      const element = document.getElementById(item.id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
    setActiveItem(item.id);
    setIsOpen(false);
  }, [navigate]);

  const handleMouseEnter = (itemId: string) => {
    const element = linkRefs.current[itemId];
    const navElement = navRef.current;
    if (element && navElement) {
      const navRect = navElement.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();
      setHoverStyle({
        left: elementRect.left - navRect.left,
        width: elementRect.width,
        opacity: 1,
      });
    }
  };

  const handleMouseLeave = () => {
    setHoverStyle(prev => ({ ...prev, opacity: 0 }));
  };

  const handleAuthClick = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setShowProfileMenu(false);
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-white/80 backdrop-blur-2xl shadow-lg border-b border-white/30'
          : 'bg-white/60 backdrop-blur-md'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0 cursor-pointer" onClick={() => navigate('/')}>
            <span className="text-xl font-bold text-gray-900">CollabFree</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block flex-1 justify-center">
            <div className="relative flex justify-center" ref={navRef}>
              <div
                className="absolute bottom-0 h-full bg-blue-50/60 rounded-lg transition-all duration-300 ease-out"
                style={{
                  left: `${hoverStyle.left}px`,
                  width: `${hoverStyle.width}px`,
                  opacity: hoverStyle.opacity,
                }}
              />
              <div
                className="absolute bottom-0 h-full bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 backdrop-blur rounded-lg transition-all duration-500 ease-out shadow-md"
                style={{
                  left: `${indicatorStyle.left}px`,
                  width: `${indicatorStyle.width}px`,
                }}
              />
              <div className="flex items-center space-x-1 relative z-10">
                {navItems.map(item => (
                  <button
                    key={item.id}
                    ref={el => (linkRefs.current[item.id] = el)}
                    onClick={() => handleNavClick(item)}
                    onMouseEnter={() => handleMouseEnter(item.id)}
                    onMouseLeave={handleMouseLeave}
                    className={`px-5 py-2 font-semibold text-base transition-colors duration-300 bg-transparent ${
                      activeItem === item.id
                        ? 'text-blue-700'
                        : 'text-gray-700 hover:text-blue-600'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Auth Buttons / Profile */}
          <div className="hidden md:flex items-center space-x-3">
            {user ? (
              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-all"
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt="Profile"
                      className="w-8 h-8 rounded-full border-2 border-blue-400"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                      {user.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="font-semibold text-gray-700">{user.displayName || 'User'}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
                </button>

                {/* Profile Dropdown */}
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 animate-fade-in">
                    <div className="px-4 py-3 border-b border-gray-200">
                      <div className="flex items-center gap-3">
                        {user.photoURL ? (
                          <img src={user.photoURL} alt="Profile" className="w-12 h-12 rounded-full" />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
                            {user.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 truncate">
                            {user.displayName || 'User'}
                          </div>
                          <div className="text-sm text-gray-600 truncate">{user.email}</div>
                        </div>
                      </div>
                    </div>

                    <div className="py-2">
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          navigate('/dashboard');
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-gray-700"
                      >
                        <User className="w-5 h-5" />
                        <span>Dashboard</span>
                      </button>
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          navigate('/#pricing');
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-gray-700"
                      >
                        <CreditCard className="w-5 h-5" />
                        <span>Upgrade Plan</span>
                      </button>
                      <button className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-gray-700">
                        <Settings className="w-5 h-5" />
                        <span>Settings</span>
                      </button>
                    </div>

                    <div className="border-t border-gray-200 py-2">
                      <button
                        onClick={handleLogout}
                        className="w-full px-4 py-2 text-left hover:bg-red-50 flex items-center gap-3 text-red-600 font-semibold"
                      >
                        <LogOut className="w-5 h-5" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <button
                  onClick={() => handleAuthClick('/login')}
                  className="px-4 py-2 text-gray-700 hover:text-blue-600 font-semibold rounded-lg hover:bg-gray-50 transition-all"
                >
                  Sign in
                </button>
                <button
                  onClick={() => handleAuthClick('/signup')}
                  className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Get Started
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(prev => !prev)}
              className="p-2 text-gray-700 hover:text-blue-600 rounded-lg hover:bg-gray-50 transition-all"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden bg-white/90 backdrop-blur-2xl border-t border-gray-200 shadow-xl">
          <div className="px-6 py-4 space-y-2">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item)}
                className={`block w-full px-4 py-3 text-left rounded-lg font-semibold transition-all ${
                  activeItem === item.id
                    ? 'text-blue-700 bg-blue-50 border-l-4 border-blue-600'
                    : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                }`}
              >
                {item.label}
              </button>
            ))}
            <div className="pt-4 mt-4 border-t border-gray-200 space-y-3">
              {user ? (
                <>
                  <div className="px-4 py-2">
                    <div className="flex items-center gap-3">
                      {user.photoURL ? (
                        <img src={user.photoURL} alt="Profile" className="w-10 h-10 rounded-full" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
                          {user.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 truncate">{user.displayName || 'User'}</div>
                        <div className="text-sm text-gray-600 truncate">{user.email}</div>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      navigate('/dashboard');
                    }}
                    className="w-full px-4 py-3 text-gray-700 hover:text-blue-600 font-semibold rounded-lg hover:bg-gray-50 transition-all text-left flex items-center gap-2"
                  >
                    <User className="w-5 h-5" />
                    Dashboard
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-3 text-red-600 font-semibold rounded-lg hover:bg-red-50 transition-all text-left flex items-center gap-2"
                  >
                    <LogOut className="w-5 h-5" />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => handleAuthClick('/login')}
                    className="w-full px-4 py-3 text-gray-700 hover:text-blue-600 font-semibold rounded-lg hover:bg-gray-50 transition-all text-left"
                  >
                    Sign in
                  </button>
                  <button
                    onClick={() => handleAuthClick('/signup')}
                    className="w-full px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all shadow-lg"
                  >
                    Get Started
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
      `}</style>
    </nav>
  );
};
