// ============================================
// Google Maps & DigiLocker Integration
// jan-sunvai Enhancement Module
// ============================================

const API_BASE_URL = 'http://localhost:3000/api';

// ============================================
// Google Maps Integration
// ============================================

class MapsIntegration {
    constructor() {
        this.map = null;
        this.markers = [];
        this.autocomplete = null;
        this.selectedLocation = null;
        this.apiKey = null;
        this.init();
    }

    async init() {
        try {
            // Fetch Google Maps API key from backend
            const response = await fetch(`${API_BASE_URL}/maps-config`);
            const data = await response.json();

            if (data.success && data.configured) {
                this.apiKey = data.apiKey;
                await this.loadGoogleMapsScript();
                this.initializeMaps();
            } else {
                console.warn('Google Maps API not configured');
                this.showMapError('Google Maps not configured. Please add API key in .env file.');
            }
        } catch (error) {
            console.error('Error loading Google Maps:', error);
            this.showMapError('Failed to load Google Maps');
        }
    }

    loadGoogleMapsScript() {
        return new Promise((resolve, reject) => {
            if (window.google && window.google.maps) {
                resolve();
                return;
            }

            const script = document.getElementById('google-maps-script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${this.apiKey}&libraries=places&callback=initMap`;

            window.initMap = () => {
                resolve();
            };

            script.onerror = () => reject(new Error('Failed to load Google Maps script'));
        });
    }

    initializeMaps() {
        // Initialize autocomplete for location input
        const locationInput = document.getElementById('citizen-location');
        if (locationInput && window.google) {
            this.autocomplete = new google.maps.places.Autocomplete(locationInput, {
                types: ['geocode'],
                componentRestrictions: { country: 'in' } // Restrict to India
            });

            this.autocomplete.addListener('place_changed', () => {
                const place = this.autocomplete.getPlace();
                if (place.geometry) {
                    this.selectedLocation = {
                        lat: place.geometry.location.lat(),
                        lng: place.geometry.location.lng(),
                        address: place.formatted_address
                    };

                    // Update complaint form map
                    if (this.formMap) {
                        this.updateFormMap(this.selectedLocation);
                    }
                }
            });
        }

        // Initialize map for complaint submission form
        this.initFormMap();

        // Initialize main map view
        this.initMainMap();
    }

    initFormMap() {
        const mapElement = document.getElementById('complaint-map');
        if (!mapElement || !window.google) return;

        // Default center (India)
        const defaultCenter = { lat: 20.5937, lng: 78.9629 };

        this.formMap = new google.maps.Map(mapElement, {
            center: defaultCenter,
            zoom: 5,
            styles: this.getDarkMapStyle()
        });

        // Add click listener to set location
        this.formMap.addListener('click', (event) => {
            this.setLocationFromMap(event.latLng);
        });

        // Try to get user's current location
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const userLocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    this.formMap.setCenter(userLocation);
                    this.formMap.setZoom(13);
                },
                () => {
                    console.log('Geolocation permission denied');
                }
            );
        }
    }

    async setLocationFromClick(latLng) {
        const lat = latLng.lat();
        const lng = latLng.lng();

        try {
            // Reverse geocode to get address
            const response = await fetch(`${API_BASE_URL}/reverse-geocode`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lat, lng })
            });

            const data = await response.json();

            if (data.success) {
                this.selectedLocation = {
                    lat,
                    lng,
                    address: data.address
                };

                // Update input field
                document.getElementById('citizen-location').value = data.address;

                // Update marker on map
                this.updateFormMap(this.selectedLocation);
            }
        } catch (error) {
            console.error('Reverse geocode error:', error);
        }
    }

    updateFormMap(location) {
        if (!this.formMap) return;

        // Clear existing markers
        if (this.formMapMarker) {
            this.formMapMarker.setMap(null);
        }

        // Add new marker
        this.formMapMarker = new google.maps.Marker({
            position: { lat: location.lat, lng: location.lng },
            map: this.formMap,
            animation: google.maps.Animation.DROP,
            title: 'Complaint Location'
        });

        // Center map on location
        this.formMap.setCenter({ lat: location.lat, lng: location.lng });
        this.formMap.setZoom(15);
    }

    initMainMap() {
        const mapElement = document.getElementById('main-map');
        if (!mapElement || !window.google) return;

        const defaultCenter = { lat: 20.5937, lng: 78.9629 };

        this.mainMap = new google.maps.Map(mapElement, {
            center: defaultCenter,
            zoom: 5,
            styles: this.getDarkMapStyle()
        });
    }

    async plotComplaintsOnMap(complaints) {
        if (!this.mainMap) return;

        // Clear existing markers
        this.markers.forEach(marker => marker.setMap(null));
        this.markers = [];

        const bounds = new google.maps.LatLngBounds();
        let validLocations = 0;

        for (const complaint of complaints) {
            if (complaint.location && complaint.location.lat && complaint.location.lng) {
                const marker = new google.maps.Marker({
                    position: { lat: complaint.location.lat, lng: complaint.location.lng },
                    map: this.mainMap,
                    title: complaint.citizen.name,
                    icon: this.getMarkerIcon(complaint.priority.level)
                });

                // Add info window
                const infoWindow = new google.maps.InfoWindow({
                    content: this.getInfoWindowContent(complaint)
                });

                marker.addListener('click', () => {
                    // Close all other info windows
                    this.markers.forEach(m => {
                        if (m.infoWindow) m.infoWindow.close();
                    });

                    infoWindow.open(this.mainMap, marker);
                });

                marker.infoWindow = infoWindow;
                this.markers.push(marker);
                bounds.extend(marker.getPosition());
                validLocations++;
            }
        }

        // Fit map toplots if there are any
        if (validLocations > 0) {
            this.mainMap.fitBounds(bounds);
        }
    }

    getMarkerIcon(priority) {
        const colors = {
            critical: '#ef4444',
            high: '#f59e0b',
            medium: '#3b82f6',
            low: '#10b981'
        };

        return {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: colors[priority] || '#3b82f6',
            fillOpacity: 0.9,
            strokeColor: '#ffffff',
            strokeWeight: 2
        };
    }

    getInfoWindowContent(complaint) {
        return `
            <div class="map-info-window">
                <h4>${complaint.citizen.name}</h4>
                <p><strong>Location:</strong> ${complaint.citizen.location}</p>
                <p><strong>Category:</strong> ${complaint.category}</p>
                <p><strong>Priority:</strong> <span class="badge badge-${complaint.priority.level}">${complaint.priority.level}</span></p>
                <p><strong>Status:</strong> <span class="badge badge-${complaint.status}">${complaint.status}</span></p>
                <p style="margin-top: 8px;">${complaint.description.substring(0, 100)}...</p>
            </div>
        `;
    }

    getDarkMapStyle() {
        return [
            { elementType: 'geometry', stylers: [{ color: '#1a1a2e' }] },
            { elementType: 'labels.text.stroke', stylers: [{ color: '#1a1a2e' }] },
            { elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
            {
                featureType: 'administrative.locality',
                elementType: 'labels.text.fill',
                stylers: [{ color: '#6366f1' }]
            },
            {
                featureType: 'poi',
                elementType: 'labels.text.fill',
                stylers: [{ color: '#64748b' }]
            },
            {
                featureType: 'poi.park',
                elementType: 'geometry',
                stylers: [{ color: '#16a34a' }, { lightness: -30 }]
            },
            {
                featureType: 'road',
                elementType: 'geometry',
                stylers: [{ color: '#14141f' }]
            },
            {
                featureType: 'road',
                elementType: 'geometry.stroke',
                stylers: [{ color: '#1a1a2e' }]
            },
            {
                featureType: 'road.highway',
                elementType: 'geometry',
                stylers: [{ color: '#4f46e5' }, { lightness: -20 }]
            },
            {
                featureType: 'water',
                elementType: 'geometry',
                stylers: [{ color: '#0ea5e9' }, { lightness: -50 }]
            },
            {
                featureType: 'water',
                elementType: 'labels.text.fill',
                stylers: [{ color: '#64748b' }]
            }
        ];
    }

    showMapError(message) {
        const mapContainers = document.querySelectorAll('.map-container, .main-map-container');
        mapContainers.forEach(container => {
            container.innerHTML = `<div class="map-loading">${message}</div>`;
        });
    }
}

// ============================================
// DigiLocker Integration
// ============================================

class DigiLockerIntegration {
    constructor() {
        this.isVerified = false;
        this.userData = null;
        this.init();
    }

    init() {
        // Check if user just returned from DigiLocker callback
        const urlParams = new URLSearchParams(window.location.search);
        const verified = urlParams.get('digilocker_verified');
        const userDataEncoded = urlParams.get('user_data');

        if (verified === 'true' && userDataEncoded) {
            try {
                this.userData = JSON.parse(decodeURIComponent(userDataEncoded));
                this.isVerified = true;
                this.showVerificationSuccess();
                this.prefillForm();

                // Clean URL
                window.history.replaceState({}, document.title, window.location.pathname);
            } catch (error) {
                console.error('Error parsing DigiLocker user data:', error);
            }
        }

        // Setup event listener for verification button
        const verifyBtn = document.getElementById('digilocker-verify-btn');
        if (verifyBtn) {
            verifyBtn.addEventListener('click', () => this.startVerification());
        }
    }

    async startVerification() {
        try {
            const response = await fetch(`${API_BASE_URL}/digilocker/auth`);
            const data = await response.json();

            if (data.success && data.authUrl) {
                // Redirect to DigiLocker
                window.location.href = data.authUrl;
            } else {
                alert('DigiLocker API not configured. Please add credentials in .env file.');
            }
        } catch (error) {
            console.error('DigiLocker auth error:', error);
            alert('Failed to initialize DigiLocker verification');
        }
    }

    showVerificationSuccess() {
        const statusBadge = document.getElementById('verification-status');
        if (statusBadge) {
            statusBadge.textContent = 'Verified';
            statusBadge.style.display = 'inline-flex';
        }

        const verifyBtn = document.getElementById('digilocker-verify-btn');
        if (verifyBtn) {
            verifyBtn.disabled = true;
            verifyBtn.style.opacity = '0.5';
        }

        // Show toast notification
        if (window.app) {
            app.showToast('✓ Identity verified via DigiLocker!');
        }
    }

    prefillForm() {
        if (!this.userData) return;

        const nameInput = document.getElementById('citizen-name');
        if (nameInput && this.userData.name) {
            nameInput.value = this.userData.name;
        }
    }

    getVerificationStatus() {
        return {
            isVerified: this.isVerified,
            userData: this.userData
        };
    }
}

// ============================================
// Enhanced Complaint Submission with Location
// ============================================

function enhanceComplaintSubmission() {
    const originalSubmit = window.app.submitComplaint.bind(window.app);

    window.app.submitComplaint = function (formData) {
        // Add location data from maps integration
        if (window.mapsIntegration && window.mapsIntegration.selectedLocation) {
            formData.location = {
                ...formData.location,
                lat: window.mapsIntegration.selectedLocation.lat,
                lng: window.mapsIntegration.selectedLocation.lng,
                address: formData.location || window.mapsIntegration.selectedLocation.address
            };
        }

        // Add DigiLocker verification data
        if (window.digiLockerIntegration) {
            const verificationStatus = window.digiLockerIntegration.getVerificationStatus();
            formData.digilockerVerified = verificationStatus.isVerified;
            if (verificationStatus.isVerified) {
                formData.verifiedUserData = verificationStatus.userData;
            }
        }

        // Call original submit function
        return originalSubmit(formData);
    };
}

// ============================================
// Enhance View Switching for Map View
// ============================================

function enhanceViewSwitching() {
    const originalSwitchView = window.app.switchView.bind(window.app);

    window.app.switchView = function (viewName) {
        originalSwitchView(viewName);

        // When switching to map view, plot all complaints
        if (viewName === 'map' && window.mapsIntegration) {
            setTimeout(() => {
                const complaints = this.complaints.filter(c => c.location && c.location.lat);
                window.mapsIntegration.plotComplaintsOnMap(complaints);
            }, 100);
        }
    };

    // Add filter listeners for map view
    const mapCategoryFilter = document.getElementById('map-category-filter');
    const mapPriorityFilter = document.getElementById('map-priority-filter');

    if (mapCategoryFilter) {
        mapCategoryFilter.addEventListener('change', filterMapComplaints);
    }

    if (mapPriorityFilter) {
        mapPriorityFilter.addEventListener('change', filterMapComplaints);
    }
}

function filterMapComplaints() {
    const category = document.getElementById('map-category-filter').value;
    const priority = document.getElementById('map-priority-filter').value;

    let filteredComplaints = window.app.complaints.filter(c => c.location && c.location.lat);

    if (category) {
        filteredComplaints = filteredComplaints.filter(c => c.category === category);
    }

    if (priority) {
        filteredComplaints = filteredComplaints.filter(c => c.priority.level === priority);
    }

    if (window.mapsIntegration) {
        window.mapsIntegration.plotComplaintsOnMap(filteredComplaints);
    }
}

// ============================================
// Initialize Enhancements
// ============================================

// Wait for DOM and original app to be ready
window.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for the original app to initialize
    setTimeout(() => {
        console.log('Initializing jan-sunvai API integrations...');

        // Initialize Google Maps
        window.mapsIntegration = new MapsIntegration();

        // Initialize DigiLocker
        window.digiLockerIntegration = new DigiLockerIntegration();

        // Enhance app functionality
        if (window.app) {
            enhanceComplaintSubmission();
            enhanceViewSwitching();
            console.log('✓ API integrations initialized successfully');
        }
    }, 500);
});
