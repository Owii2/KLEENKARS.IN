const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command) {
    console.log("Kleenkars Staff Management Helper Script");
    console.log("=========================================");
    console.log("Usage:");
    console.log("  node scratch-reset-admin.js list");
    console.log("  node scratch-reset-admin.js create <name> <phone> <role> <password> [email] [employeeCode]");
    console.log("  node scratch-reset-admin.js reset <phone_or_code> <new_password>");
    console.log("  node scratch-reset-admin.js set-role <phone_or_code> <new_role>");
    console.log("\nRoles: admin, manager, supervisor, washer, detailer, pickup_driver, cashier");
    console.log("\nEmployees currently in database:");
    const employees = await prisma.employee.findMany();
    employees.forEach(e => {
      console.log(`- [${e.employeeCode}] ${e.name} (${e.role}) - Phone: ${e.phoneNumber || 'N/A'}, Email: ${e.email || 'N/A'}, Status: ${e.status}`);
    });
    return;
  }

  if (command === "list") {
    const employees = await prisma.employee.findMany();
    console.log(JSON.stringify(employees, null, 2));
  } else if (command === "create") {
    const [_, name, phone, role, password, email, code] = args;
    if (!name || !phone || !role || !password) {
      console.error("Error: name, phone, role, and password are required.");
      return;
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const employeeCode = code || `KKS${Math.floor(100 + Math.random() * 900)}`;
    const newEmp = await prisma.employee.create({
      data: {
        employeeCode,
        name,
        phoneNumber: phone,
        password: hashedPassword,
        role,
        email: email || null,
        status: "active",
        salaryPerDay: 0,
        joiningDate: new Date(),
        isActive: true,
      }
    });
    console.log("Employee created successfully:", newEmp);
  } else if (command === "reset") {
    const [_, identifier, newPassword] = args;
    if (!identifier || !newPassword) {
      console.error("Error: identifier (phone or code) and new_password are required.");
      return;
    }
    const employee = await prisma.employee.findFirst({
      where: {
        OR: [
          { phoneNumber: identifier },
          { employeeCode: identifier }
        ]
      }
    });
    if (!employee) {
      console.error("Error: Employee not found with identifier:", identifier);
      return;
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const updated = await prisma.employee.update({
      where: { id: employee.id },
      data: { password: hashedPassword }
    });
    console.log("Password reset successfully for:", updated.name);
  } else if (command === "set-role") {
    const [_, identifier, newRole] = args;
    if (!identifier || !newRole) {
      console.error("Error: identifier (phone or code) and new_role are required.");
      return;
    }
    const employee = await prisma.employee.findFirst({
      where: {
        OR: [
          { phoneNumber: identifier },
          { employeeCode: identifier }
        ]
      }
    });
    if (!employee) {
      console.error("Error: Employee not found with identifier:", identifier);
      return;
    }
    const updated = await prisma.employee.update({
      where: { id: employee.id },
      data: { role: newRole }
    });
    console.log(`Role updated to ${newRole} for:`, updated.name);
  } else {
    console.error("Unknown command:", command);
  }
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
