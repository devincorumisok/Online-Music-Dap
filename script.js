document.addEventListener('DOMContentLoaded', function() {
    function redirectToGoogleMaps(lat, lon, isStreetViewAvailable) {
        if (isStreetViewAvailable) {
            window.location.href = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lon}`;
        } else {
            window.location.href = `https://www.google.com/maps?q=${lat},${lon}`;
        }
    }

    function checkStreetViewAvailability(lat, lon) {
        const streetViewUrl = `https://maps.googleapis.com/maps/api/streetview/metadata?location=${lat},${lon}&key=YOUR_GOOGLE_API_KEY`;

        fetch(streetViewUrl)
            .then(response => response.json())
            .then(data => {
                const isStreetViewAvailable = data.status === 'OK' && data.copyright !== undefined;
                redirectToGoogleMaps(lat, lon, isStreetViewAvailable);
            })
            .catch(() => {
                console.error('Error checking Street View availability.');
                redirectToGoogleMaps(lat, lon, false);
            });
    }

    function getUserLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                position => {
                    const { latitude, longitude } = position.coords;
                    checkStreetViewAvailability(latitude, longitude);
                },
                error => {
                    console.error('Error getting location:', error);
                    alert('Unable to fetch location. Redirecting to a default location.');
                    window.location.href = 'https://www.google.com/maps?q=40.712776,-74.005974'; // Default location
                }
            );
        } else {
            alert('Geolocation is not supported by this browser.');
        }
    }

    document.querySelector('.message').textContent = 'Locating...';
    getUserLocation();
});