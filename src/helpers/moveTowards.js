// export function moveTowards(person, destinationPosition, speed) {
//   let distanceToTravelX = destinationPosition.x - person.position.x;
//   let distanceToTravelY = destinationPosition.y - person.position.y;

//   let distance = Math.sqrt(distanceToTravelX ** 2 + distanceToTravelY ** 2);

//   if (distance <= speed) {
//     // If we're close enough, snap to destination (ensures integer position)
//     person.position.x = destinationPosition.x;
//     person.position.y = destinationPosition.y;
//   } else {
//     // For cardinal movement, move along one axis at a time to avoid floating point issues
//     if (Math.abs(distanceToTravelX) > Math.abs(distanceToTravelY)) {
//       // Moving primarily horizontally
//       person.position.x += Math.sign(distanceToTravelX) * speed;
//     } else if (Math.abs(distanceToTravelY) > 0) {
//       // Moving primarily vertically
//       person.position.y += Math.sign(distanceToTravelY) * speed;
//     }

//     // Recalculate remaining distance after the move
//     distanceToTravelX = destinationPosition.x - person.position.x;
//     distanceToTravelY = destinationPosition.y - person.position.y;
//     distance = Math.sqrt(distanceToTravelX ** 2 + distanceToTravelY ** 2);
//   }

//   return distance;
// }

export function moveTowards(person, destinationPosition, speed) {
let distanceToTravelX = destinationPosition.x - person.position.x;
let distanceToTravelY = destinationPosition.y - person.position.y;

let distance = Math.sqrt(distanceToTravelX ** 2 + distanceToTravelY ** 2);

if (distance <= speed) {
  // If we're close enough, just move directly to the destination
  person.position.x = destinationPosition.x;
  person.position.y = destinationPosition.y;
} else {
  // Otherwise, move by the specified speed in the direction of the destination
  let normalizedX = distanceToTravelX / distance;
  let normalizedY = distanceToTravelY / distance;

  person.position.x += normalizedX * speed;
  person.position.y += normalizedY * speed;

  // Recalculate remaining distance after the move
  distanceToTravelX = destinationPosition.x - person.position.x;
  distanceToTravelY = destinationPosition.y - person.position.y;
  distance = Math.sqrt(distanceToTravelX ** 2 + distanceToTravelY ** 2);
}

return distance;
}