# jan-sunvai 🏛️

**AI-Driven Grievance Redressal Platform**

An intelligent citizen complaint management system that uses Natural Language Processing (NLP) to automatically classify, prioritize, and route grievances to appropriate government departments.

## ✨ Features

### Core Functionality
- **AI-Powered Classification**: Automatically categorizes complaints into Infrastructure, Sanitation, Safety, Utilities, Healthcare, Education, or Administration
- **Intelligent Prioritization**: Analyzes urgency, severity, and community impact to assign priority scores (Critical, High, Medium, Low)
- **Smart Routing**: Automatically routes complaints to the correct department based on AI analysis
- **Multi-Language Support**: Detects and handles English, Hindi, and mixed language complaints
- **Sentiment Analysis**: Understands citizen sentiment to better prioritize responses

### API Integrations
- **Google Maps API**: 
  - Location autocomplete for easy address entry
  - Geocoding to convert addresses to coordinates
  - Interactive map visualization of complaints
  - Geospatial analytics and complaint clustering
  
- **DigiLocker API**:
  - Aadhaar-based citizen verification
  - Secure document management
  - Verified citizen badge system

### Dashboard & Analytics
- **Real-time Statistics**: Total complaints, pending, in-progress, and resolved counts
- **Visual Analytics**: Priority distribution, department breakdown, category analysis
- **AI Insights**: Automated trend detection and actionable recommendations
- **Filtering System**: Filter by priority, status, category, and location

## 🛠️ Technology Stack

**Frontend:**
- HTML5, CSS3 (Vanilla CSS with CSS Variables)
- JavaScript (ES6+)
- Google Maps JavaScript API
- Canvas API for charts

**Backend:**
- Node.js & Express.js
- Axios for API calls
- CORS middleware
- dotenv for configuration

**APIs:**
- Google Maps Geocoding API
- Google Maps JavaScript API
- DigiLocker OAuth 2.0 API

## 📋 Prerequisites

Before you begin, ensure you have:

1. **Node.js** (v14 or higher) - [Download here](https://nodejs.org/)
2. **Google Maps API Key** with the following APIs enabled:
   - Maps JavaScript API
   - Geocoding API
   - Places API
3. **DigiLocker API Credentials**:
   - Client ID
   - Client Secret
   - Register at: https://digilocker.meripehchaan.gov.in/

## 🚀 Getting Started

### 1. Clone or Download

```bash
cd grievance-system
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the project root by copying `.env.example`:

```bash
copy .env.example .env
```

Edit the `.env` file and add your API credentials:

```env
# Server Configuration
PORT=3000

# Google Maps API
GOOGLE_MAPS_API_KEY=your_actual_google_maps_api_key

# DigiLocker API
DIGILOCKER_CLIENT_ID=your_actual_client_id
DIGILOCKER_CLIENT_SECRET=your_actual_client_secret
DIGILOCKER_REDIRECT_URI=http://localhost:3000/api/digilocker/callback
```

### 4. Start the Server

```bash
npm start
```

For development with auto-reload:

```bash
npm run dev
```

### 5. Open the Application

Open your browser and navigate to:
```
http://localhost:3000
```

## 📖 Usage Guide

### For Citizens

1. **Submit a Complaint**:
   - Click "Submit Complaint" in the navigation
   - Fill in your details (name, contact, email)
   - Enter or select your location using Google Maps autocomplete
   - (Optional) Verify your identity using DigiLocker
   - Describe your complaint in detail
   - Submit - the AI will automatically classify and route it!

2. **Track Your Complaint**:
   - View status in the Dashboard
   - See AI-assigned priority and department routing
   - Track resolution progress

### For Administrators

1. **Dashboard**:
   - View real-time statistics
   - Filter complaints by priority and status
   - Click on any complaint to see detailed AI analysis

2. **Analytics**:
   - View priority distribution charts
   - Analyze department workload
   - Review AI-generated insights
   - Identify complaint hotspots on the map

3. **Complaint Management**:
   - Click on any complaint to view details
   - Update status (Pending → In Progress → Resolved)
   - View AI analysis including urgency, severity, and impact scores

## 🗺️ Google Maps Features

### Location Selection
- **Autocomplete**: Type an address and get suggestions
- **Pin on Map**: Click anywhere on the map to set exact location
- **Current Location**: Use browser geolocation (coming soon)

### Complaint Visualization
- **Map View**: See all complaints plotted on an interactive map
- **Color-Coded Markers**: Red (Critical), Orange (High), Blue (Medium), Green (Low)
- **Info Windows**: Click markers to see complaint details
- **Clustering**: Complaints in close proximity are grouped for better performance

## 🔐 DigiLocker Integration

### Verification Flow

1. Click "Verify with DigiLocker" button
2. Redirected to DigiLocker login page
3. Login with your Aadhaar-linked mobile number
4. Authorize the app to access your basic details
5. Automatically redirected back with verified status
6. Your name and verification status are pre-filled

### Benefits
- **Trust & Authenticity**: Verified complaints get higher credibility
- **Reduced Fraud**: Aadhaar-based verification prevents fake complaints
- **Faster Processing**: Verified citizens may get priority handling

## 🧠 AI/NLP Capabilities

### Category Detection
The system analyzes complaint text for keywords to classify into:
- **Infrastructure**: roads, bridges, buildings, potholes
- **Sanitation**: garbage, waste, drainage, cleanliness
- **Safety**: crime, accidents, security issues
- **Utilities**: water, electricity, gas supply
- **Healthcare**: hospitals, medical emergencies
- **Education**: schools, teachers, facilities
- **Administration**: documents, permits, delays

### Priority Calculation
Uses a weighted algorithm considering:
- **Urgency** (50%): Keywords like "emergency", "urgent", "critical"
- **Severity** (30%): Keywords like "broken", "collapsed", "leaking"
- **Impact** (20%): Community-wide vs individual issues

### Multi-Language Support
- Detects English, Hindi, and mixed-language input
- Basic keyword matching for Hindi complaints
- Future: Advanced NLP models for better Hindi support

## 📊 API Endpoints

### Health Check
```
GET /api/health
```
Returns server status and API configuration status.

### Google Maps

```
POST /api/geocode
Body: { "address": "Connaught Place, Delhi" }
Returns: { lat, lng, formattedAddress, placeId }
```

```
POST /api/reverse-geocode
Body: { "lat": 28.6139, "lng": 77.2090 }
Returns: { address, placeId, components }
```

```
GET /api/maps-config
Returns: { apiKey: "..." }
```

### DigiLocker

```
GET /api/digilocker/auth
Returns: { authUrl: "..." }
```

```
GET /api/digilocker/callback?code=...
Handles OAuth callback and redirects to frontend
```

```
POST /api/digilocker/documents
Body: { "accessToken": "..." }
Returns: { documents: [...] }
```

### Complaints

```
POST /api/complaints
Body: { citizen: {...}, description: "...", location: {...} }
Returns: { success: true, complaint: {...} }
```

## 🎨 Design System

The application uses a modern dark theme with:
- **Primary Gradient**: Indigo to Purple (#6366f1 → #a855f7)
- **Glassmorphism**: Frosted glass effects with backdrop blur
- **Micro-animations**: Smooth hover effects and transitions
- **Responsive Design**: Mobile-first approach
- **Typography**: Inter font family for clean, modern look

## 🔧 Configuration

### Port Configuration
Default port is 3000. To change:
```env
PORT=8080
```

### CORS Configuration
By default, allows requests from localhost. To add more origins:
```env
ALLOWED_ORIGINS=http://localhost:3000,http://example.com
```

### DigiLocker Environment
For production, update the base URL:
```env
DIGILOCKER_BASE_URL=https://api.digitallocker.gov.in/public/oauth2/1
```

## 🐛 Troubleshooting

### Server won't start
- Check if port 3000 is already in use
- Verify Node.js is installed: `node --version`
- Delete `node_modules` and run `npm install` again

### Google Maps not loading
- Verify API key is correct in `.env`
- Check that Maps JavaScript API is enabled in Google Cloud Console
- Check browser console for errors

### DigiLocker verification fails
- Verify Client ID and Secret are correct
- Check redirect URI matches exactly: `http://localhost:3000/api/digilocker/callback`
- For sandbox testing, use DigiLocker test credentials

### Complaints not saving
- Check browser console for errors
- Verify server is running
- Check that frontend can reach backend (CORS errors)

## 📝 Future Enhancements

- [ ] Database integration (MongoDB/PostgreSQL)
- [ ] User authentication and role-based access
- [ ] Email/SMS notifications
- [ ] Mobile app (React Native)
- [ ] Advanced NLP with transformer models
- [ ] Multi-language UI
- [ ] Complaint status updates via SMS
- [ ] Integration with government ticketing systems
- [ ] Image upload for evidence
- [ ] Real-time chat support

## 📄 License

MIT License - feel free to use this project for learning or in production.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## 📧 Support

For support, please create an issue in the repository or contact the maintainers.

---

**Built with ❤️ for better governance and citizen engagement**
