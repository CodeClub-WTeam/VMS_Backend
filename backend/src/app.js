const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Trust proxy - required for deployment on Vercel, Heroku, etc.
// Trust only the first proxy (Vercel) for security
app.set('trust proxy', 1);

// Security middleware with relaxed CSP for Swagger UI
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com"],
      connectSrc: ["'self'", "https://unpkg.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true,
};
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests from this IP, please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// Swagger documentation - Serve JSON only
app.get('/api-docs', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.json(swaggerSpec);
});

// Interactive Swagger UI with embedded CDN resources
app.get('/docs', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>VMS API Documentation</title>
        <style>
            html { box-sizing: border-box; overflow: -moz-scrollbars-vertical; overflow-y: scroll; }
            *, *:before, *:after { box-sizing: inherit; }
            body { margin: 0; background: #fafafa; }
            .swagger-ui .topbar { display: none; }
            .swagger-ui .info { margin: 20px 0; }
            .swagger-ui .scheme-container { background: #fff; padding: 10px; border-radius: 4px; margin: 10px 0; }
            .credentials-banner {
                background: #1a237e;
                color: white;
                padding: 40px 20px;
                margin: 0;
                box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            }
            .banner-content {
                max-width: 1200px;
                margin: 0 auto;
                text-align: center;
            }
            .credentials-banner h1 {
                margin: 0 0 8px 0;
                font-size: 2.5rem;
                font-weight: 300;
                letter-spacing: -0.5px;
            }
            .subtitle {
                margin: 0 0 40px 0;
                font-size: 1.1rem;
                opacity: 0.9;
                font-weight: 300;
            }
            .credentials-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                gap: 20px;
                margin-top: 20px;
            }
            .credential-card {
                background: rgba(255,255,255,0.12);
                padding: 24px;
                border-radius: 12px;
                backdrop-filter: blur(20px);
                border: 1px solid rgba(255,255,255,0.1);
                transition: transform 0.2s ease, background 0.2s ease;
            }
            .credential-card:hover {
                transform: translateY(-2px);
                background: rgba(255,255,255,0.16);
            }
            .credential-card h4 {
                margin: 0 0 20px 0;
                font-size: 1.2rem;
                font-weight: 500;
                text-transform: uppercase;
                letter-spacing: 1px;
                opacity: 0.9;
            }
            .credential-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin: 12px 0;
                padding: 8px 0;
                border-bottom: 1px solid rgba(255,255,255,0.1);
            }
            .credential-row:last-child {
                border-bottom: none;
            }
            .credential-row label {
                font-size: 0.9rem;
                opacity: 0.8;
                font-weight: 500;
            }
            .credential-card code {
                background: rgba(255,255,255,0.2);
                padding: 6px 12px;
                border-radius: 6px;
                font-size: 0.9rem;
                font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
                word-break: break-all;
                border: 1px solid rgba(255,255,255,0.1);
            }
        </style>
        <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui.css" />
    </head>
    <body>
        <div class="credentials-banner">
            <div class="banner-content">
                <h1>VMS API Documentation</h1>
                <p class="subtitle">Visitor Management System - Interactive API Reference</p>
                <div class="credentials-grid">
                    <div class="credential-card">
                        <h4>Resident</h4>
                        <div class="credential-row">
                            <label>Email:</label>
                            <code>resident1@example.com</code>
                        </div>
                        <div class="credential-row">
                            <label>Password:</label>
                            <code>Password123!</code>
                        </div>
                    </div>
                    <div class="credential-card">
                        <h4>Security</h4>
                        <div class="credential-row">
                            <label>Email:</label>
                            <code>security1@greenvally.com</code>
                        </div>
                        <div class="credential-row">
                            <label>Password:</label>
                            <code>Password123!</code>
                        </div>
                    </div>
                    <div class="credential-card">
                        <h4>Super Admin</h4>
                        <div class="credential-row">
                            <label>Email:</label>
                            <code>superadmin@vms.com</code>
                        </div>
                        <div class="credential-row">
                            <label>Password:</label>
                            <code>Password123!</code>
                        </div>
                    </div>
                    <div class="credential-card">
                        <h4>Admin</h4>
                        <div class="credential-row">
                            <label>Email:</label>
                            <code>admin@greenvally.com</code>
                        </div>
                        <div class="credential-row">
                            <label>Password:</label>
                            <code>Admin123!</code>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div id="swagger-ui"></div>

        <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-bundle.js"></script>
        <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-standalone-preset.js"></script>
        <script>
            window.onload = function() {
                const ui = SwaggerUIBundle({
                    url: '/api-docs',
                    dom_id: '#swagger-ui',
                    deepLinking: true,
                    presets: [
                        SwaggerUIBundle.presets.apis,
                        SwaggerUIStandalonePreset
                    ],
                    plugins: [
                        SwaggerUIBundle.plugins.DownloadUrl
                    ],
                    layout: "StandaloneLayout",
                    validatorUrl: null,
                    docExpansion: "list",
                    operationsSorter: "alpha",
                    tagsSorter: "alpha",
                    tryItOutEnabled: true,
                    requestInterceptor: function(request) {
                        console.log('Making request:', request);
                        return request;
                    },
                    responseInterceptor: function(response) {
                        console.log('Response received:', response);
                        return response;
                    }
                });

                // Global function to fill login forms
                window.fillLoginForm = function(email, password) {
                    // Find all login endpoints
                    const loginEndpoints = document.querySelectorAll('[data-path*="/auth/"], [data-path*="/login"]');
                    
                    loginEndpoints.forEach(endpoint => {
                        const tryButton = endpoint.querySelector('.try-out__btn');
                        if (tryButton) {
                            tryButton.click();
                            
                            setTimeout(() => {
                                const emailInput = endpoint.querySelector('input[placeholder*="email" i], input[name*="email" i]');
                                const passwordInput = endpoint.querySelector('input[type="password"], input[placeholder*="password" i]');
                                
                                if (emailInput) {
                                    emailInput.value = email;
                                    emailInput.dispatchEvent(new Event('input', { bubbles: true }));
                                }
                                if (passwordInput) {
                                    passwordInput.value = password;
                                    passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
                                }
                            }, 100);
                        }
                    });
                    
                    // Scroll to first login endpoint
                    if (loginEndpoints.length > 0) {
                        loginEndpoints[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                };

                // Auto-fill function for token authorization
                window.autoFillToken = function(token) {
                    const authorizeBtn = document.querySelector('.auth-btn-wrapper .btn');
                    if (authorizeBtn) {
                        authorizeBtn.click();
                        setTimeout(() => {
                            const tokenInput = document.querySelector('input[placeholder*="token" i], input[name*="token" i]');
                            if (tokenInput) {
                                tokenInput.value = 'Bearer ' + token;
                                tokenInput.dispatchEvent(new Event('input', { bubbles: true }));
                            }
                        }, 100);
                    }
                };
            };
        </script>
    </body>
    </html>
  `);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Welcome route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to VMS API',
    version: '1.0.0',
    documentation: '/docs',
    api_spec: '/api-docs',
    health: '/health',
  });
});

// API routes
app.use('/api/v1', routes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Cannot ${req.method} ${req.path}`,
    },
  });
});

// Global error handler (must be last)
app.use(errorHandler);

module.exports = app;

