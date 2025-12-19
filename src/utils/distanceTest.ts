// Test distance calculation accuracy
export const testDistanceCalculation = () => {
    function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
        const R = 6371; // Radius of the earth in km
        const dLat = deg2rad(lat2 - lat1);
        const dLon = deg2rad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c; // Distance in km
        
        // Round to avoid floating point precision issues
        return Math.round(distance * 100000) / 100000; // Round to 5 decimal places
    }

    function deg2rad(deg: number) {
        return deg * (Math.PI / 180);
    }

    // Test cases
    console.log('=== Distance Calculation Tests ===');
    
    // Test 1: Same location (should be 0)
    const dist1 = getDistanceFromLatLonInKm(13.0386, 77.6191, 13.0386, 77.6191);
    console.log(`Same location: ${dist1} km (should be 0)`);
    
    // Test 2: 100 meters apart (should be ~0.1 km)
    const dist2 = getDistanceFromLatLonInKm(13.0386, 77.6191, 13.0395, 77.6191);
    console.log(`~100m apart: ${dist2} km (should be ~0.1)`);
    
    // Test 3: 1 km apart
    const dist3 = getDistanceFromLatLonInKm(13.0386, 77.6191, 13.0476, 77.6191);
    console.log(`~1km apart: ${dist3} km (should be ~1.0)`);
    
    // Test 4: Very small movement (GPS noise level)
    const dist4 = getDistanceFromLatLonInKm(13.0386, 77.6191, 13.03861, 77.61911);
    console.log(`GPS noise level: ${dist4} km (should be very small)`);
    
    console.log('=== End Tests ===');
};

// Call this in development to test
if (__DEV__) {
    // testDistanceCalculation();
}