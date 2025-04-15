
import { Flight, RouteTargetTime } from '@/types';

export const calculateRouteStats = (flights: Flight[], targets: RouteTargetTime[]) => {
  // Group flights by route
  const flightsByRoute = flights.reduce((acc, flight) => {
    const route = flight.route || 'Unknown';
    if (!acc[route]) {
      acc[route] = [];
    }
    acc[route].push(flight);
    return acc;
  }, {} as Record<string, Flight[]>);

  const routeStats = Object.entries(flightsByRoute).map(([route, flights]) => {
    const targetTime = targets.find(t => 
      t.route === route && 
      (!t.aircraftId || t.aircraftId === flights[0]?.aircraftId) && 
      (!t.pilotId || t.pilotId === flights[0]?.pilotId) &&
      (!t.month || t.month === new Date().getMonth() + 1) &&
      (!t.year || t.year === new Date().getFullYear())
    );

    const count = flights.length;
    const totalHobbs = flights.reduce((sum, f) => sum + f.hobbsTime, 0);
    const avgHobbs = count > 0 ? totalHobbs / count : 0;
    
    const filteredFlights = flights.filter(f => f.aircraftId && f.pilotId);
    
    // Additional stats
    const varianceFromTarget = targetTime ? avgHobbs - targetTime.targetTime : 0;
    const percentFromTarget = targetTime?.targetTime ? (avgHobbs / targetTime.targetTime) * 100 - 100 : 0;
    const timeUnderOver = targetTime?.targetTime > avgHobbs ? 'under' : 'over';
    const formattedPercentFromTarget = Math.abs(Math.round(percentFromTarget)) + '% ' + timeUnderOver;
    
    return {
      route,
      count,
      totalHobbs,
      avgHobbs,
      varianceFromTarget,
      formattedPercentFromTarget,
      targetTime: targetTime?.targetTime || 0,
      flights
    };
  });

  return routeStats;
};
