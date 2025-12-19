/**
 * Reverse Geocoding Utility
 * Converts latitude/longitude coordinates to human-readable place names
 */

export interface PlaceName {
    name: string;
    address?: string;
}

/**
 * Get place name from coordinates using OpenStreetMap Nominatim API
 * Free, no API key required, but has rate limits
 */
export const getPlaceName = async (
    latitude: number,
    longitude: number
): Promise<PlaceName> => {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
            {
                headers: {
                    'User-Agent': 'CycleTracker/1.0', // Required by Nominatim
                },
            }
        );

        if (!response.ok) {
            throw new Error('Geocoding request failed');
        }

        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }

        // Extract readable address
        const address = data.address;
        let placeName = '';
        let fullAddress = '';

        // Try to get a meaningful name
        if (address.road) {
            placeName = address.road;
            if (address.house_number) {
                placeName = `${address.house_number} ${placeName}`;
            }
        } else if (address.neighbourhood || address.suburb) {
            placeName = address.neighbourhood || address.suburb || '';
        } else if (address.city || address.town || address.village) {
            placeName = address.city || address.town || address.village || '';
        } else if (address.state) {
            placeName = address.state;
        } else {
            placeName = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        }

        // Build full address
        const addressParts = [
            address.road,
            address.neighbourhood,
            address.suburb,
            address.city || address.town || address.village,
            address.state,
            address.country,
        ].filter(Boolean);

        fullAddress = addressParts.join(', ');

        return {
            name: placeName,
            address: fullAddress || placeName,
        };
    } catch (error) {
        console.error('Geocoding error:', error);
        // Fallback to coordinates if geocoding fails
        return {
            name: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
            address: `Latitude: ${latitude.toFixed(4)}, Longitude: ${longitude.toFixed(4)}`,
        };
    }
};

/**
 * Get place names for start and end points
 */
export const getTripPlaceNames = async (
    startLat: number,
    startLon: number,
    endLat: number,
    endLon: number
): Promise<{ start: PlaceName; end: PlaceName }> => {
    try {
        // Fetch both in parallel for better performance
        const [startPlace, endPlace] = await Promise.all([
            getPlaceName(startLat, startLon),
            getPlaceName(endLat, endLon),
        ]);

        return { start: startPlace, end: endPlace };
    } catch (error) {
        console.error('Error getting trip place names:', error);
        return {
            start: {
                name: `${startLat.toFixed(4)}, ${startLon.toFixed(4)}`,
                address: `Latitude: ${startLat.toFixed(4)}, Longitude: ${startLon.toFixed(4)}`,
            },
            end: {
                name: `${endLat.toFixed(4)}, ${endLon.toFixed(4)}`,
                address: `Latitude: ${endLat.toFixed(4)}, Longitude: ${endLon.toFixed(4)}`,
            },
        };
    }
};

