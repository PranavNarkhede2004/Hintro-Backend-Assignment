export class PricingService {
    private static BASE_FARE = 50;
    private static RATE_PER_KM = 12;
    private static MIN_FARE = 60;

    /**
     * Calculates the price for a ride based on distance and demand.
     * @param distanceKm Distance of the ride in km
     * @param activeRequests Number of currently active requests in the area (mocked or real)
     * @param availableVehicles Number of available vehicles in the area
     * @returns Calculated price
     */
    public static calculatePrice(
        distanceKm: number,
        activeRequests: number,
        availableVehicles: number
    ): number {
        let demandMultiplier = 1.0;

        if (availableVehicles > 0) {
            const demandRatio = activeRequests / availableVehicles;
            if (demandRatio > 1.5) {
                demandMultiplier = 1.2; // High demand
            } else if (demandRatio > 2.0) {
                demandMultiplier = 1.5; // Surge pricing
            }
        } else {
            // Fallback if no vehicles are tracked yet (e.g. initial state)
            if (activeRequests > 10) demandMultiplier = 1.2;
        }

        let price = (PricingService.BASE_FARE + distanceKm * PricingService.RATE_PER_KM) * demandMultiplier;

        return Math.max(Math.round(price), PricingService.MIN_FARE);
    }
}
