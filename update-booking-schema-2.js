/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

// Find the Booking model content
const bookingModelRegex = /(model Booking \{)([\s\S]*?)(\n\s*customerRating\s*Int\?)/m;
const match = schema.match(bookingModelRegex);

if (match) {
  let bookingBlock = match[2];
  
  // Remove old fields
  bookingBlock = bookingBlock.replace(/\s*vehicleType\s*String/, '');
  bookingBlock = bookingBlock.replace(/\s*serviceType\s*String/, '');
  bookingBlock = bookingBlock.replace(/\s*addons\s*String\[\]/, '');

  // Add new field
  if (!bookingBlock.includes('details Json?')) {
    bookingBlock += '\n  details Json? // [{ vehicleType, serviceId, addons: [id] }]';
  }
  
  schema = schema.replace(bookingModelRegex, `$1${bookingBlock}$3`);
}

fs.writeFileSync('prisma/schema.prisma', schema);
