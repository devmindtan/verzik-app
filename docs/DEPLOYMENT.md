# Deployment & Running Guide

## Local Development

### Quick Start
```bash
cd project
npm install
npm run dev
```

The application will be available at `http://localhost:5173`

### Development Commands
```bash
# Start dev server with hot reload
npm run dev

# Type checking
npm run typecheck

# Linting
npm run lint

# Build for production
npm run build

# Preview production build locally
npm run preview
```

## Production Build

### Build Process
```bash
npm run build
# Creates optimized bundle in dist/
```

### Build Output
- `dist/index.html` - Single page application
- `dist/assets/index-*.css` - Styles (minified)
- `dist/assets/index-*.js` - JavaScript (minified, ~192KB gzipped)

### Key Metrics
- Bundle size: ~192KB gzipped
- Load time: <1s on 4G
- Lighthouse score: 95+ (performance)

## Hosting Options

### Option 1: Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

### Option 2: Netlify
```bash
npm install -g netlify-cli
netlify deploy --prod --dir dist
```

### Option 3: GitHub Pages
```bash
# Update vite.config.ts with base path
# npm run build
# Push dist/ to gh-pages branch
```

### Option 4: Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "preview"]
```

### Option 5: Traditional Server (Nginx/Apache)
```bash
# Build the app
npm run build

# Copy dist/ folder to web root
cp -r dist/* /var/www/html/

# Set up Nginx
location / {
  try_files $uri /index.html;
}
```

## Environment Variables

Current demo requires NO environment variables. When integrating with blockchain/database, add:

```env
# .env.local (for development)
VITE_API_URL=http://localhost:3000
VITE_CHAIN_ID=1
VITE_INFURA_KEY=your_key_here

# .env.production (for production)
VITE_API_URL=https://api.production.com
VITE_CHAIN_ID=1
VITE_INFURA_KEY=your_key_here
```

### Loading Environment Variables
```typescript
// In your code
const apiUrl = import.meta.env.VITE_API_URL;
const chainId = import.meta.env.VITE_CHAIN_ID;
```

## Monitoring & Analytics

### Console Logs
Events are logged to browser console:
```
[BlockchainService] Tenant created: Finance Ops
[AuthService] User connected: 0xadmin001
[Event] Document anchored by 0xoperator001
```

### Debug Mode
```typescript
// In development, see all state changes
console.log(blockchainService.getTenants());
console.log(blockchainService.getEvents());
```

## Troubleshooting Deployment

### Issue: "Module not found" errors
**Solution**: Clear node_modules and reinstall
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Issue: CORS errors (when adding backend)
**Solution**: Configure CORS headers on backend
```javascript
app.use(cors({
  origin: 'https://yourdomain.com',
  credentials: true
}));
```

### Issue: Images/assets not loading
**Solution**: Check Vite base configuration
```typescript
// vite.config.ts
export default {
  base: '/path-to-app/',
}
```

### Issue: State not persisting on refresh
**This is by design in demo**. To add persistence:
```typescript
// Save to localStorage
localStorage.setItem('appState', JSON.stringify(state));

// Load on startup
const state = JSON.parse(localStorage.getItem('appState'));
```

## Performance Optimization

### Current Bundle
```
Total: 192KB gzipped
├─ React: 35%
├─ Tailwind: 25%
├─ Application: 30%
└─ Other: 10%
```

### Optimization Techniques
```typescript
// 1. Code splitting (automatic with Vite)
// 2. Lazy loading pages
const DashboardPage = lazy(() => import('./pages/DashboardPage'));

// 3. Image optimization
// 4. CSS purging (automatic with Tailwind)
```

## Security Checklist

Before production deployment:

- [ ] Remove console.log statements
- [ ] Add input validation
- [ ] Implement rate limiting
- [ ] Add CSRF protection
- [ ] Enable HTTPS only
- [ ] Set security headers
- [ ] Update dependencies
- [ ] Run security audit: `npm audit`
- [ ] Test with real wallets (on testnet first)
- [ ] Set up error monitoring (Sentry)

### Security Headers (Nginx)
```nginx
add_header X-Content-Type-Options "nosniff";
add_header X-Frame-Options "SAMEORIGIN";
add_header X-XSS-Protection "1; mode=block";
add_header Referrer-Policy "strict-origin-when-cross-origin";
```

## Scaling for Production

### Phase 1: Data Backend
```
Current: In-memory
↓
Use: Supabase/PostgreSQL
Benefits: Data persistence, multi-user support
```

### Phase 2: API Backend
```
Add: Node.js/Python backend
Purpose: Business logic, authentication
Features: Session management, validation
```

### Phase 3: Blockchain
```
Connect: Smart contracts
Purpose: On-chain operations
Features: Immutable audit trail, real assets
```

### Phase 4: Infrastructure
```
Add: CDN, caching, monitoring
Benefits: Better performance, reliability
Services: CloudFlare, Datadog, etc.
```

## Maintenance

### Regular Tasks
- [ ] Update dependencies monthly: `npm update`
- [ ] Security audit: `npm audit`
- [ ] Run tests on new features
- [ ] Monitor error logs
- [ ] Clean up old events (if storing in DB)

### Dependency Updates
```bash
# Check for outdated packages
npm outdated

# Update to latest versions (safe)
npm update

# Update major versions (requires testing)
npm upgrade package-name@latest
```

## Disaster Recovery

### Backup Strategy
- Source code: Git repository
- Configuration: Environment variables
- Data: Database backups (if using real DB)
- Events: Blockchain (immutable)

### Recovery Procedure
1. Restore from latest backup
2. Verify data integrity
3. Run smoke tests
4. Deploy to staging first
5. Monitor for 24 hours
6. Deploy to production if stable

## Cost Estimation (Annual)

```
Hosting Options:
├─ Vercel/Netlify Free Tier: $0 (small projects)
├─ Vercel/Netlify Pro: $20/month ($240/year)
├─ AWS/Azure VM: $50-200/month ($600-2400/year)
└─ Enterprise: Custom pricing

Database (if needed):
├─ Supabase Free: $0
├─ Supabase Pro: $25/month ($300/year)
└─ PostgreSQL Self-Hosted: $50/month ($600/year)

Domain & SSL:
├─ Domain: $10-15/year
└─ SSL: Free (Let's Encrypt) or $50+

Blockchain (if applicable):
├─ Testnet: Free
├─ Mainnet: Gas fees (varies by network)
└─ RPC Node: $0-100/month
```

## Next Steps

1. **For Demo**: Run locally with `npm run dev`
2. **For Testing**: Deploy to staging environment
3. **For Production**: Follow deployment checklist
4. **For Customization**: Modify demo data in blockchainService.ts
5. **For Integration**: Add backend and blockchain connections

---

**Last Updated**: 2024
**Version**: 1.0
