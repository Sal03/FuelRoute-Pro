import React, { useEffect, useState } from 'react';
import FuelForm from './FuelForm';
import './App.css';

// API Service - Backend Integration
const API_BASE_URL = 'http://localhost:5001/api';

const makeRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, { ...defaultOptions, ...options });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

// API functions
const checkApiHealth = () => makeRequest('/health');
const getFuelTypes = () => makeRequest('/fuel-types');
const getRouteHistory = () => makeRequest('/routes');
const calculateRouteCost = (routeData) => makeRequest('/calculate-cost', {
  method: 'POST',
  body: JSON.stringify(routeData),
});

function App() {
  // Backend integration state
  const [apiStatus, setApiStatus] = useState('checking');
  const [fuelTypes, setFuelTypes] = useState(['hydrogen', 'methanol', 'ammonia']); // Default fallback
  const [routeHistory, setRouteHistory] = useState([]);

  useEffect(() => {
    // Backend initialization
    const initializeBackend = async () => {
      try {
        // Check API health
        await checkApiHealth();
        setApiStatus('connected');
        console.log('✅ Backend connected successfully');

        // Load fuel types
        try {
          const fuelTypesResponse = await getFuelTypes();
          setFuelTypes(fuelTypesResponse.data || ['hydrogen', 'methanol', 'ammonia']);
        } catch (error) {
          console.warn('Using default fuel types:', error.message);
        }

        // Load route history
        try {
          const historyResponse = await getRouteHistory();
          setRouteHistory(historyResponse.data || []);
        } catch (error) {
          console.warn('Could not load route history:', error.message);
        }

      } catch (error) {
        console.error('Backend connection failed:', error);
        setApiStatus('error');
        // App continues to work with default values
      }
    };

    // Smooth scrolling for navigation links
    const handleSmoothScroll = (e) => {
      if (e.target.getAttribute('href')?.startsWith('#')) {
        e.preventDefault();
        const target = document.querySelector(e.target.getAttribute('href'));
        if (target) {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      }
    };

    // Hide header-top on scroll down
    let lastScrollY = window.scrollY;
    const headerTop = document.querySelector('.header-top');
    const header = document.querySelector('.header');

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        // Scrolling down
        if (headerTop) headerTop.style.transform = 'translateY(-100%)';
        if (header) header.style.top = '0';
      } else {
        // Scrolling up
        if (headerTop) headerTop.style.transform = 'translateY(0)';
        if (header) header.style.top = '40px';
      }
      
      lastScrollY = currentScrollY;
    };

    // Initialize everything
    initializeBackend();
    document.addEventListener('click', handleSmoothScroll);
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      document.removeEventListener('click', handleSmoothScroll);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Backend integration functions to pass to FuelForm
  const backendAPI = {
    calculateCost: calculateRouteCost,
    isConnected: apiStatus === 'connected',
    fuelTypes,
    routeHistory,
    refreshHistory: async () => {
      try {
        const historyResponse = await getRouteHistory();
        setRouteHistory(historyResponse.data || []);
      } catch (error) {
        console.warn('Could not refresh route history:', error.message);
      }
    }
  };

  return (
    <div className="App">
      {/* Header Top */}
      <div className="header-top">
        <div className="header-top-container">
          <a href="#login">🔐 Hub Login</a>
          <a href="#help">❓ Help</a>
          <a href="#support">📞 Support</a>
          {/* Backend Status Indicator */}
          <span className={`backend-status ${apiStatus}`}>
            {apiStatus === 'connected' ? '🟢 Backend Online' : 
             apiStatus === 'error' ? '🔴 Backend Offline' : 
             '🟡 Connecting...'}
          </span>
        </div>
      </div>

      {/* Header */}
      <header className="header">
        <div className="nav-container">
          <div className="logo">
            FuelRoute Pro
            <div className="logo-subtitle">By THAMPICO</div>
          </div>
          <nav>
            <ul className="nav-menu">
              <li><a href="#calculator">Calculator</a></li>
              <li><a href="#features">Features</a></li>
              <li><a href="#solutions">Solutions</a></li>
              <li><a href="#resources">Resources</a></li>
              <li><a href="#about">About</a></li>
            </ul>
          </nav>
          <div className="header-right">
            <div className="search-icon">🔍</div>
            <a href="#calculator" className="cta-button">Try Calculator</a>
          </div>
        </div>
      </header>

      {/* Original Hero Section */}
      <section className="hero">
        <div className="hero-container">
          <div className="hero-content">
            <h1>The Future of Fuel Transportation</h1>
            <p className="subtitle">AI-powered cost estimation for hydrogen, methanol, and ammonia logistics across all transport modes</p>
            <p className="description">Calculate transportation costs for hydrogen, methanol, and ammonia across multiple modes. Optimize routes, reduce costs, and accelerate the clean energy transition.</p>
            
            <div className="hero-buttons">
              <a href="#calculator" className="btn-primary">Start Calculating</a>
              <a href="#features" className="btn-secondary">Learn More</a>
            </div>

            <div className="hero-stats">
              <div className="stat-item">
                <div className="stat-number">3</div>
                <div className="stat-label">Alternative Fuels</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">4</div>
                <div className="stat-label">Transport Modes</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">AI</div>
                <div className="stat-label">Powered Analysis</div>
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="fuel-cards">
              <div className="fuel-card">
                <div className="fuel-formula">H₂</div>
                <div className="fuel-name">Hydrogen</div>
              </div>
              <div className="fuel-card">
                <div className="fuel-formula">CH₃OH</div>
                <div className="fuel-name">Methanol</div>
              </div>
              <div className="fuel-card">
                <div className="fuel-formula">NH₃</div>
                <div className="fuel-name">Ammonia</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Calculator Section - Enhanced with Backend Integration */}
      <section id="calculator">
        <FuelForm 
          backendAPI={backendAPI}
          apiStatus={apiStatus}
        />
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-brand">
            <div className="logo">FuelRoute Pro</div>
            <p>FuelRoute Pro makes alternative fuel transportation cost-effective and efficient for logistics professionals and energy companies through AI-powered analysis and real-time market intelligence.</p>
            <div className="social-links">
              <a href="#linkedin" title="LinkedIn">📧</a>
              <a href="#twitter" title="Twitter">🐦</a>
              <a href="#github" title="GitHub">💻</a>
              <a href="#youtube" title="YouTube">📺</a>
              <a href="#instagram" title="Instagram">📷</a>
            </div>
          </div>
          
          <div className="footer-section">
            <h3>Calculator</h3>
            <ul>
              <li><a href="#calculator">Cost Calculator</a></li>
              <li><a href="#hydrogen">Hydrogen Transport</a></li>
              <li><a href="#methanol">Methanol Logistics</a></li>
              <li><a href="#ammonia">Ammonia Shipping</a></li>
              <li><a href="#compare">Fuel Comparison</a></li>
              <li><a href="#api">API Access</a></li>
            </ul>
          </div>

          <div className="footer-section">
            <h3>Solutions</h3>
            <ul>
              <li><a href="#logistics">Logistics Professionals</a></li>
              <li><a href="#energy">Energy Companies</a></li>
              <li><a href="#government">Government Agencies</a></li>
              <li><a href="#trucking">Commercial Trucking</a></li>
              <li><a href="#shipping">Marine Shipping</a></li>
              <li><a href="#aviation">Aviation Transport</a></li>
              <li><a href="#pipeline">Pipeline Networks</a></li>
            </ul>
          </div>

          <div className="footer-section">
            <h3>Resources</h3>
            <ul>
              <li><a href="#blog">Blog & Insights</a></li>
              <li><a href="#guides">Transportation Guides</a></li>
              <li><a href="#research">Research Papers</a></li>
              <li><a href="#case-studies">Case Studies</a></li>
              <li><a href="#webinars">Webinars</a></li>
              <li><a href="#api-docs">API Documentation</a></li>
              <li><a href="#support">Help Center</a></li>
            </ul>
          </div>

          <div className="footer-section">
            <h3>Company</h3>
            <ul>
              <li><a href="#about">About FuelRoute Pro</a></li>
              <li><a href="#thampico">THAMPICO Program</a></li>
              <li><a href="#team">Our Team</a></li>
              <li><a href="#careers">Careers</a></li>
              <li><a href="#contact">Contact Us</a></li>
              <li><a href="#news">Newsroom</a></li>
              <li><a href="#investors">Investors</a></li>
            </ul>
          </div>
        </div>
        
        <div className="footer-bottom">
          <div>© 2025 FuelRoute Pro. All Rights Reserved. Developed by THAMPICO Capstone Program.</div>
          <div className="footer-bottom-links">
            <a href="#terms">Terms & Conditions</a>
            <a href="#privacy">Privacy Policy</a>
            <a href="#cookies">Cookie Policy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;