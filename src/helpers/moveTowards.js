export function moveTowards(person, destinationPosition, speed) {
  let distanceToTravelX = destinationPosition.x - person.position.x;
  let distanceToTravelY = destinationPosition.y - person.position.y;

  let distance = Math.sqrt(distanceToTravelX ** 2 + distanceToTravelY ** 2);

  if (distance <= speed) {
    // Snap to destination (rounded to ensure integer position)
    person.position.x = Math.round(destinationPosition.x);
    person.position.y = Math.round(destinationPosition.y);
  } else {
    // For cardinal movement, move along one axis at a time to avoid floating point issues
    if (Math.abs(distanceToTravelX) > Math.abs(distanceToTravelY)) {
      // Moving primarily horizontally
      person.position.x += Math.sign(distanceToTravelX) * speed;
      // Snap Y if it's a small discrepancy (prevents drift)
      if (Math.abs(distanceToTravelY) > 0 && Math.abs(distanceToTravelY) <= speed) {
        person.position.y = Math.round(destinationPosition.y);
      }
    } else if (Math.abs(distanceToTravelY) > 0) {
      // Moving primarily vertically
      person.position.y += Math.sign(distanceToTravelY) * speed;
      // Snap X if it's a small discrepancy (prevents drift)
      if (Math.abs(distanceToTravelX) > 0 && Math.abs(distanceToTravelX) <= speed) {
        person.position.x = Math.round(destinationPosition.x);
      }
    }

    // Recalculate remaining distance after the move
    distanceToTravelX = destinationPosition.x - person.position.x;
    distanceToTravelY = destinationPosition.y - person.position.y;
    distance = Math.sqrt(distanceToTravelX ** 2 + distanceToTravelY ** 2);
  }

  return distance;
}