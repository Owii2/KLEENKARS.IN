/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

if (!schema.includes('model ApprovalRequest')) {
  schema += `\nmodel ApprovalRequest {\n  id String @id @default(cuid())\n  entityType String\n  entityId String?\n  action String\n  managerId String\n  managerName String?\n  previousData String? // JSON snapshot\n  newData String? // JSON snapshot\n  status String @default("PENDING")\n  createdAt DateTime @default(now())\n  expiresAt DateTime\n}\n`;
}

if (!schema.includes('model SystemSetting')) {
  schema += `\nmodel SystemSetting {\n  id String @id @default(cuid())\n  key String @unique\n  value String\n  updatedAt DateTime @default(now()) @updatedAt\n}\n`;
}

fs.writeFileSync('prisma/schema.prisma', schema);
